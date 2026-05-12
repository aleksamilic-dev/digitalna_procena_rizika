"use client";
import React, { useState, useEffect } from "react";

interface PrilogB1Data {
    id?: number;
    groupId: number;
    groupName: string;
    svo: number; // Stepen veličine opasnosti (Kolona 3)
    uticaj: number; // Uticaj delatnosti % (Kolona 4)
    iud: number | null; // Indeks uticaja delatnosti (Kolona 5)
    kvo: number | null; // Koeficijent veličine opasnosti (Kolona 6)
    ivo: number | null; // Indeks veličine opasnosti (Kolona 7)
}

interface PrilogB1TableProps {
    procenaId: string;
    readOnly?: boolean;
}

const RISK_GROUPS: { [key: number]: string } = {
    1: 'ОПШТЕ ПОСЛОВНЕ АКТИВНОСТИ',
    2: 'БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ',
    3: 'ПРАВНИ РИЗИЦИ',
    4: 'РИЗИЦИ ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА',
    5: 'РИЗИЦИ ОД ПОЖАРА',
    6: 'РИЗИЦИ ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА',
    7: 'РИЗИЦИ ОД ЕКСПЛОЗИЈЕ',
    8: 'РИЗИЦИ ОД НЕПРИМЕНЕ СТАНДАРДА',
    9: 'РИЗИЦИ ПО ЖИВОТНУ СРЕДИНУ',
    10: 'РИЗИЦИ У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА',
    11: 'ИКТ РИЗИЦИ (заштита података)'
};

export default function PrilogB1Table({ procenaId, readOnly = false }: PrilogB1TableProps) {
    const [data, setData] = useState<PrilogB1Data[]>([]);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Initialize data
    useEffect(() => {
        const initialData: PrilogB1Data[] = [];
        Object.keys(RISK_GROUPS).forEach((key) => {
            const id = parseInt(key);
            initialData.push({
                groupId: id,
                groupName: RISK_GROUPS[id],
                svo: 0,
                uticaj: 0,
                iud: null,
                kvo: null,
                ivo: null
            });
        });

        const fetchData = async () => {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-b1`);
                if (response.ok) {
                    const savedData = await response.json();
                    // Merge saved data
                    interface SavedB1Item {
                        group_id: number;
                        id: number;
                        svo: number;
                        uticaj: string;
                        iud: string;
                        kvo: string | null;
                        ivo: string | null;
                    }

                    savedData.forEach((item: SavedB1Item) => {
                        const index = initialData.findIndex(d => d.groupId === item.group_id);
                        if (index !== -1) {
                            initialData[index] = {
                                ...initialData[index],
                                id: item.id,
                                svo: item.svo,
                                uticaj: parseFloat(item.uticaj),
                                iud: parseFloat(item.iud),
                                kvo: item.kvo ? parseFloat(item.kvo) : null,
                                ivo: item.ivo ? parseFloat(item.ivo) : null
                            };
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setData(initialData);
                setLoading(false);
            }
        };

        if (procenaId) {
            fetchData();
        }
    }, [procenaId]);

    const handleCellClick = (groupId: number, field: 'svo', currentValue: number) => {
        if (readOnly) return;
        setEditingCell(`${groupId}-${field}`);
        setEditValue(currentValue.toString());
    };

    const handleInputBlur = async (groupId: number, field: 'svo') => {
        const newValue = parseInt(editValue) || 0;
        
        // Validate Svo value (must be 1-5)
        if (field === 'svo' && (newValue < 0 || newValue > 5)) {
            alert('Стepen veličine opasnosti (Сво) mora biti između 0 i 5');
            setEditingCell(null);
            setEditValue('');
            return;
        }

        // Update local state temporarily for responsiveness
        setData(prev => prev.map(item =>
            item.groupId === groupId ? { ...item, [field]: newValue } : item
        ));

        try {
            const response = await fetch(`/api/procena/${procenaId}/prilog-b1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, svo: newValue })
            });

            if (response.ok) {
                const result = await response.json();
                // Update with server calculated values
                setData(prev => prev.map(item =>
                    item.groupId === groupId ? {
                        ...item,
                        svo: result.svo,
                        uticaj: result.uticaj,
                        iud: result.iud,
                        kvo: result.kvo,
                        ivo: result.ivo
                    } : item
                ));
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }

        setEditingCell(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, groupId: number, field: 'svo') => {
        if (e.key === 'Enter') handleInputBlur(groupId, field);
        if (e.key === 'Escape') {
            setEditingCell(null);
            setEditValue('');
        }
    };

    const totalUticaj = data.reduce((sum, item) => sum + item.uticaj, 0);

    if (loading) return <div>Учитавање података...</div>;

    return (
        <div className="p-6 bg-white border-2 border-gray-800 rounded-lg mt-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Прилог Б1</h2>
                <h3 className="text-lg font-bold text-gray-800 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Утицај делатности</h4>
                <p className="font-bold text-gray-800 mb-2">Табела Б1.1 – Дистрибуција утицаја делатности на наступање ризика</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-gray-900">
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '50px' }}>РБ</th>
                            <th className="border border-gray-800 px-2 py-2 text-center">Група ризика</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '80px' }}>Степен величине опасности<br />(Сво)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Утицај делатности<br />(%)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Индекс утицаја делатности<br />(Иуд)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Коефицијент величине опасности<br />(Кво)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Индекс величине опасности<br />(Иво)</th>
                        </tr>
                        <tr className="bg-gray-50 text-xs text-gray-900 font-semibold">
                            <th className="border border-gray-800 px-1 py-1 text-center">1</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">2</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">3</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">4</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">5</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">6</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">7</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.groupId} className="hover:bg-gray-50">
                                <td className="border border-gray-800 px-2 py-2 text-center font-medium bg-yellow-50 text-gray-900">{item.groupId}</td>
                                <td className="border border-gray-800 px-2 py-2 font-medium text-gray-900">{item.groupName}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center bg-blue-50 text-gray-900">
                                    {editingCell === `${item.groupId}-svo` ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            className="w-full p-1 border rounded text-center"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => handleInputBlur(item.groupId, 'svo')}
                                            onKeyDown={(e) => handleKeyPress(e, item.groupId, 'svo')}
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className={`${!readOnly ? 'cursor-pointer hover:bg-blue-100' : ''} p-1 rounded text-gray-900 font-medium`}
                                            onClick={() => handleCellClick(item.groupId, 'svo', item.svo)}
                                        >
                                            {item.svo}
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">
                                    {item.uticaj.toFixed(2)}%
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.iud !== null ? item.iud.toFixed(4) : '-'}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.kvo !== null ? item.kvo.toFixed(2) : '-'}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.ivo !== null ? item.ivo.toFixed(4) : '-'}</td>
                            </tr>
                        ))}
                        <tr className="bg-green-100 font-bold">
                            <td className="border border-gray-800 px-2 py-2 text-center"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center text-gray-900">АГРЕГАТНО</td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200">
                                {data.reduce((sum, item) => sum + item.svo, 0)}
                            </td>
                            <td className={`border border-gray-800 px-2 py-2 text-center ${Math.abs(totalUticaj - 100) > 0.01 ? 'text-red-600' : 'text-green-800'}`}>
                                {totalUticaj.toFixed(2)}%
                            </td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {Math.abs(totalUticaj - 100) > 0.01 && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    <strong>УПОЗОРЕЊЕ:</strong> Збир могућег утицаја мора бити тачно 100%. Тренутни збир је {totalUticaj.toFixed(2)}%.
                </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-sm text-gray-800">
                <p className="font-semibold mb-2">Упутство за коришћење:</p>
                <p className="mb-1">
                    <strong>Кол. 3</strong> – Сво – степен величине опасности за посматрану организацију (са свим ограницима) по групама ризика, 
                    и уноси се према Прилогу Љ, Кол. 3
                </p>
                <p className="mb-1">
                    <strong>Кол. 4</strong> – Утицај делатности (Уд) по групама ризика према формули: 
                    Уд = Сво/ΣСво у %, тако да укупан збир буде 100%
                </p>
                <p className="mb-1">
                    <strong>Кол. 5</strong> – Индекс утицаја делатности (Иуд) децимални је приказ утицаја делатности (Уд) према Кол. 4, 
                    и служи за прорачун вероватно максималне штете
                </p>
                <p className="mb-1">
                    <strong>Кол. 6</strong> – Коефицијент величине опасности (Кво) одређује се према следећим односима: 
                    0,1 ако је Сво = 1; 0,15 ако је Сво = 2; 0,2 ако је Сво = 3; 0,25 ако је Сво = 4 и 0,3 ако је Сво = 5, 
                    и служи за прорачун индекса величине опасности (Иво) у Кол. 7
                </p>
                <p>
                    <strong>Кол. 7</strong> – Индекс величине опасности (Иво) представља однос индекса утицаја делатности (Иуд) и 
                    коефицијента величине опасности (Кво), одређује се према формули: Иво = Иуд×Кво, приказује се у 
                    децималној вредности и служи за прорачун вероватно максималне штете (ВМШШ)
                </p>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-gray-800">
                <p className="font-semibold mb-2">НАПОМЕНА:</p>
                <p>Наведени подаци морају да буду уписани у Дигитални регистар процена ризика.</p>
            </div>
        </div>
    );
}

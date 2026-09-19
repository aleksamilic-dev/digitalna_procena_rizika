"use client";
import React, { useState, useEffect, useMemo } from "react";

interface PrilogSData {
    id: number;
    karakteristika: string;
    vrednost: string;
    grupa: 'pocetno' | 'zavrsno';
}

interface PrilogSTableProps {
    procenaId: string;
    onUpdateItem?: (itemId: number, vrednost: string) => void;
    readOnly?: boolean;
}

const RISK_GROUPS: { [key: number]: string } = {
    1: 'ОПШТИХ ПОСЛОВНИХ АКТИВНОСТИ',
    2: 'ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ',
    3: 'ПРАВНИ РИЗИЦИ',
    4: 'ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА',
    5: 'ОД ПОЖАРА',
    6: 'ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА',
    7: 'ОД ЕКСПЛОЗИЈА',
    8: 'ОД НЕУСАГЛАШЕНОСТИ СА СТАНДАРДИМА',
    9: 'ПО ЖИВОТНУ СРЕДИНУ',
    10: 'У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА',
    11: 'У ОБЛАСТИ ИКТ СИСТЕМА'
};

export default function PrilogSTable({ procenaId, onUpdateItem, readOnly = false }: PrilogSTableProps) {
    const [editingCell, setEditingCell] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [prilogSData, setPrilogSData] = useState<Map<number, PrilogSData>>(new Map());

    // Definišemo osnovne karakteristike (1-18)
    const baseKarakteristike: PrilogSData[] = useMemo(() => [
        // Početno stanje - po izvršenoj proceni rizika (redovi 1-9)
        { id: 1, karakteristika: 'Време идентификације', vrednost: '', grupa: 'pocetno' },
        { id: 2, karakteristika: 'Штићени објекат', vrednost: '', grupa: 'pocetno' },
        { id: 3, karakteristika: 'Макролокација', vrednost: '', grupa: 'pocetno' },
        { id: 4, karakteristika: 'Микролокација', vrednost: '', grupa: 'pocetno' },
        { id: 5, karakteristika: 'Угрожене штићене вредности', vrednost: '', grupa: 'pocetno' },
        { id: 6, karakteristika: 'Величина опасности', vrednost: '', grupa: 'pocetno' },
        { id: 7, karakteristika: 'Предузете почетне мере', vrednost: '', grupa: 'pocetno' },
        { id: 8, karakteristika: 'Вероватна максимална штета (ВМШ)', vrednost: '', grupa: 'pocetno' },
        { id: 9, karakteristika: 'Постојеће мере заштите за ову групу ризика', vrednost: '', grupa: 'pocetno' },

        // Završno stanje - po izvršenom ažurirању (redovi 10-18)
        { id: 10, karakteristika: 'Време идентификације', vrednost: '', grupa: 'zavrsno' },
        { id: 11, karakteristika: 'Штићени објекат', vrednost: '', grupa: 'zavrsno' },
        { id: 12, karakteristika: 'Макролокација', vrednost: '', grupa: 'zavrsno' },
        { id: 13, karakteristika: 'Микролокација', vrednost: '', grupa: 'zavrsno' },
        { id: 14, karakteristika: 'Угрожене штићене вредности', vrednost: '', grupa: 'zavrsno' },
        { id: 15, karakteristika: 'Величина опасности', vrednost: '', grupa: 'zavrsno' },
        { id: 16, karakteristika: 'Предузете почетне мере', vrednost: '', grupa: 'zavrsno' },
        { id: 17, karakteristika: 'Вероватна максимална штета (ВМШ)', vrednost: '', grupa: 'zavrsno' },
        { id: 18, karakteristika: 'Постојеће мере заштите за ову групу ризика', vrednost: '', grupa: 'zavrsno' }
    ], []);

    // Generišemo proširenu listu za svih 11 grupa
    const allKarakteristike = useMemo(() => {
        const items: PrilogSData[] = [];
        Object.keys(RISK_GROUPS).forEach((key) => {
            const groupIndex = parseInt(key);
            baseKarakteristike.forEach(k => {
                items.push({
                    ...k,
                    id: groupIndex * 100 + k.id, // ID scheme: 101, 102... 1101...
                });
            });
        });
        return items;
    }, [baseKarakteristike]);

    // Učitaj podatke iz baze
    useEffect(() => {
        async function loadPrilogSData() {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-s`);
                if (response.ok) {
                    const data = await response.json();
                    const dataMap = new Map<number, PrilogSData>();

                    // Prvo dodaj sve karakteristike sa default vrednostima
                    allKarakteristike.forEach(k => {
                        dataMap.set(k.id, { ...k });
                    });

                    // Zatim ažuriraj sa podacima iz baze
                    data.forEach((item: { group_id: string | number; item_id: string | number; vrednost: string | null }) => {
                        // group_id i item_id su VARCHAR kolone - bez Number() bi se ključ spojio kao tekst
                        const compositeId = Number(item.group_id) * 100 + Number(item.item_id);
                        const existing = dataMap.get(compositeId);
                        if (existing) {
                            dataMap.set(compositeId, {
                                ...existing,
                                vrednost: item.vrednost || ''
                            });
                        }
                    });

                    setPrilogSData(dataMap);
                } else {
                    throw new Error('Failed to fetch data');
                }
            } catch (error) {
                console.error('Greška pri učitavanju Prilog S podataka:', error);
                // Ako nema podataka u bazi, koristi default karakteristike
                const defaultMap = new Map<number, PrilogSData>();
                allKarakteristike.forEach(k => defaultMap.set(k.id, k));
                setPrilogSData(defaultMap);
            }
        }

        if (procenaId) {
            loadPrilogSData();
        } else {
            // Ako nema procenaId, učitaj default karakteristike
            const defaultMap = new Map<number, PrilogSData>();
            allKarakteristike.forEach(k => defaultMap.set(k.id, k));
            setPrilogSData(defaultMap);
        }
    }, [procenaId, allKarakteristike]);

    const handleCellClick = (itemId: number, currentValue: string) => {
        if (readOnly) return; // Disable editing in read-only mode

        setEditingCell(itemId);
        setEditValue(currentValue);
    };

    const handleInputBlur = async (itemId: number) => {
        // Ažuriraj lokalno stanje
        setPrilogSData(prev => {
            const newMap = new Map(prev);
            const item = newMap.get(itemId);
            if (item) {
                newMap.set(itemId, { ...item, vrednost: editValue });
            }
            return newMap;
        });

        // Pozovi callback funkciju
        if (onUpdateItem) {
            onUpdateItem(itemId, editValue);
        }

        // Izračunaj groupId i originalItemId iz composite itemId
        const groupId = Math.floor(itemId / 100);
        const originalItemId = itemId % 100;

        // Sačuvaj u bazu
        try {
            const response = await fetch(`/api/procena/${procenaId}/prilog-s`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    groupId: groupId,
                    itemId: originalItemId,
                    vrednost: editValue
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Greška pri čuvanju Prilog S podataka:', error);
            alert('Грешка при чувању Прилога С. Покушајте поново.');
        }

        setEditingCell(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, itemId: number) => {
        if (e.key === 'Enter') {
            handleInputBlur(itemId);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditValue('');
        }
    };



    return (
        <div className="p-6 bg-white border-2 border-gray-800 rounded-lg mt-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Прилог С</h2>
                <h3 className="text-lg font-bold text-gray-800 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Карактеристике идентификованих ризика</h4>
                <p className="text-xs text-gray-500 text-right">Образац SRPS A.L2.003/3</p>
            </div>

            {Object.keys(RISK_GROUPS).map((key) => {
                const groupIndex = parseInt(key);
                const groupName = RISK_GROUPS[groupIndex];

                // Filter items for this group
                const groupItems = Array.from(prilogSData.values()).filter(item =>
                    item.id > groupIndex * 100 && item.id < (groupIndex + 1) * 100
                );

                const pocetnoStanje = groupItems
                    .filter(item => item.grupa === 'pocetno')
                    .sort((a, b) => a.id - b.id);

                const zavrsnoStanje = groupItems
                    .filter(item => item.grupa === 'zavrsno')
                    .sort((a, b) => a.id - b.id);

                return (
                    <div key={groupIndex} className="overflow-x-auto mb-8">
                        <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '60px' }}>
                                        Р.<br />бр.
                                    </th>
                                    <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '300px' }}>
                                        Карактеристике идентификованог<br />ризика
                                    </th>
                                    <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800">
                                        {groupName.split(' ').map((word, i) => (
                                            <React.Fragment key={i}>
                                                {word}<br />
                                            </React.Fragment>
                                        ))}
                                    </th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">1</th>
                                    <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">2</th>
                                    <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">3</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Početno stanje */}
                                {pocetnoStanje.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-800 px-2 py-2 text-center font-medium text-gray-800">
                                            {item.id % 100}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-800">
                                            {item.karakteristika}
                                            {index === 0 && (
                                                <div className="mt-2 text-center">
                                                    <span className="bg-yellow-200 px-2 py-1 rounded text-xs font-medium">
                                                        Почетно стање –<br />по извршеној<br />процени ризика
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-600">
                                            {editingCell === item.id && !readOnly ? (
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleInputBlur(item.id)}
                                                    onKeyDown={(e) => handleKeyPress(e, item.id)}
                                                    className="w-full h-16 text-xs border border-blue-500 rounded p-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    placeholder="Унесите вредност..."
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className={`min-h-[40px] p-1 rounded ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50'}`}
                                                    onClick={() => handleCellClick(item.id, item.vrednost)}
                                                    title={readOnly ? 'Режим прегледа - измене нису дозвољене' : 'Кликните да унесете вредност'}
                                                >
                                                    {item.vrednost || (
                                                        <span className="text-gray-400 italic">{readOnly ? 'Нема података' : 'Кликните да унесете...'}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {/* Završno stanje */}
                                {zavrsnoStanje.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-800 px-2 py-2 text-center font-medium text-gray-800">
                                            {item.id % 100}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-800">
                                            {item.karakteristika}
                                            {index === 0 && (
                                                <div className="mt-2 text-center">
                                                    <span className="bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                                                        Завршно стање –<br />по извршеном<br />ажурирању
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-600">
                                            {editingCell === item.id && !readOnly ? (
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleInputBlur(item.id)}
                                                    onKeyDown={(e) => handleKeyPress(e, item.id)}
                                                    className="w-full h-16 text-xs border border-blue-500 rounded p-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    placeholder="Унесите вредност..."
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className={`min-h-[40px] p-1 rounded ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50'}`}
                                                    onClick={() => handleCellClick(item.id, item.vrednost)}
                                                    title={readOnly ? 'Режим прегледа - измене нису дозвољене' : 'Кликните да унесете вредност'}
                                                >
                                                    {item.vrednost || (
                                                        <span className="text-gray-400 italic">{readOnly ? 'Нема података' : 'Кликните да унесете...'}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}

            {/* Napomene */}
            <div className="mt-6 text-xs text-gray-600">
                <div className="mb-2">
                    <strong>НАПОМЕНА 1:</strong> Образац се користи као прилог Акту о процени ризика у заштити лица имовине и пословања.
                </div>
                <div>
                    <strong>НАПОМЕНА 2:</strong> Наведени подаци морају да буду уписани у Дигитални регистар процена ризика.
                </div>
            </div>
        </div>
    );
}
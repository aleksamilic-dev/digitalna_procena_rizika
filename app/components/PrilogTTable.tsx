"use client";
import React, { useState, useEffect } from "react";

interface PrilogTTableProps {
    procenaId: string;
    readOnly?: boolean;
    onResourceScoreUpdate?: (score: number) => void;
}

interface TableT2Data {
    kapital_score: number | null;
    menadzeri_score: number | null;
    osiguranje_score: number | null;
    registar_score: number | null;
    zarada_score: number | null;
    prosek_resursa: number | null;
}

export default function PrilogTTable({ procenaId, readOnly = false, onResourceScoreUpdate }: PrilogTTableProps) {
    const [data, setData] = useState<TableT2Data>({
        kapital_score: null,
        menadzeri_score: null,
        osiguranje_score: null,
        registar_score: null,
        zarada_score: null,
        prosek_resursa: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-t`);
                if (response.ok) {
                    const savedData = await response.json();
                    if (savedData && !savedData.error) {
                        setData({
                            kapital_score: savedData.kapital_score,
                            menadzeri_score: savedData.menadzeri_score,
                            osiguranje_score: savedData.osiguranje_score,
                            registar_score: savedData.registar_score,
                            zarada_score: savedData.zarada_score,
                            prosek_resursa: savedData.prosek_resursa
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching Prilog T data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (procenaId) {
            fetchData();
        }
    }, [procenaId]);

    const handleScoreChange = async (field: keyof TableT2Data, value: number) => {
        const newData = { ...data, [field]: value };

        // Optimistic update
        setData(newData);

        try {
            const response = await fetch(`/api/procena/${procenaId}/prilog-t`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });

            if (response.ok) {
                const result = await response.json();
                setData(prev => ({ ...prev, prosek_resursa: result.prosek_resursa }));
                if (onResourceScoreUpdate) {
                    onResourceScoreUpdate(result.prosek_resursa);
                }
            }
        } catch (error) {
            console.error('Error saving Prilog T data:', error);
        }
    };

    if (loading) return <div>Учитавање података...</div>;

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'bg-white';
        if (score >= 4) return 'bg-green-100 text-green-800';
        if (score >= 3) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getLegacyOption = (score: number | null, allowedValues: number[]) =>
        score !== null && !allowedValues.includes(score)
            ? <option value={score} disabled>{score} (сачувано из претходне процене)</option>
            : null;

    return (
        <div className="space-y-8 mt-8">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Прилог Т</h2>
                <h3 className="text-lg font-bold text-gray-800 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Критеријуми за оцењивање испуњености захтева, ресурса и квалитета услуга организација</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Tabela T.1 - REQUIREMENTS (Static) */}
                <div className="border-2 border-gray-800 rounded p-4 bg-gray-50 text-gray-900">
                    <h5 className="font-bold text-center mb-4 border-b border-gray-400 pb-2">Табела Т.1<br />Испуњеност захтева</h5>
                    <table className="w-full text-xs border border-gray-400">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Класификација</th>
                                <th className="border p-2 w-10">Оцена</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="border p-1">Не испуњава</td><td className="border p-1 text-center font-bold">0</td></tr>
                            <tr><td className="border p-1">Врло мала (&lt; 50%)</td><td className="border p-1 text-center font-bold">1</td></tr>
                            <tr><td className="border p-1">Мала (51% - 60%)</td><td className="border p-1 text-center font-bold">2</td></tr>
                            <tr><td className="border p-1">Средња (61% - 75%)</td><td className="border p-1 text-center font-bold">3</td></tr>
                            <tr><td className="border p-1">Врло велика (76% - 90%)</td><td className="border p-1 text-center font-bold">4</td></tr>
                            <tr><td className="border p-1">Потпуна (91% - 100%)</td><td className="border p-1 text-center font-bold">5</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* Tabela T.2 - RESOURCES (Interactive) */}
                <div className="border-2 border-blue-800 rounded p-4 bg-white md:col-span-2 shadow-lg text-gray-900">
                    <h5 className="font-bold text-center mb-4 border-b border-gray-400 pb-2 text-blue-800">Табела Т.2<br />Ресурси (Попуњава се)</h5>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-blue-50">
                                <th className="border border-gray-300 p-2 text-left">Класификација ресурса</th>
                                <th className="border border-gray-300 p-2 w-24 text-center">Оцена</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Kapital */}
                            <tr>
                                <td className="border border-gray-300 p-2 font-medium bg-gray-50" colSpan={2}>Уписани основни капитал (у дин.)</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select
                                        className="w-full p-1 border rounded"
                                        value={data.kapital_score ?? ''}
                                        onChange={(e) => handleScoreChange('kapital_score', parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>Изаберите...</option>
                                        {getLegacyOption(data.kapital_score, [1, 2, 3, 4, 5])}
                                        <option value="1">= 100</option>
                                        <option value="2">&gt; 100 &lt;= 3.000.000</option>
                                        <option value="3">&gt; 3.000.000 &lt;= 10.000.000</option>
                                        <option value="4">&gt; 10.000.000 &lt;= 30.000.000</option>
                                        <option value="5">&gt; 30.000.000</option>
                                    </select>
                                </td>
                                <td className={`border border-gray-300 p-2 text-center font-bold ${getScoreColor(data.kapital_score)}`}>
                                    {data.kapital_score ?? '-'}
                                </td>
                            </tr>

                            {/* Menadzeri */}
                            <tr>
                                <td className="border border-gray-300 p-2 font-medium bg-gray-50" colSpan={2}>Број запослених менаџера ризика</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select
                                        className="w-full p-1 border rounded"
                                        value={data.menadzeri_score ?? ''}
                                        onChange={(e) => handleScoreChange('menadzeri_score', parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>Изаберите...</option>
                                        {getLegacyOption(data.menadzeri_score, [2, 3, 4, 5])}
                                        <option value="2">1 са ССС</option>
                                        <option value="4">1 са ВСС</option>
                                        <option value="3">&gt; 1 са ССС</option>
                                        <option value="5">&gt; 1 са ВСС</option>
                                    </select>
                                </td>
                                <td className={`border border-gray-300 p-2 text-center font-bold ${getScoreColor(data.menadzeri_score)}`}>
                                    {data.menadzeri_score ?? '-'}
                                </td>
                            </tr>

                            {/* Osiguranje */}
                            <tr>
                                <td className="border border-gray-300 p-2 font-medium bg-gray-50" colSpan={2}>Премија осигурања (у дин.)</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select
                                        className="w-full p-1 border rounded"
                                        value={data.osiguranje_score ?? ''}
                                        onChange={(e) => handleScoreChange('osiguranje_score', parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>Изаберите...</option>
                                        {getLegacyOption(data.osiguranje_score, [1, 2, 3, 4, 5])}
                                        <option value="1">&lt;= 3.000.000</option>
                                        <option value="2">&gt; 3.000.000 &lt;= 6.000.000</option>
                                        <option value="3">&gt; 6.000.000 &lt;= 10.000.000</option>
                                        <option value="4">&gt; 10.000.000 &lt;= 20.000.000</option>
                                        <option value="5">&gt; 20.000.000</option>
                                    </select>
                                </td>
                                <td className={`border border-gray-300 p-2 text-center font-bold ${getScoreColor(data.osiguranje_score)}`}>
                                    {data.osiguranje_score ?? '-'}
                                </td>
                            </tr>

                            {/* Registar */}
                            <tr>
                                <td className="border border-gray-300 p-2 font-medium bg-gray-50" colSpan={2}>Дигитални регистар процена ризика (број израђених аката)</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select
                                        className="w-full p-1 border rounded"
                                        value={data.registar_score ?? ''}
                                        onChange={(e) => handleScoreChange('registar_score', parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>Изаберите...</option>
                                        {getLegacyOption(data.registar_score, [1, 2, 3, 4, 5])}
                                        <option value="1">&lt;= 2</option>
                                        <option value="2">&gt; 2 &lt;= 3</option>
                                        <option value="3">&gt; 3 &lt;= 10</option>
                                        <option value="4">&gt; 10 &lt;= 20</option>
                                        <option value="5">&gt; 20</option>
                                    </select>
                                </td>
                                <td className={`border border-gray-300 p-2 text-center font-bold ${getScoreColor(data.registar_score)}`}>
                                    {data.registar_score ?? '-'}
                                </td>
                            </tr>

                            {/* Zarada */}
                            <tr>
                                <td className="border border-gray-300 p-2 font-medium bg-gray-50" colSpan={2}>Просечна зарада запослених</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select
                                        className="w-full p-1 border rounded"
                                        value={data.zarada_score ?? ''}
                                        onChange={(e) => handleScoreChange('zarada_score', parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>Изаберите...</option>
                                        {getLegacyOption(data.zarada_score, [1, 3, 5])}
                                        <option value="1">Испод републичког просека</option>
                                        <option value="3">±10% од републичког просека</option>
                                        <option value="5">&gt;10% изнад републичког просека</option>
                                    </select>
                                </td>
                                <td className={`border border-gray-300 p-2 text-center font-bold ${getScoreColor(data.zarada_score)}`}>
                                    {data.zarada_score ?? '-'}
                                </td>
                            </tr>

                            {/* Average Row */}
                            <tr className="bg-blue-100 border-t-2 border-blue-300">
                                <td className="p-3 text-right font-bold text-blue-900">
                                    Просек ресурса организације (аутоматски се преноси у Прилог Ћ):
                                </td>
                                <td className="p-3 text-center text-lg font-bold text-blue-900">
                                    {data.prosek_resursa != null ? data.prosek_resursa.toFixed(2) : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Tabela T.3 - QUALITY (Static) */}
                <div className="border-2 border-gray-800 rounded p-4 bg-gray-50 text-gray-900">
                    <h5 className="font-bold text-center mb-4 border-b border-gray-400 pb-2">Табела Т.3<br />Оцена квалитета услуга</h5>
                    <table className="w-full text-xs border border-gray-400">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Ниво</th>
                                <th className="border p-2">Оцена</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="border p-1">Неусаглашен</td><td className="border p-1 text-center font-bold">0</td></tr>
                            <tr><td className="border p-1">1 – лош квалитет</td><td className="border p-1 text-center font-bold">0,00–4,49</td></tr>
                            <tr><td className="border p-1">2 – довољан квалитет</td><td className="border p-1 text-center font-bold">5,00–8,49</td></tr>
                            <tr><td className="border p-1">3 – добар квалитет</td><td className="border p-1 text-center font-bold">8,50–13,49</td></tr>
                            <tr><td className="border p-1">4 – врло добар квалитет</td><td className="border p-1 text-center font-bold">13,50–18,49</td></tr>
                            <tr><td className="border p-1">5 – одличан квалитет</td><td className="border p-1 text-center font-bold">&gt;18,49</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-xs text-gray-500 mt-2 text-center">
                НАПОМЕНА: Табеле Т.1 и Т.3 су информативног карактера. Попуњава се само табела Т.2.
            </div>
        </div>
    );
}

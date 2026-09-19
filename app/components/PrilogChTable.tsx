"use client";
import React, { useState, useEffect } from "react";

interface PrilogChTableProps {
    procenaId: string;
    readOnly?: boolean;
    resourceScoreOverride?: number | null;
    prilogUScoreOverride?: number | null;
}

interface TableChData {
    zahtev_a: number | null;
    zahtev_b: number | null;
    zahtev_v: number | null;
    zahtev_g: number | null;
    zahtev_d: number | null;
    zahtev_dj: number | null;
    final_score: number | null;
}

const REQUIREMENTS = [
    { key: 'zahtev_a', label: 'а) испуњава сву релевантну правну регулативу применљиву на услугу процене ризика у заштити лица, имовине и пословања;', type: 'strict' },
    { key: 'zahtev_b', label: 'б) користи информатичку опрему и одговарајући софтвер/алате који обезбеђују несметану, правилну и систематичну употребу прикупљених података...', type: 'strict' },
    { key: 'zahtev_v', label: 'в) именује компетентно лице за вршење послова у складу са захтевима из т. 5.4 и оцене из Прилога У, табела У.1;', type: 'strict' },
    { key: 'zahtev_g', label: 'г) изради контролне листе за процену ризика у складу са захтевима из т. 5.5—5.15 овог стандарда...', type: 'strict' },
    { key: 'zahtev_d', label: 'д) изради Дигитални регистар процена ризика;', type: 'strict' },
    { key: 'zahtev_dj', label: 'ђ) користи доступне евиденције, сазнања и јавно доступне базе података и интернет платформе. (Препорука)', type: 'range' },
];

export default function PrilogChTable({ procenaId, readOnly = false, resourceScoreOverride, prilogUScoreOverride }: PrilogChTableProps) {
    const [data, setData] = useState<TableChData>({
        zahtev_a: null, zahtev_b: null, zahtev_v: null,
        zahtev_g: null, zahtev_d: null, zahtev_dj: null, final_score: null
    });
    const [resourceScore, setResourceScore] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Update resource score if override provided
    useEffect(() => {
        if (resourceScoreOverride !== undefined && resourceScoreOverride !== null) {
            setResourceScore(resourceScoreOverride);
        }
    }, [resourceScoreOverride]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-ch`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.chData) {
                        setData({
                            zahtev_a: result.chData.zahtev_a,
                            zahtev_b: result.chData.zahtev_b,
                            zahtev_v: result.chData.zahtev_v,
                            zahtev_g: result.chData.zahtev_g,
                            zahtev_d: result.chData.zahtev_d,
                            zahtev_dj: result.chData.zahtev_dj,
                            final_score: result.chData.final_score
                        });
                    }
                    // Only set fetched resource score if override is not active
                    if (resourceScoreOverride === undefined || resourceScoreOverride === null) {
                        setResourceScore(parseFloat(result.resourceAverage) || 0);
                    }
                }
            } catch (error) {
                console.error('Error fetching Prilog Ћ data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (procenaId) {
            fetchData();
        }
    }, [procenaId, resourceScoreOverride]);

    const handleScoreChange = async (field: keyof TableChData, value: number) => {
        const newData = { ...data, [field]: value };
        setData(newData); // Optimistic

        try {
            const response = await fetch(`/api/procena/${procenaId}/prilog-ch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            if (response.ok) {
                const result = await response.json();
                setData(prev => ({ ...prev, final_score: result.finalScore }));
            }
        } catch (error) {
            console.error('Error saving Prilog Ћ data:', error);
        }
    };

    // Zahtev в) se automatski prenosi iz Priloga U, tabela U.1 (Prilog Ћ, tabela Ћ.2)
    const hasPrilogUScore = prilogUScoreOverride !== undefined && prilogUScoreOverride !== null;
    const getFulfillment = (key: keyof TableChData): number | null =>
        key === 'zahtev_v' ? (hasPrilogUScore ? prilogUScoreOverride : null) : data[key];

    // Kol. 4 = kol. 2 × kol. 3; ocena opštih zahteva = prosek kol. 4 (nepopunjeno = 0)
    const hasAnyFulfillment = REQUIREMENTS.some(req => getFulfillment(req.key as keyof TableChData) !== null);
    const finalScore = hasAnyFulfillment
        ? parseFloat((REQUIREMENTS.reduce((sum, req) =>
            sum + (getFulfillment(req.key as keyof TableChData) || 0) * resourceScore, 0) / REQUIREMENTS.length).toFixed(2))
        : null;

    const getQualityLevel = (score: number | null) => {
        if (score === null) return '-';
        if (score > 18.49) return '5 – одличан квалитет';
        if (score >= 13.50) return '4 – врло добар квалитет';
        if (score >= 8.50) return '3 – добар квалитет';
        if (score >= 5.00) return '2 – довољан квалитет';
        if (score >= 0.01) return '1 – лош квалитет';
        return 'Неусаглашен';
    };

    if (loading) return <div>Учитавање података...</div>;

    return (
        <div className="space-y-8 mt-8">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Прилог Ћ</h2>
                <h3 className="text-lg font-bold text-gray-900 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Матрица за оцењивање испуњености општих захтева за организације</h4>
            </div>

            <div className="border-2 border-green-800 rounded p-4 bg-white shadow-lg text-gray-900">
                <h5 className="font-bold text-center mb-4 border-b border-gray-400 pb-2 text-green-800">Табела Ћ.1<br />Захтеви за организације које врше процену ризика</h5>

                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-green-50">
                            <th className="border p-2 text-left w-1/2">5.3 Општи захтеви за организацију</th>
                            <th className="border p-2 w-24 text-center">Испуњеност<br />(0-5)</th>
                            <th className="border p-2 w-24 text-center">Ресурси<br />(Prilog T)</th>
                            <th className="border p-2 w-24 text-center">Оцена<br />(Кол.2 * Кол.3)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {REQUIREMENTS.map((req, index) => (
                            <tr key={req.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border p-2">{req.label}</td>
                                <td className="border p-2 text-center">
                                    {req.key === 'zahtev_v' ? (
                                        hasPrilogUScore ? (
                                            <div className="font-bold text-purple-800 bg-purple-100 p-1 rounded">
                                                {prilogUScoreOverride.toFixed(2)}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500" title="Оцена се аутоматски преноси из Прилога У, табела У.1">
                                                Попуните Прилог У
                                            </div>
                                        )
                                    ) : (
                                        <select
                                            className="w-full p-1 border rounded text-center"
                                            value={data[req.key as keyof TableChData] ?? ''}
                                            onChange={(e) => handleScoreChange(req.key as keyof TableChData, parseFloat(e.target.value))}
                                            disabled={readOnly}
                                        >
                                            <option value="" disabled>-</option>
                                            {req.type === 'strict' ? (
                                                <>
                                                    <option value="0">0</option>
                                                    <option value="5">5</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </>
                                            )}
                                        </select>
                                    )}
                                </td>
                                <td className="border p-2 text-center text-gray-600 bg-gray-100 font-medium">
                                    {resourceScore.toFixed(2)}
                                </td>
                                <td className="border p-2 text-center font-bold">
                                    {getFulfillment(req.key as keyof TableChData) !== null
                                        ? ((getFulfillment(req.key as keyof TableChData) || 0) * resourceScore).toFixed(2)
                                        : '-'}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-green-100 border-t-2 border-green-300 font-bold">
                            <td className="border p-3 text-right" colSpan={3}>
                                Оцена општих захтева за организацију (Просек):
                            </td>
                            <td className="border p-3 text-center text-lg text-green-900">
                                {finalScore !== null ? finalScore.toFixed(2) : '-'}
                            </td>
                        </tr>
                        <tr className="bg-green-100 font-bold">
                            <td className="border p-3 text-right" colSpan={3}>
                                Ниво квалитета (према Табели Т.3):
                            </td>
                            <td className="border p-3 text-center text-green-900">
                                {getQualityLevel(finalScore)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {resourceScore === 0 && (
                    <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded text-center">
                        <strong>Упозорење:</strong> Вредност ресурса је 0. Молимо попуните <strong>Прилог Т (Табела Т.2)</strong> пре попуњавања ове табеле.
                    </div>
                )}
            </div>
        </div>
    );
}

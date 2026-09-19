"use client";
import React, { useState, useEffect } from "react";

interface PrilogUTableProps {
    procenaId: string;
    readOnly?: boolean;
    onScoreUpdate?: (score: number) => void;
}

interface TableUData {
    zahtev_a: number | null;
    zahtev_b: number | null;
    zahtev_v: number | null;
    zahtev_g: number | null;
    zahtev_d: number | null;
    final_score: number | null;
}

const REQ_CONFIG = [
    { key: 'zahtev_a', label: 'а) испуњава сву релевантну правну регулативу применљиву на услуге процене ризика у заштити лица, имовине и пословања;', type: 'strict' },
    { key: 'zahtev_b', label: 'б) има безбедносни сертификат одговарајућег степена, у складу са прописима о заштити тајности података, када његова организација услуге пружа објектима критичне инфраструктуре.', type: 'strict' },
    // Tabela U.2: preporuke в) i д) se ocenjuju sa 1 ili 5, a г) od 1 do 5
    { key: 'zahtev_v', label: 'в) има високо образовање на основним академским студијама у обиму од најмање 240 ЕСПБ бодова...', type: 'oneOrFive' },
    { key: 'zahtev_g', label: 'г) познаје најмање један страни језик нивоа А1;', type: 'range' },
    { key: 'zahtev_d', label: 'д) има последипломско специјалистичко усавршавање из области безбедности...', type: 'oneOrFive' }
];


export default function PrilogUTable({ procenaId, readOnly = false, onScoreUpdate }: PrilogUTableProps) {
    const [data, setData] = useState<TableUData>({
        zahtev_a: null, zahtev_b: null, zahtev_v: null,
        zahtev_g: null, zahtev_d: null, final_score: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-u`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.uData) {
                        setData({
                            zahtev_a: result.uData.zahtev_a,
                            zahtev_b: result.uData.zahtev_b,
                            zahtev_v: result.uData.zahtev_v,
                            zahtev_g: result.uData.zahtev_g,
                            zahtev_d: result.uData.zahtev_d,
                            final_score: result.uData.final_score
                        });
                        if (onScoreUpdate && result.uData.final_score !== null) {
                            onScoreUpdate(parseFloat(result.uData.final_score));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching Prilog U data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (procenaId) {
            fetchData();
        }
    }, [procenaId, onScoreUpdate]);

    const handleScoreChange = async (field: keyof TableUData, value: number) => {
        const newData = { ...data, [field]: value };

        // Optimistic update
        setData(newData);

        try {
            const response = await fetch(`/api/procena/${procenaId}/prilog-u`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });

            if (response.ok) {
                const result = await response.json();
                setData(prev => ({ ...prev, final_score: result.finalScore }));
                if (onScoreUpdate) {
                    onScoreUpdate(result.finalScore);
                }
            }
        } catch (error) {
            console.error('Error saving Prilog U data:', error);
        }
    };

    if (loading) return <div>Учитавање података...</div>;

    return (
        <div className="space-y-8 mt-8">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Прилог У</h2>
                <h3 className="text-lg font-bold text-gray-900 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Матрица за оцењивање испуњености захтева за квалификованост менаџера ризика</h4>
            </div>

            <div className="border-2 border-purple-800 rounded p-4 bg-white shadow-lg text-gray-900">
                <h5 className="font-bold text-center mb-4 border-b border-gray-400 pb-2 text-purple-800">Табела У.1<br />Испуњености захтева за особе које врше процену ризика</h5>

                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-purple-50">
                            <th className="border p-2 text-left">5.4 Захтеви за квалификованост менаџера ризика</th>
                            <th className="border p-2 w-32 text-center">Испуњеност<br />(0-5)</th>
                            <th className="border p-2 w-32 text-center">Оцена</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* HEADER: ZAPOSLENI (MANDATORY) */}
                        <tr className="bg-red-50 font-bold text-red-900">
                            <td colSpan={3} className="border p-2">
                                Запослени у организацији или предузетник који врши послове менаџера ризика МОРА да поседује одговарајуће квалификације:
                            </td>
                        </tr>

                        {REQ_CONFIG.slice(0, 2).map((req) => (
                            <tr key={req.key} className="bg-white">
                                <td className="border p-2">{req.label}</td>
                                <td className="border p-2 text-center">
                                    <select
                                        className="w-full p-1 border rounded text-center"
                                        value={data[req.key as keyof TableUData] ?? ''}
                                        onChange={(e) => handleScoreChange(req.key as keyof TableUData, parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>-</option>
                                        <option value="0">0</option>
                                        <option value="5">5</option>
                                    </select>
                                </td>
                                <td className="border p-2 text-center font-bold">
                                    {data[req.key as keyof TableUData] ?? '-'}
                                </td>
                            </tr>
                        ))}

                        {/* HEADER: PREPORUKE (RECOMMENDED) */}
                        <tr className="bg-green-50 font-bold text-green-900">
                            <td colSpan={3} className="border p-2">
                                ПРЕПОРУЧУЈЕ СЕ да особа која врши послове менаџера ризика поседује следеће квалификације:
                            </td>
                        </tr>

                        {REQ_CONFIG.slice(2).map((req) => (
                            <tr key={req.key} className="bg-white">
                                <td className="border p-2">{req.label}</td>
                                <td className="border p-2 text-center">
                                    <select
                                        className="w-full p-1 border rounded text-center"
                                        value={data[req.key as keyof TableUData] ?? ''}
                                        onChange={(e) => handleScoreChange(req.key as keyof TableUData, parseInt(e.target.value))}
                                        disabled={readOnly}
                                    >
                                        <option value="" disabled>-</option>
                                        {(req.type === 'oneOrFive' ? [1, 5] : [1, 2, 3, 4, 5]).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="border p-2 text-center font-bold">
                                    {data[req.key as keyof TableUData] ?? '-'}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-purple-100 border-t-2 border-purple-300 font-bold">
                            <td className="border p-3 text-right" colSpan={2}>
                                Оцена за менаџера ризика (Просек):
                            </td>
                            <td className="border p-3 text-center text-lg text-purple-900">
                                {data.final_score != null ? data.final_score.toFixed(2) : '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="text-xs text-gray-500 mt-2 text-center">
                    НАПОМЕНА: Ова оцена се аутоматски преноси у Прилог Ћ, табела Ћ.1, под в).
                </div>
            </div>
        </div>
    );
}

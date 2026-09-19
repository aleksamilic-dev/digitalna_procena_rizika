"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Info } from "lucide-react";
import CriteriaModal from "./CriteriaModal";

interface TabelaF5Props {
    procenaId: string;
    readOnly?: boolean;
}

interface F5Item {
    id: number;
    group_id: number;
    mera: string;
    opis_i_obrazlozenje: string;
}

const GROUPS = [
    { id: 1, name: 'РИЗИЦИ ОПШТИХ ПОСЛОВНИХ АКТИВНОСТИ' },
    { id: 2, name: 'РИЗИЦИ ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ' },
    { id: 3, name: 'ПРАВНИ РИЗИЦИ' },
    { id: 4, name: 'РИЗИЦИ ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА' },
    { id: 5, name: 'РИЗИЦИ ОД ПОЖАРА' },
    { id: 6, name: 'РИЗИЦИ ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА' },
    { id: 7, name: 'РИЗИЦИ ОД НЕУСАГЛАШЕНОСТИ СА СТАНДАРДИМА' },
    { id: 8, name: 'РИЗИЦИ ОД ЕКСПЛОЗИЈА' },
    { id: 9, name: 'РИЗИЦИ ПО ЖИВОТНУ СРЕДИНУ' },
    { id: 10, name: 'РИЗИЦИ У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА' },
    { id: 11, name: 'РИЗИЦИ У ОБЛАСТИ ИКТ СИСТЕМА' }
];

export default function TabelaF5({ procenaId, readOnly = false }: TabelaF5Props) {
    const [items, setItems] = useState<F5Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCriteria, setShowCriteria] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`/api/procena/${procenaId}/prilog-f5`);
                if (res.ok) {
                    const data = await res.json();
                    // group_id je VARCHAR kolona - bez Number() se sačuvane mere ne prikazuju posle osvežavanja
                    setItems(data.map((item: F5Item) => ({ ...item, group_id: Number(item.group_id) })));
                }
            } catch (err) {
                console.error("Error fetching F5 items", err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [procenaId]);

    const handleUpdate = async (item: F5Item, field: 'mera' | 'opis_i_obrazlozenje', val: string) => {
        const updatedItem = { ...item, [field]: val };

        // Optimistic
        setItems(prev => prev.map(p => p.id === item.id ? updatedItem : p));

        try {
            await fetch(`/api/procena/${procenaId}/prilog-f5`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
        } catch (err) {
            console.error("Error updating item", err);
        }
    };

    const handleAddRow = async (groupId: number) => {
        if (readOnly) return;

        // create empty placeholder
        try {
            const res = await fetch(`/api/procena/${procenaId}/prilog-f5`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_id: groupId, mera: '', opis_i_obrazlozenje: '' })
            });
            if (res.ok) {
                const result = await res.json();
                setItems(prev => [...prev, { id: result.id, group_id: groupId, mera: '', opis_i_obrazlozenje: '' }]);
            }
        } catch (err) {
            console.error("Error adding row", err);
        }
    };

    const handleDeleteRow = async (id: number) => {
        if (readOnly) return;
        if (!confirm("Да ли сте сигурни да желите да обришете овај ред?")) return;

        // Optimistic
        setItems(prev => prev.filter(p => p.id !== id));

        try {
            await fetch(`/api/procena/${procenaId}/prilog-f5`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'delete' })
            });
        } catch (err) {
            console.error("Error deleting row", err);
        }
    };

    if (loading) return <div>Учитавање...</div>;

    return (
        <div className="mb-6 border-2 border-gray-800 rounded p-4 bg-white relative">
            <h5 className="font-bold text-center mb-4 text-gray-800">Табела Ф.5 – Мере за поступање са ризицима</h5>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800 w-10">Бр.</th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800 w-1/3 cursor-pointer hover:bg-gray-300 transition-colors"
                                onClick={() => setShowCriteria(true)}
                                title="Кликните за приказ критеријума"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    МЕРА <Info size={16} />
                                </div>
                            </th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800">ОПИС И ОБРАЗЛОЖЕЊЕ</th>
                            {!readOnly && <th className="border border-gray-800 px-2 py-2 w-10">Акције</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {GROUPS.map(group => {
                            const groupItems = items.filter(x => x.group_id === group.id).sort((a, b) => a.id - b.id);
                            return (
                                <React.Fragment key={group.id}>
                                    {/* Group Header */}
                                    <tr>
                                        <td colSpan={readOnly ? 3 : 4} className="border border-gray-800 px-2 py-2 bg-gray-300 font-bold text-center text-gray-800">
                                            {group.name}
                                        </td>
                                    </tr>

                                    {/* Items */}
                                    {groupItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="border border-gray-800 px-2 py-2 text-center font-medium bg-gray-50 text-gray-800">
                                                {idx + 1}
                                            </td>
                                            <td className="border border-gray-800 p-0 align-top">
                                                <textarea
                                                    className="w-full h-full min-h-[60px] p-2 text-xs focus:outline-none resize-y bg-transparent text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                                    value={item.mera}
                                                    onChange={(e) => handleUpdate(item, 'mera', e.target.value)}
                                                    disabled={readOnly}
                                                    placeholder="Унесите меру..."
                                                />
                                            </td>
                                            <td className="border border-gray-800 p-0 align-top">
                                                <textarea
                                                    className="w-full h-full min-h-[60px] p-2 text-xs focus:outline-none resize-y bg-transparent text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                                    value={item.opis_i_obrazlozenje}
                                                    onChange={(e) => handleUpdate(item, 'opis_i_obrazlozenje', e.target.value)}
                                                    disabled={readOnly}
                                                    placeholder="Унесите опис..."
                                                />
                                            </td>
                                            {!readOnly && (
                                                <td className="border border-gray-800 p-2 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteRow(item.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Обриши ред"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}

                                    {/* Add Row Button */}
                                    {!readOnly && (
                                        <tr>
                                            <td colSpan={4} className="border border-gray-800 p-1 bg-gray-50">
                                                <button
                                                    onClick={() => handleAddRow(group.id)}
                                                    className="w-full py-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-xs font-semibold hover:bg-blue-50 transition-colors"
                                                >
                                                    <Plus size={14} /> Додај нови ред за {group.name}
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-xs text-gray-800">
                <div className="mb-2"><strong>НАПОМЕНА:</strong> Детаљно образложење према критеријумима у тачки 6.4</div>
                <div><strong>ПРИМЕР:</strong> Приказ примене метода вредновања ризика у Прилогу П, табела П.1 и табела П.2</div>
            </div>

            {/* Modal */}
            {showCriteria && (
                <CriteriaModal onClose={() => setShowCriteria(false)} />
            )}
        </div>
    );
}

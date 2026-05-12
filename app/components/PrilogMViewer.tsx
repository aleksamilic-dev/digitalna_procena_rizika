"use client";
import { useState, useEffect, useCallback } from "react";
import { PrilogMData } from "../data/riskDataLoader";

interface PrilogMViewerProps {
    procenaId: string;
    title?: string;
}

export default function PrilogMViewer({ procenaId, title = "ПРИLOG М - Ниво агрегатног ризика" }: PrilogMViewerProps) {
    const [prilogMData, setPrilogMData] = useState<PrilogMData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState({
        totalItems: 0,
        riskCategories: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        prihvatljiviRizici: 0,
        neprihvatljiviRizici: 0,
        highRiskItems: 0,
        averageRiskLevel: 0
    });

    const loadPrilogMData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/procena/${procenaId}/prilog-m`);
            
            if (!response.ok) {
                throw new Error('Greška pri učitavanju Prilog M podataka');
            }
            
            const data = await response.json();
            setPrilogMData(data);
            calculateStatistics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Neočekivana greška');
        } finally {
            setLoading(false);
        }
    }, [procenaId]);

    useEffect(() => {
        loadPrilogMData();
    }, [loadPrilogMData]);

    const calculateStatistics = (data: PrilogMData[]) => {
        const totalItems = data.length;
        const riskCategories = {
            1: data.filter(item => item.kategorijaRizika === 1).length,
            2: data.filter(item => item.kategorijaRizika === 2).length,
            3: data.filter(item => item.kategorijaRizika === 3).length,
            4: data.filter(item => item.kategorijaRizika === 4).length,
            5: data.filter(item => item.kategorijaRizika === 5).length
        };

        const prihvatljiviRizici = data.filter(item => item.prihvatljivost === 'PRIHVATLJIV').length;
        const neprihvatljiviRizici = data.filter(item => item.prihvatljivost === 'NEPRIHVATLJIV').length;
        const highRiskItems = riskCategories[1] + riskCategories[2];
        const averageRiskLevel = totalItems > 0
            ? Math.round(data.reduce((sum, item) => sum + (item.nivoRizika || 0), 0) / totalItems * 100) / 100
            : 0;

        setStatistics({
            totalItems,
            riskCategories,
            prihvatljiviRizici,
            neprihvatljiviRizici,
            highRiskItems,
            averageRiskLevel
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600 font-medium">Учитавам Приlog М податке...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-100">
                <div className="text-center">
                    <div className="text-red-600 mb-4">⚠️</div>
                    <p className="text-red-600 font-medium">{error}</p>
                    <button 
                        onClick={loadPrilogMData}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Покушај поново
                    </button>
                </div>
            </div>
        );
    }

    if (prilogMData.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Нема Приlog М података
                    </h3>
                    <p className="text-gray-500">
                        Приlog М подаци се генеришу аутоматски када се изаберу ризици у процени.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-blue-800 text-center">
                    {title}
                </h2>
                <p className="text-blue-600 text-center mt-2">
                    Категорија и прихватљивост ризика
                </p>
            </div>

            {/* Statistics */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{statistics.totalItems}</div>
                        <div className="text-sm text-gray-600">Укупно ризика</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{statistics.highRiskItems}</div>
                        <div className="text-sm text-gray-600">Високи ризици</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{statistics.prihvatljiviRizici}</div>
                        <div className="text-sm text-gray-600">Прихватљиви</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{statistics.averageRiskLevel}</div>
                        <div className="text-sm text-gray-600">Просечан ниво</div>
                    </div>
                </div>

                {/* Risk Categories */}
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(statistics.riskCategories).map(([category, count]) => {
                        const categoryInfo = {
                            '1': { name: 'I (Изразито велики)', color: 'bg-red-100 text-red-800 border-red-200' },
                            '2': { name: 'II (Велики)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                            '3': { name: 'III (Умерено велики)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                            '4': { name: 'IV (Мали)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                            '5': { name: 'V (Врло мали)', color: 'bg-green-100 text-green-800 border-green-200' }
                        };

                        const info = categoryInfo[category as keyof typeof categoryInfo];

                        return (
                            <div key={category} className={`p-2 rounded-lg border-2 ${info.color} text-center`}>
                                <div className="text-xs font-medium mb-1">{info.name}</div>
                                <div className="text-lg font-bold">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '60px' }}>
                                Р.<br />бр.
                            </th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ minWidth: '200px' }}>
                                ЗАХТЕВИ ЗА ПРОЦЕНУ РИЗИКА
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Сво
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Изл.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Рањ.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Вер.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Штете
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Критичност
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '50px' }}>
                                Последице
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '60px' }}>
                                Ниво<br />риз.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '70px' }}>
                                Кат.<br />риз.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '80px' }}>
                                Прихв.
                            </th>
                        </tr>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">1</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">2</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">3</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">4</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">5</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">6</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">7</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">8</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">9</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">10</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">11</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">12</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prilogMData
                            .sort((a, b) => {
                                // Natural sort for IDs like 1.1.1, 1.1.2, 1.2.1, etc.
                                const aParts = a.id.split('.').map(Number);
                                const bParts = b.id.split('.').map(Number);

                                for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                                    const aVal = aParts[i] || 0;
                                    const bVal = bParts[i] || 0;
                                    if (aVal !== bVal) {
                                        return aVal - bVal;
                                    }
                                }
                                return 0;
                            })
                            .map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.id}
                                    </td>
                                    <td className="border border-gray-800 px-2 py-2 text-xs text-gray-800 align-top">
                                        {item.requirement || 'Захтев за процену ризика'}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        <span className={`inline-block w-6 h-6 rounded-full text-white font-bold text-xs leading-6 ${(item.velicinaOpasnosti || 0) >= 4 ? 'bg-red-600' :
                                            (item.velicinaOpasnosti || 0) === 3 ? 'bg-yellow-600' :
                                                'bg-green-600'
                                            }`}>
                                            {item.velicinaOpasnosti}
                                        </span>
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.izlozenost}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.ranjivost}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.verovatnoca}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.posledice}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.steta || '-'}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                        {item.kriticnost || '-'}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        <span className={`inline-block px-2 py-1 rounded-full text-white font-bold text-xs ${(item.nivoRizika || 0) >= 15 ? 'bg-red-600' :
                                            (item.nivoRizika || 0) >= 6 ? 'bg-yellow-600' :
                                                'bg-green-600'
                                            }`}>
                                            {item.nivoRizika}
                                        </span>
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        <span className={`inline-block px-1 py-1 rounded text-xs font-semibold ${item.kategorijaRizika === 1 ? 'bg-red-100 text-red-800' :
                                            item.kategorijaRizika === 2 ? 'bg-orange-100 text-orange-800' :
                                                item.kategorijaRizika === 3 ? 'bg-yellow-100 text-yellow-800' :
                                                    item.kategorijaRizika === 4 ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {item.kategorijaRizika === 1 ? 'I' :
                                                item.kategorijaRizika === 2 ? 'II' :
                                                    item.kategorijaRizika === 3 ? 'III' :
                                                        item.kategorijaRizika === 4 ? 'IV' :
                                                            'V'}
                                        </span>
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        <span className={`inline-block px-1 py-1 rounded text-xs font-semibold ${item.prihvatljivost === 'NEPRIHVATLJIV'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {item.prihvatljivost === 'NEPRIHVATLJIV' ? 'НЕ' : 'ДА'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

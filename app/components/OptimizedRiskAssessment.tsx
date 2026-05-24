'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RISK_GROUPS } from '../data/riskGroups';
import { getRiskGroupData, type PrilogMData } from '../data/riskDataLoader';
import RiskAssessmentTable from './RiskAssessmentTable';
import FinancialDataForm from './FinancialDataForm';

const DEBUG_RISK_ASSESSMENT = process.env.NODE_ENV === 'development';

function debugLog(...args: Parameters<typeof console.log>) {
    if (DEBUG_RISK_ASSESSMENT) {
        console.log(...args);
    }
}

interface RiskSelection {
    risk_id: string;
    danger_level: number;
    description: string;
}

interface OptimizedRiskAssessmentProps {
    procenaId: string;
    pravnoLice?: {
        id: number;
        naziv: string;
        pib: string;
        adresa: string;
    } | null;
    readOnly?: boolean;
    onNewAssessment?: () => void;
}

export default function OptimizedRiskAssessment({ procenaId, pravnoLice, readOnly = false, onNewAssessment }: OptimizedRiskAssessmentProps) {
    const [activeGroupId, setActiveGroupId] = useState<string>('group1');
    const [allSelections, setAllSelections] = useState<Map<string, RiskSelection[]>>(new Map());
    const [allPrilogMData, setAllPrilogMData] = useState<Map<string, PrilogMData[]>>(new Map());
    const [statistics, setStatistics] = useState({
        totalItems: 0,
        completedItems: 0,
        completionPercentage: 0,
        highRiskItems: 0,
        riskCategories: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [showFinancialForm, setShowFinancialForm] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const calculateStatistics = useCallback((prilogMData: Map<string, PrilogMData[]>) => {
        let totalItems = 0;
        let completedItems = 0;
        let highRiskItems = 0;
        const riskCategories = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        // Izračunaj ukupan broj stavki iz svih grupa
        RISK_GROUPS.forEach(group => {
            const groupData = getRiskGroupData(group.id);
            if (groupData) {
                groupData.risks.forEach(risk => {
                    totalItems += risk.items.length;
                });
            }
        });

        // Izračunaj statistike iz Prilog M podataka - samo jedinstvene stavke
        const uniqueCompletedItems = new Set<string>();

        prilogMData.forEach(groupData => {
            groupData.forEach(item => {
                // Dodaj u set za jedinstvene stavke
                uniqueCompletedItems.add(item.id);

                if (item.kategorijaRizika) {
                    riskCategories[item.kategorijaRizika as keyof typeof riskCategories]++;
                }

                if (item.kategorijaRizika === 1 || item.kategorijaRizika === 2) {
                    highRiskItems++;
                }
            });
        });

        // Dodaj N/A stavke (danger_level === 0) kao završene
        // Koristimo allSelections direktno bez dodavanja u dependency array
        allSelections.forEach((groupSelections) => {
            groupSelections.forEach(selection => {
                if (selection.danger_level === 0) {
                    uniqueCompletedItems.add(selection.risk_id);
                }
            });
        });

        completedItems = uniqueCompletedItems.size;
        const completionPercentage = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

        setStatistics({
            totalItems,
            completedItems,
            completionPercentage,
            highRiskItems,
            riskCategories
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Učitaj postojeće podatke pri inicijalizaciji - samo jednom
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                // Učitaj Prilog M podatke - jedan poziv za sve podatke
                const response = await fetch(`/api/procena/${procenaId}/prilog-m`);
                if (response.ok) {
                    const allData = await response.json();
                    debugLog('🔍 Učitani podaci iz API-ja:', allData.length, 'stavki');
                    debugLog('🔍 Prvi podatak:', allData[0]);

                    // Grupiši podatke po grupama
                    const newPrilogMData = new Map<string, PrilogMData[]>();

                    // Inicijalizuj sve grupe sa praznim nizovima
                    RISK_GROUPS.forEach(group => {
                        newPrilogMData.set(group.id, []);
                    });

                    // Dodeli podatke odgovarajućim grupama
                    allData.forEach((item: unknown) => {
                        // Type assertion for database item
                        const dbItem = item as {
                            id: string;
                            groupid?: string;
                            groupId?: string;
                            requirement: string;
                            velicinaopasnosti?: number;
                            velicinaOpasnosti?: number;
                            izlozenost: number;
                            ranjivost: number;
                            verovatnoca: number;
                            posledice: number;
                            steta: number;
                            kriticnost: number;
                            nivorizika?: number;
                            nivoRizika?: number;
                            kategorijarizika?: number;
                            kategorijaRizika?: number;
                            prihvatljivost: 'PRIHVATLJIV' | 'NEPRIHVATLJIV' | null;
                        };

                        // Mapiranje polja iz baze na očekivani format
                        // Mapiranje groupId - možda se čuva kao broj umesto "groupX"
                        let groupId = dbItem.groupid || dbItem.groupId || '';
                        if (groupId && !groupId.startsWith('group')) {
                            groupId = `group${groupId}`;
                        }

                        const mappedItem: PrilogMData = {
                            id: dbItem.id,
                            groupId: groupId,
                            requirement: dbItem.requirement,
                            velicinaOpasnosti: dbItem.velicinaopasnosti || dbItem.velicinaOpasnosti || null,
                            izlozenost: dbItem.izlozenost || null,
                            ranjivost: dbItem.ranjivost || null,
                            verovatnoca: dbItem.verovatnoca || null,
                            posledice: dbItem.posledice || null,
                            steta: dbItem.steta || null,
                            kriticnost: dbItem.kriticnost || null,
                            nivoRizika: dbItem.nivorizika || dbItem.nivoRizika || null,
                            kategorijaRizika: dbItem.kategorijarizika || dbItem.kategorijaRizika || null,
                            prihvatljivost: dbItem.prihvatljivost
                        };

                        // Debug: prikaži mapiranje groupId
                        const originalGroupId = dbItem.groupid || dbItem.groupId || '';
                        if (DEBUG_RISK_ASSESSMENT && originalGroupId !== groupId) {
                            debugLog(`🔍 Mapiranje groupId: "${originalGroupId}" → "${groupId}"`);
                        }

                        if (mappedItem.groupId && newPrilogMData.has(mappedItem.groupId)) {
                            const groupData = newPrilogMData.get(mappedItem.groupId) || [];
                            // Proveri da li već postoji stavka sa istim ID-om
                            const existingIndex = groupData.findIndex(existing => existing.id === mappedItem.id);
                            if (existingIndex >= 0) {
                                // Zameni postojeću stavku
                                groupData[existingIndex] = mappedItem;
                                debugLog(`🔄 Zamenio stavku ${mappedItem.id} u grupi ${mappedItem.groupId}`);
                            } else {
                                // Dodaj novu stavku
                                groupData.push(mappedItem);
                                debugLog(`➕ Dodao stavku ${mappedItem.id} u grupu ${mappedItem.groupId}`);
                            }
                            newPrilogMData.set(mappedItem.groupId, groupData);
                        } else {
                            console.warn(`⚠️ Stavka ${mappedItem.id} ima nepoznat groupId: "${mappedItem.groupId}" (dostupne grupe: ${Array.from(newPrilogMData.keys()).join(', ')})`);
                        }
                    });

                    // Debug: prikaži koliko stavki ima svaka grupa
                    debugLog('🔍 Finalni podaci po grupama:');
                    newPrilogMData.forEach((data, groupId) => {
                        if (data.length > 0) {
                            debugLog(`  ${groupId}: ${data.length} stavki - ${data.map(item => item.id).join(', ')}`);
                        }
                    });

                    setAllPrilogMData(newPrilogMData);
                    calculateStatistics(newPrilogMData);
                } else {
                    // Inicijalizuj prazne podatke ako nema odgovora
                    const newPrilogMData = new Map<string, PrilogMData[]>();
                    RISK_GROUPS.forEach(group => {
                        newPrilogMData.set(group.id, []);
                    });
                    setAllPrilogMData(newPrilogMData);
                    calculateStatistics(newPrilogMData);
                }

            } catch (error) {
                console.error('Greška pri učitavanju podataka:', error);
                // Inicijalizuj prazne podatke u slučaju greške
                const newPrilogMData = new Map<string, PrilogMData[]>();
                RISK_GROUPS.forEach(group => {
                    newPrilogMData.set(group.id, []);
                });
                setAllPrilogMData(newPrilogMData);
                calculateStatistics(newPrilogMData);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [procenaId, calculateStatistics]); // Only depend on procenaId, which should be stable



    // Callback za ažuriranje selekcija
    const handleSelectionChange = useCallback((groupId: string, selections: RiskSelection[]) => {
        setAllSelections(prev => {
            const newMap = new Map(prev);
            newMap.set(groupId, selections);
            return newMap;
        });
    }, []);

    // Callback za ažuriranje Prilog M podataka
    const handlePrilogMUpdate = useCallback((groupId: string, prilogMData: PrilogMData[]) => {
        setAllPrilogMData(prev => {
            const newMap = new Map(prev);
            newMap.set(groupId, prilogMData);
            calculateStatistics(newMap);
            return newMap;
        });
    }, [calculateStatistics]);

    // Create stable callbacks for the active group - use ref to avoid recreating
    const activeGroupIdRef = useRef(activeGroupId);
    activeGroupIdRef.current = activeGroupId;

    const activeGroupSelectionCallback = useCallback((selections: RiskSelection[]) => {
        handleSelectionChange(activeGroupIdRef.current, selections);
    }, [handleSelectionChange]);

    const activeGroupPrilogMCallback = useCallback((prilogMData: PrilogMData[]) => {
        handlePrilogMUpdate(activeGroupIdRef.current, prilogMData);
    }, [handlePrilogMUpdate]);

    // Dobij podatke za aktivnu grupu
    const activeGroupData = getRiskGroupData(activeGroupId);
    const activeGroupInfo = RISK_GROUPS.find(g => g.id === activeGroupId);

    // Generiši sveukupne Prilog M podatke
    const getAllPrilogMData = (): PrilogMData[] => {
        const allData: PrilogMData[] = [];
        allPrilogMData.forEach(groupData => {
            allData.push(...groupData);
        });
        return allData;
    };

    const exportData = () => {
        const exportObject = {
            procenaId,
            timestamp: new Date().toISOString(),
            selections: Object.fromEntries(allSelections),
            prilogMData: Object.fromEntries(allPrilogMData),
            statistics,
            summary: {
                totalGroups: RISK_GROUPS.length,
                completedGroups: Array.from(allPrilogMData.values()).filter(data => data.length > 0).length,
                allPrilogMData: getAllPrilogMData()
            }
        };

        const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `procena-rizika-${procenaId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Funkcija za potvrdu prelaska na drugi prilog
    const handleGroupSwitch = (newGroupId: string) => {
        if (hasUnsavedChanges) {
            const confirmed = confirm(
                'Имате несачуване промене за тренутни прилог.\n\n' +
                'Да ли сте сигурни да желите да пређете на други прилог?\n' +
                'Несачуване промене ће бити изгубљене.'
            );

            if (!confirmed) {
                return; // Ne menjaj prilog ako korisnik nije potvrdio
            }
        }

        setActiveGroupId(newGroupId);
        setHasUnsavedChanges(false); // Reset unsaved changes flag
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600 font-medium">Учитавам процену ризика...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header sa statistikama */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                Procena Rizika
                            </h1>
                            <div className="text-gray-600 mt-2 space-y-1">
                                {pravnoLice && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="font-medium">{pravnoLice.naziv}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>PIB: {pravnoLice.pib}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <span>Procena ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{procenaId}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {onNewAssessment && (
                                <button
                                    onClick={onNewAssessment}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Novo pravno lice
                                </button>
                            )}

                            {!readOnly && (
                                <button
                                    onClick={() => setShowFinancialForm(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    💰 Finansijski podaci
                                </button>
                            )}

                            <button
                                onClick={exportData}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                            >
                                📊 Izvezi Podatke
                            </button>
                        </div>
                    </div>

                    {/* Upozorenje o nesačuvanim promenama */}
                    {hasUnsavedChanges && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800">
                                    ⚠️ Имате несачуване промене за тренутни прилог
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Кликните &quot;Сачувај промене&quot; да сачувате ваше измене пре преласка на други прилог.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Statistike */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-600">Ukupno stavki</h3>
                            <p className="text-2xl font-bold text-blue-800">{statistics.totalItems}</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-green-600">Završeno</h3>
                            <p className="text-2xl font-bold text-green-800">{statistics.completedItems}</p>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-600">Napredak</h3>
                            <p className="text-2xl font-bold text-yellow-800">{statistics.completionPercentage}%</p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-red-600">Visoki rizici</h3>
                            <p className="text-2xl font-bold text-red-800">{statistics.highRiskItems}</p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-600">Grupe</h3>
                            <p className="text-2xl font-bold text-purple-800">
                                {Array.from(allPrilogMData.values()).filter(data => data.length > 0).length}/{RISK_GROUPS.length}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Napredak procene</span>
                            <span>{statistics.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${statistics.completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Kategorije rizika */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Kategorije Rizika</h2>
                    <div className="grid grid-cols-5 gap-4">
                        {Object.entries(statistics.riskCategories).map(([category, count]) => {
                            const categoryInfo = {
                                '1': { name: 'PRVA (Izrazito veliki)', color: 'bg-red-100 text-red-800 border-red-200' },
                                '2': { name: 'DRUGA (Veliki)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                                '3': { name: 'TREĆA (Umereno veliki)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                                '4': { name: 'ČETVRTA (Mali)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                                '5': { name: 'PETA (Vrlo mali)', color: 'bg-green-100 text-green-800 border-green-200' }
                            };

                            const info = categoryInfo[category as keyof typeof categoryInfo];

                            return (
                                <div key={category} className={`p-3 rounded-lg border-2 ${info.color}`}>
                                    <div className="text-xs font-medium mb-1">{info.name}</div>
                                    <div className="text-2xl font-bold">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigacija između grupa */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Grupe Rizika</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {RISK_GROUPS.map((group) => {
                            const isActive = group.id === activeGroupId;

                            // Filtriraj stavke po grupi na osnovu ID-ja stavke umesto groupId iz baze
                            const groupData = getRiskGroupData(group.id);
                            const groupItemIds = new Set<string>();
                            if (groupData) {
                                groupData.risks.forEach(risk => {
                                    risk.items.forEach(item => {
                                        groupItemIds.add(item.id);
                                    });
                                });
                            }

                            // Broji samo stavke koje pripadaju ovoj grupi na osnovu ID-ja
                            let completedItems = 0;
                            const currentGroupItems = allPrilogMData.get(group.id) || [];
                            currentGroupItems.forEach(item => {
                                if (groupItemIds.has(item.id)) {
                                    completedItems++;
                                }
                            });

                            // Dodaj N/A stavke za ovu grupu
                            const groupSelections = allSelections.get(group.id) || [];
                            groupSelections.forEach(selection => {
                                if (selection.danger_level === 0 && groupItemIds.has(selection.risk_id)) {
                                    completedItems++;
                                }
                            });

                            const totalItems = groupItemIds.size;

                            // Debug informacije - samo za problematične grupe
                            if (completedItems > totalItems && completedItems > 0) {
                                console.warn(`⚠️ Grupa ${group.id}: completedItems (${completedItems}) > totalItems (${totalItems})`);
                                const groupItems = allPrilogMData.get(group.id) || [];
                                debugLog('🔍 Stavke u grupi:', groupItems.map(item => ({ id: item.id, groupId: item.groupId })));
                                debugLog('🔍 Ukupno stavki u grupi iz definicije:', totalItems);
                            }

                            const isCompleted = completedItems > 0;
                            const completionPercentage = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

                            return (
                                <button
                                    key={group.id}
                                    onClick={() => handleGroupSwitch(group.id)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${isActive
                                        ? 'border-blue-500 bg-blue-50'
                                        : isCompleted
                                            ? 'border-green-300 bg-green-50 hover:border-green-400'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-gray-800">{group.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {completionPercentage === 100 && <span className="text-green-600">✅</span>}
                                            {completionPercentage > 0 && completionPercentage < 100 && (
                                                <span className="text-yellow-600">⏳</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>

                                    {/* Progress info */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">
                                                {completedItems} од {totalItems} завршено
                                            </span>
                                            <span className={`font-medium ${completionPercentage === 100 ? 'text-green-600' :
                                                completionPercentage > 0 ? 'text-yellow-600' :
                                                    'text-gray-400'
                                                }`}>
                                                {completionPercentage}%
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${completionPercentage === 100 ? 'bg-green-500' :
                                                    completionPercentage > 0 ? 'bg-yellow-500' :
                                                        'bg-gray-300'
                                                    }`}
                                                style={{ width: `${Math.min(100, completionPercentage)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Aktivna tabela */}
                {activeGroupData && activeGroupInfo && (
                    <RiskAssessmentTable
                        procenaId={procenaId}
                        riskGroupData={activeGroupData}
                        onSelectionChange={activeGroupSelectionCallback}
                        onPrilogMUpdate={activeGroupPrilogMCallback}
                        onUnsavedChanges={setHasUnsavedChanges}
                        readOnly={readOnly}
                    />
                )}

                {/* Dugme "Gotovo" - prikazuje se kada su sve grupe završene */}
                {statistics.completionPercentage === 100 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 Procena rizika je završena!</h2>
                                <p className="text-gray-600 mb-6">
                                    Uspešno ste završili procenu rizika za sve grupe.
                                    Ukupno je procenjeno {statistics.completedItems} stavki.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={exportData}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    📊 Izvezi Rezultate
                                </button>

                                {!readOnly && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                // Ažuriraj status procene na 'zavrsena'
                                                const response = await fetch(`/api/procena/${procenaId}/status`, {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({ status: 'zavrsena' })
                                                });

                                                if (response.ok) {
                                                    debugLog('✅ Status procene ažuriran na "zavrsena"');
                                                    window.location.href = '/';
                                                } else {
                                                    console.error('❌ Greška pri ažuriranju statusa procene');
                                                    // I dalje preusmeri korisnika, ali prikaži upozorenje
                                                    alert('Procena je završena, ali status možda nije ažuriran. Kontaktirajte administratora.');
                                                    window.location.href = '/';
                                                }
                                            } catch (error) {
                                                console.error('❌ Greška pri komunikaciji sa serverom:', error);
                                                alert('Procena je završena, ali status možda nije ažuriran. Kontaktirajte administratora.');
                                                window.location.href = '/';
                                            }
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        ✅ Gotovo - Povratak na početnu
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal za finansijske podatke */}
                {showFinancialForm && (
                    <FinancialDataForm
                        procenaId={procenaId}
                        onSave={(data) => {
                            debugLog('Finansijski podaci sačuvani:', data);
                            // Možda treba da se osvežе podaci
                        }}
                        onClose={() => setShowFinancialForm(false)}
                    />
                )}

            </div>
        </div>
    );
}

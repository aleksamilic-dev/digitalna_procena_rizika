'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleCheck, Download, Eye, FileText, Pencil, Wallet } from 'lucide-react';
import { RISK_GROUPS } from '../data/riskGroups';
import { getRiskGroupData, normalizePrilogMRow, type PrilogMData } from '../data/riskDataLoader';
import RiskAssessmentTable from './RiskAssessmentTable';
import FinancialDataForm from './FinancialDataForm';
import { btn, card, ProgressBar, Spinner, StatusBadge } from './ui';

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

export interface ProcenaInfo {
    pravnoLiceId: number;
    naziv: string;
    pib: string;
    status: string;
    datum: string;
}

export type AssessmentTab = 'identifikacija' | 'prilog-m' | 'prilog-lj' | 'prilog-s-b1' | 'prilozi-t-u-ch' | 'akt-f';

const TABS: { id: AssessmentTab; label: string }[] = [
    { id: 'identifikacija', label: 'Идентификација ризика' },
    { id: 'prilog-m', label: 'Прилог М' },
    { id: 'prilog-lj', label: 'Прилог Љ' },
    { id: 'prilog-s-b1', label: 'Прилози С и Б1' },
    { id: 'prilozi-t-u-ch', label: 'Прилози Т, У и Ћ' },
    { id: 'akt-f', label: 'Акт о процени (Ф)' },
];

const KATEGORIJE: { id: 1 | 2 | 3 | 4 | 5; naziv: string; boja: string }[] = [
    { id: 1, naziv: 'Изразито велики', boja: 'bg-red-50 text-red-700 ring-red-600/20' },
    { id: 2, naziv: 'Велики', boja: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
    { id: 3, naziv: 'Умерено велики', boja: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    { id: 4, naziv: 'Мали', boja: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
    { id: 5, naziv: 'Врло мали', boja: 'bg-green-50 text-green-700 ring-green-600/20' },
];

// Ukupan broj stavki po grupi zavisi samo od definicije priloga, pa se računa jednom
const STAVKE_PO_GRUPI = new Map(RISK_GROUPS.map(group => {
    const ids = new Set<string>();
    getRiskGroupData(group.id)?.risks.forEach(risk => risk.items.forEach(item => ids.add(item.id)));
    return [group.id, ids] as const;
}));

interface OptimizedRiskAssessmentProps {
    procenaId: string;
    procena: ProcenaInfo;
    readOnly?: boolean;
    modeToggleHref: string;
}

export default function OptimizedRiskAssessment({ procenaId, procena, readOnly = false, modeToggleHref }: OptimizedRiskAssessmentProps) {
    const [activeGroupId, setActiveGroupId] = useState<string>('group1');
    const [activeTab, setActiveTab] = useState<AssessmentTab>('identifikacija');
    const [allSelections, setAllSelections] = useState<Map<string, RiskSelection[]>>(new Map());
    const [allPrilogMData, setAllPrilogMData] = useState<Map<string, PrilogMData[]>>(new Map());
    const [loading, setLoading] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [showFinancialForm, setShowFinancialForm] = useState(false);
    const [financialInitialData, setFinancialInitialData] = useState<{
        poslovniPrihodi: number;
        vrednostImovine: number;
        delatnost: string;
        stvarnaSteta: number;
    } | undefined>(undefined);

    // Forma mora da krene od sačuvanih podataka, inače bi "Sačuvaj" upisao podrazumevane 1.000.000 / 5.000.000
    const openFinancialForm = async () => {
        try {
            const response = await fetch(`/api/procena/${procenaId}/financial-data`);
            if (response.ok) {
                const data = await response.json();
                setFinancialInitialData(data.poslovniPrihodi > 0 ? data : undefined);
            }
        } catch (error) {
            console.error('Greška pri učitavanju finansijskih podataka:', error);
        }
        setShowFinancialForm(true);
    };
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Statistika se računa iz trenutnih podataka; ranije je useCallback([]) čitao zastarele
    // izbore, pa se N/A stavke nisu brojale kao završene i napredak nije mogao da dostigne 100 %
    const statistics = useMemo(() => {
        let totalItems = 0;
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

        allPrilogMData.forEach(groupData => {
            groupData.forEach(item => {
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
        allSelections.forEach((groupSelections) => {
            groupSelections.forEach(selection => {
                if (selection.danger_level === 0) {
                    uniqueCompletedItems.add(selection.risk_id);
                }
            });
        });

        const completedItems = uniqueCompletedItems.size;
        const completionPercentage = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

        return {
            totalItems,
            completedItems,
            completionPercentage,
            highRiskItems,
            riskCategories
        };
    }, [allPrilogMData, allSelections]);

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
                        // PostgreSQL vraća ključeve malim slovima i VARCHAR vrednosti (nivoRizika,
                        // kategorijaRizika) kao tekst - normalizuj u brojeve
                        const dbItem = item as Record<string, unknown>;
                        const mappedItem: PrilogMData = normalizePrilogMRow(dbItem);
                        const groupId = mappedItem.groupId;

                        // Debug: prikaži mapiranje groupId
                        const originalGroupId = String(dbItem.groupid || dbItem.groupId || '');
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
                } else {
                    // Inicijalizuj prazne podatke ako nema odgovora
                    const newPrilogMData = new Map<string, PrilogMData[]>();
                    RISK_GROUPS.forEach(group => {
                        newPrilogMData.set(group.id, []);
                    });
                    setAllPrilogMData(newPrilogMData);
                }

            } catch (error) {
                console.error('Greška pri učitavanju podataka:', error);
                // Inicijalizuj prazne podatke u slučaju greške
                const newPrilogMData = new Map<string, PrilogMData[]>();
                RISK_GROUPS.forEach(group => {
                    newPrilogMData.set(group.id, []);
                });
                setAllPrilogMData(newPrilogMData);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [procenaId]); // Only depend on procenaId, which should be stable



    // Callback za ažuriranje selekcija - tabela šalje izbore svih grupa, pa se grupišu po ID-u rizika
    const handleSelectionChange = useCallback((selections: RiskSelection[]) => {
        const newMap = new Map<string, RiskSelection[]>();
        selections.forEach(selection => {
            const groupId = `group${selection.risk_id.split('.')[0]}`;
            newMap.set(groupId, [...(newMap.get(groupId) || []), selection]);
        });
        setAllSelections(newMap);
    }, []);

    // Callback za ažuriranje Prilog M podataka - dobija sve stavke svih grupa, jer promena
    // Svo jedne grupe (Prilog B1) menja štetu i nivo rizika stavki u ostalim grupama
    const handlePrilogMUpdate = useCallback((prilogMData: PrilogMData[]) => {
        const newMap = new Map<string, PrilogMData[]>();
        RISK_GROUPS.forEach(group => newMap.set(group.id, []));
        prilogMData.forEach(item => {
            newMap.get(item.groupId)?.push(item);
        });
        setAllPrilogMData(newMap);
    }, []);

    const activeGroupSelectionCallback = handleSelectionChange;

    const activeGroupPrilogMCallback = useCallback((prilogMData: PrilogMData[]) => {
        handlePrilogMUpdate(prilogMData);
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
    const handleGroupSwitch = (newGroupId: string): boolean => {
        if (hasUnsavedChanges) {
            const confirmed = confirm(
                'Имате несачуване промене за тренутни прилог.\n\n' +
                'Да ли сте сигурни да желите да пређете на други прилог?\n' +
                'Несачуване промене ће бити изгубљене.'
            );

            if (!confirmed) {
                return false; // Ne menjaj prilog ako korisnik nije potvrdio
            }
        }

        setActiveGroupId(newGroupId);
        setHasUnsavedChanges(false); // Reset unsaved changes flag
        return true;
    };

    // Napredak po grupi za navigaciju; Set sprečava da se ista stavka broji dvaput
    const groupProgress = useMemo(() => {
        const napredak = new Map<string, { zavrseno: number; ukupno: number }>();
        RISK_GROUPS.forEach(group => {
            const ids = STAVKE_PO_GRUPI.get(group.id) ?? new Set<string>();
            const zavrsene = new Set<string>();
            (allPrilogMData.get(group.id) || []).forEach(item => {
                if (ids.has(item.id)) zavrsene.add(item.id);
            });
            (allSelections.get(group.id) || []).forEach(selection => {
                if (selection.danger_level === 0 && ids.has(selection.risk_id)) zavrsene.add(selection.risk_id);
            });
            napredak.set(group.id, { zavrseno: zavrsene.size, ukupno: ids.size });
        });
        return napredak;
    }, [allPrilogMData, allSelections]);

    // Upozori pre zatvaranja ili osvežavanja stranice sa nesačuvanim izmenama
    useEffect(() => {
        if (!hasUnsavedChanges || readOnly) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges, readOnly]);

    const handleFinish = async () => {
        setFinishing(true);
        try {
            const response = await fetch(`/api/procena/${procenaId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'zavrsena' })
            });
            if (!response.ok) {
                throw new Error(`Status ${response.status}`);
            }
            window.location.href = '/';
        } catch (error) {
            console.error('Greška pri ažuriranju statusa procene:', error);
            alert('Статус процене није ажуриран. Покушајте поново.');
            setFinishing(false);
        }
    };

    if (loading) {
        return <Spinner label="Учитавам процену ризика..." />;
    }

    const activeIndex = RISK_GROUPS.findIndex(group => group.id === activeGroupId);
    const prevGroup = RISK_GROUPS[activeIndex - 1];
    const nextGroup = RISK_GROUPS[activeIndex + 1];
    const oznakaGrupe = (name: string) => name.replace(' (нормативан)', '');

    const goToGroup = (groupId: string) => {
        if (handleGroupSwitch(groupId)) {
            document.getElementById('grupe-rizika')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className={hasUnsavedChanges && !readOnly ? 'pb-24' : ''}>
            {/* Zaglavlje procene sa napretkom i karticama */}
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
                    <Link href="/procena-history" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                        <ArrowLeft className="h-4 w-4" />
                        Све процене
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-semibold text-slate-900">{procena.naziv}</h1>
                                <StatusBadge status={procena.status} cirilica />
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                                ПИБ {procena.pib} · Процена #{procenaId} · креирана {new Date(procena.datum).toLocaleDateString('sr-RS')}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {readOnly ? (
                                <Link href={modeToggleHref} className={btn.primary}>
                                    <Pencil className="h-4 w-4" />
                                    Уреди
                                </Link>
                            ) : (
                                <Link href={modeToggleHref} className={btn.secondary}>
                                    <Eye className="h-4 w-4" />
                                    Само преглед
                                </Link>
                            )}
                            {!readOnly && (
                                <button onClick={openFinancialForm} className={btn.secondary}>
                                    <Wallet className="h-4 w-4" />
                                    Финансијски подаци
                                </button>
                            )}
                            <Link href={`/optimized-risk/${procenaId}/akt`} className={btn.secondary}>
                                <FileText className="h-4 w-4" />
                                Акт (штампа / PDF)
                            </Link>
                            <button onClick={exportData} className={btn.secondary} title="Преузми све податке процене као JSON датотеку">
                                <Download className="h-4 w-4" />
                                Извези податке
                            </button>
                        </div>
                    </div>

                    {readOnly && (
                        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            Режим прегледа — измене нису могуће. Кликните „Уреди“ да бисте мењали процену.
                        </p>
                    )}

                    <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                        <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-4 text-sm">
                                <span className="font-medium text-slate-700">Напредак процене</span>
                                <span className="text-slate-600">
                                    {statistics.completedItems} од {statistics.totalItems} ставки · <span className="font-semibold text-slate-900">{statistics.completionPercentage}%</span>
                                </span>
                            </div>
                            <ProgressBar percent={statistics.completionPercentage} className="mt-2 h-2" />
                        </div>
                        <div className="flex flex-wrap gap-1.5" aria-label="Број ризика по категоријама">
                            {KATEGORIJE.map(kategorija => (
                                <span
                                    key={kategorija.id}
                                    title={`${kategorija.id}. категорија ризика`}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${kategorija.boja}`}
                                >
                                    {kategorija.naziv}
                                    <span className="font-semibold">{statistics.riskCategories[kategorija.id]}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <nav className="-mb-px mt-5 flex gap-6 overflow-x-auto" aria-label="Делови процене">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-700'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Navigacija između grupa rizika */}
                {activeTab === 'identifikacija' && (
                    <div id="grupe-rizika" className="mb-6 grid scroll-mt-20 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {RISK_GROUPS.map(group => {
                            const { zavrseno, ukupno } = groupProgress.get(group.id) ?? { zavrseno: 0, ukupno: 0 };
                            const procenat = ukupno > 0 ? Math.round((zavrseno / ukupno) * 100) : 0;
                            const isActive = group.id === activeGroupId;

                            return (
                                <button
                                    key={group.id}
                                    onClick={() => handleGroupSwitch(group.id)}
                                    title={group.description}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${isActive
                                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold text-slate-900">{oznakaGrupe(group.name)}</span>
                                        {procenat === 100
                                            ? <CircleCheck className="h-4 w-4 text-green-600" aria-label="Завршено" />
                                            : <span className="text-slate-500">{zavrseno}/{ukupno}</span>}
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-slate-600">{group.kratkiNaziv}</div>
                                    <ProgressBar percent={procenat} className="mt-2" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {activeGroupData && activeGroupInfo && (
                    <RiskAssessmentTable
                        procenaId={procenaId}
                        riskGroupData={activeGroupData}
                        onSelectionChange={activeGroupSelectionCallback}
                        onPrilogMUpdate={activeGroupPrilogMCallback}
                        onUnsavedChanges={setHasUnsavedChanges}
                        readOnly={readOnly}
                        activeTab={activeTab}
                        onGoToTab={setActiveTab}
                    />
                )}

                {/* Prelazak na susednu grupu bez vraćanja na vrh stranice */}
                {activeTab === 'identifikacija' && (
                    <div className="mt-6 flex items-center justify-between gap-4">
                        {prevGroup ? (
                            <button onClick={() => goToGroup(prevGroup.id)} className={btn.secondary}>
                                <ChevronLeft className="h-4 w-4" />
                                {oznakaGrupe(prevGroup.name)}
                            </button>
                        ) : <span />}
                        {nextGroup ? (
                            <button onClick={() => goToGroup(nextGroup.id)} className={btn.primary}>
                                Следећа: {oznakaGrupe(nextGroup.name)}
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button onClick={() => setActiveTab('prilog-m')} className={btn.primary}>
                                Прилог М
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {statistics.completionPercentage === 100 && !readOnly && procena.status !== 'zavrsena' && (
                    <div className={`${card} mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
                        <div className="flex items-start gap-3">
                            <CircleCheck className="h-6 w-6 shrink-0 text-green-600" />
                            <div>
                                <h2 className="font-semibold text-slate-900">Све ставке су процењене</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Процењено је {statistics.completedItems} ставки. Када попуните и остале прилоге, означите процену као завршену.
                                </p>
                            </div>
                        </div>
                        <button onClick={handleFinish} disabled={finishing} className={btn.primary}>
                            {finishing ? 'Чувам...' : 'Заврши процену'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal za finansijske podatke */}
            {showFinancialForm && (
                <FinancialDataForm
                    procenaId={procenaId}
                    initialData={financialInitialData}
                    onSave={(data) => {
                        debugLog('Finansijski podaci sačuvani:', data);
                        // Tabela procene preračunava štetu i nivo rizika sa novim podacima
                        window.dispatchEvent(new CustomEvent('financialDataSaved', { detail: { procenaId, data } }));
                    }}
                    onClose={() => setShowFinancialForm(false)}
                />
            )}
        </div>
    );
}

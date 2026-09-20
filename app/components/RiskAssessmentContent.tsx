"use client";
import { useState } from "react";
import { PrilogMData } from "../data/riskDataLoader";
import { RiskGroupData } from "../data/riskGroups";
import PrilogMDetails from "./PrilogMDetails";
import RiskAssessmentHeader from "./RiskAssessmentHeader";
import RiskAssessmentMainTable from "./RiskAssessmentMainTable";
import PrilogMTable from "./PrilogMTable";
import PrilogLjTable from "./PrilogLjTable";
import PrilogSTable from "./PrilogSTable";
import PrilogB1Table from "./PrilogB1Table";
import PrilogTTable from "./PrilogTTable";
import PrilogUTable from "./PrilogUTable";
import PrilogChTable from "./PrilogChTable";
import PrilogFContainer from "./PrilogF/PrilogFContainer";
import RiskParametersForm from "./RiskParametersForm";
import FinancialDataWarning from "./FinancialDataWarning";
import FinancialDataForm from "./FinancialDataForm";
import type { AssessmentTab } from "./OptimizedRiskAssessment";
import { btn, card } from "./ui";

interface FinancialData {
    poslovniPrihodi: number;
    vrednostImovine: number;
    delatnost: string;
    stvarnaSteta: number;
}

interface RiskSelection {
    risk_id: string;
    danger_level: number;
    description: string;
}

interface RiskAssessmentContentProps {
    procenaId: string;
    riskGroupData: RiskGroupData;
    selections: Map<string, RiskSelection>;
    prilogMData: Map<string, PrilogMData>;
    hasUnsavedChanges: boolean;
    saving: boolean;
    loading: boolean;
    hasValidFinancialData: boolean;
    currentFinancialData: FinancialData | null;
    setCurrentFinancialData: (data: FinancialData | null) => void;
    setHasValidFinancialData: (valid: boolean) => void;
    pendingRiskData: { riskId: string; dangerLevel: number; description: string } | null;
    setPendingRiskData: (data: { riskId: string; dangerLevel: number; description: string } | null) => void;
    onCellClick: (riskId: string, dangerLevel: number, description: string) => Promise<{ showParametersForm: boolean } | undefined>;
    onParametersSet: (params: { stepenIzlozenosti: number; stepenRanjivosti: number; kriticnost: number; }) => Promise<void>;
    onSaveChanges: () => Promise<void>;
    getCellClass: (riskId: string, level: number, hasContent: boolean) => string;
    onPrilogMUpdate?: (itemId: string, field: 'posledice' | 'steta' | 'opisIdentifikovanihRizika', value: number | string) => void;
    readOnly?: boolean;
    activeTab: AssessmentTab;
    onGoToTab: (tab: AssessmentTab) => void;
}

export default function RiskAssessmentContent({
    procenaId,
    riskGroupData,
    selections,
    prilogMData,
    hasUnsavedChanges,
    saving,
    loading,
    hasValidFinancialData,
    currentFinancialData,
    setCurrentFinancialData,
    setHasValidFinancialData,
    pendingRiskData,
    setPendingRiskData,
    onCellClick,
    onParametersSet,
    onSaveChanges,
    getCellClass,
    onPrilogMUpdate,
    readOnly = false,
    activeTab,
    onGoToTab
}: RiskAssessmentContentProps) {
    const [selectedItemForDetails, setSelectedItemForDetails] = useState<PrilogMData | null>(null);
    const [showParametersForm, setShowParametersForm] = useState(false);
    const [showFinancialForm, setShowFinancialForm] = useState(false);
    const [sharedResourceScore, setSharedResourceScore] = useState<number | null>(null);
    const [sharedPrilogUScore, setSharedPrilogUScore] = useState<number | null>(null);

    const handleCellClick = async (riskId: string, dangerLevel: number, description: string) => {


        if (readOnly) return; // Disable cell clicks in read-only mode

        const result = await onCellClick(riskId, dangerLevel, description);
        if (result?.showParametersForm) {
            setShowParametersForm(true);
        }
    };

    const handleParametersSet = async (params: { stepenIzlozenosti: number; stepenRanjivosti: number; kriticnost: number; }) => {
        await onParametersSet(params);
        setShowParametersForm(false);
        setPendingRiskData(null);
    };

    const imaStavki = prilogMData.size > 0;
    // Selekcije sadrže sve grupe; ID rizika počinje brojem grupe
    const naSelections = Array.from(selections.values()).filter(selection =>
        selection.danger_level === 0 && `group${selection.risk_id.split('.')[0]}` === riskGroupData.id);
    const koristiPodrazumevaneFinansije = Array.from(prilogMData.values()).some(item => item.usingDefaultFinancialData);

    const praznoStanje = (
        <div className={`${card} p-10 text-center`}>
            <p className="text-sm text-slate-600">Ова процена још нема процењених ставки.</p>
            <button onClick={() => onGoToTab('identifikacija')} className={`${btn.secondary} mt-4`}>
                Иди на идентификацију ризика
            </button>
        </div>
    );

    return (
        <>
            {activeTab === 'identifikacija' && (
                <div className={`${card} p-6`}>
                    <RiskAssessmentHeader
                        groupName={riskGroupData.name}
                        groupDescription={riskGroupData.description}
                    />

                    {!readOnly && (
                        <p className="mb-4 text-sm text-slate-500">
                            За сваки захтев кликните на ћелију која најбоље описује стање, или на „Н/А“ ако захтев није применљив.
                        </p>
                    )}

                    {loading && (
                        <p className="mb-4 text-sm text-slate-500">Чување селекције...</p>
                    )}

                    {!hasValidFinancialData && !readOnly && (
                        <FinancialDataWarning onOpenForm={() => setShowFinancialForm(true)} />
                    )}

                    <RiskAssessmentMainTable
                        key={`table-${selections.size}`} // Force re-render when selections change
                        riskGroupData={riskGroupData}
                        onCellClick={handleCellClick}
                        getCellClass={getCellClass}
                    />

                    {naSelections.length > 0 && (
                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-slate-800">
                                Захтеви означени као „Није применљиво“ (Н/А)
                            </h4>
                            <div className="grid gap-2">
                                {naSelections.map(selection => (
                                    <div key={selection.risk_id} className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-slate-700">{selection.risk_id}</span>
                                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">Н/А</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'prilog-m' && (imaStavki ? (
                <div className="space-y-4">
                    {koristiPodrazumevaneFinansije && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p className="font-medium">Користе се подразумевани финансијски подаци</p>
                            <p className="mt-1">
                                Резултати могу бити нетачни јер се рачуна са пословним приходима од 1.000.000 РСД и вредношћу имовине од 5.000.000 РСД.
                                Унесите стварне податке преко дугмета „Финансијски подаци“ за тачну процену према SRPS A.L2.003:2025.
                            </p>
                        </div>
                    )}
                    <PrilogMTable
                        prilogMData={prilogMData}
                        onShowDetails={setSelectedItemForDetails}
                        readOnly={readOnly}
                        onUpdateItem={readOnly ? undefined : async (itemId: string, field: 'posledice' | 'steta', value: number) => {
                            try {
                                const response = await fetch(`/api/procena/${procenaId}/prilog-m?itemId=${itemId}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        [field]: value
                                    }),
                                });

                                if (!response.ok) {
                                    throw new Error('Failed to update item');
                                }

                                // Pozovi callback za lokalno ažuriranje
                                if (onPrilogMUpdate) {
                                    onPrilogMUpdate(itemId, field, value);
                                }
                            } catch (error) {
                                console.error('Error updating item:', error);
                                alert('Грешка при чувању промене. Покушајте поново.');
                            }
                        }}
                    />
                </div>
            ) : praznoStanje)}

            {activeTab === 'prilog-lj' && (imaStavki ? (
                <PrilogLjTable
                    prilogMData={prilogMData}
                    procenaId={procenaId}
                    readOnly={readOnly}
                    onUpdateOpis={readOnly ? undefined : async (sectionId: string, opis: string) => {
                        try {
                            const response = await fetch(`/api/procena/${procenaId}/prilog-lj?sectionId=${sectionId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    opisIdentifikovanihRizika: opis
                                }),
                            });

                            if (!response.ok) {
                                throw new Error('Failed to update opis');
                            }
                        } catch (error) {
                            console.error('Error updating Prilog Lj opis:', error);
                            alert('Грешка при чувању описа. Покушајте поново.');
                        }
                    }}
                />
            ) : praznoStanje)}

            {activeTab === 'prilog-s-b1' && (
                <div>
                    <PrilogSTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                    />
                    {/* Prilog B1 - Uticaj delatnosti */}
                    <PrilogB1Table prilogMData={prilogMData} />
                </div>
            )}

            {/* Prilozi T i U daju ocene koje Prilog Ћ koristi, pa su na istoj kartici */}
            {activeTab === 'prilozi-t-u-ch' && (
                <div>
                    <PrilogTTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        onResourceScoreUpdate={setSharedResourceScore}
                    />
                    <PrilogUTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        onScoreUpdate={setSharedPrilogUScore}
                    />
                    <PrilogChTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        resourceScoreOverride={sharedResourceScore}
                        prilogUScoreOverride={sharedPrilogUScore}
                    />
                </div>
            )}

            {/* Prilog F - Акт о процени ризика (Табеле Ф.1 - Ф.6) */}
            {activeTab === 'akt-f' && (
                <PrilogFContainer
                    procenaId={procenaId}
                    readOnly={readOnly}
                />
            )}

            {/* Traka za čuvanje ostaje vidljiva na svim karticama */}
            {hasUnsavedChanges && !readOnly && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-amber-50/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                        <p className="text-sm font-medium text-amber-800">Имате несачуване промене.</p>
                        <button onClick={onSaveChanges} disabled={saving} className={btn.primary}>
                            {saving ? 'Чувам...' : 'Сачувај промене'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedItemForDetails && (
                <PrilogMDetails
                    data={selectedItemForDetails}
                    onClose={() => setSelectedItemForDetails(null)}
                />
            )}

            {showParametersForm && pendingRiskData && (
                <RiskParametersForm
                    riskId={pendingRiskData.riskId}
                    riskDescription={pendingRiskData.description}
                    onParametersSet={handleParametersSet}
                    onCancel={() => {
                        setShowParametersForm(false);
                        setPendingRiskData(null);
                    }}
                />
            )}

            {showFinancialForm && !readOnly && (
                <FinancialDataForm
                    procenaId={procenaId}
                    initialData={currentFinancialData || undefined}
                    onSave={(data) => {
                        // Jednostavno ažuriraj lokalne podatke bez dodatnih API poziva
                        const isValid = data.poslovniPrihodi > 0 && data.vrednostImovine > 0;
                        setHasValidFinancialData(isValid);
                        setCurrentFinancialData(data);
                        setShowFinancialForm(false);
                    }}
                    onClose={() => setShowFinancialForm(false)}
                />
            )}
        </>
    );
}

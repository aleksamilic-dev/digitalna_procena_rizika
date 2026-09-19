"use client";
import { useState } from "react";
import { PrilogMData } from "../data/riskDataLoader";
import { RiskGroupData } from "../data/riskGroups";
import PrilogMDetails from "./PrilogMDetails";
import RiskAssessmentHeader from "./RiskAssessmentHeader";
import RiskAssessmentStatusMessages from "./RiskAssessmentStatusMessages";
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
    readOnly = false
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

    return (
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
            <RiskAssessmentHeader
                groupName={riskGroupData.name}
                groupDescription={riskGroupData.description}
                hasUnsavedChanges={hasUnsavedChanges}
                saving={saving}
                onSaveChanges={onSaveChanges}
                readOnly={readOnly}
            />

            <RiskAssessmentStatusMessages
                hasUnsavedChanges={hasUnsavedChanges}
                saving={saving}
                loading={loading}
            />

            {/* Financial data warning */}
            {!hasValidFinancialData && !readOnly && (
                <FinancialDataWarning onOpenForm={() => {
                    // Jednostavno otvori form bez dodatnih API poziva
                    setShowFinancialForm(true);
                }} />
            )}

            <RiskAssessmentMainTable
                key={`table-${selections.size}`} // Force re-render when selections change
                riskGroupData={riskGroupData}
                onCellClick={handleCellClick}
                getCellClass={getCellClass}
            />

            {/* Summary with selections and Prilog M data */}
            {selections.size > 0 && (
                <div className="mt-6 space-y-4">
                    {/* N/A selections summary */}
                    {(() => {
                        const naSelections = Array.from(selections.values()).filter(s => s.danger_level === 0);
                        if (naSelections.length > 0) {
                            return (
                                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                                    <h4 className="font-bold text-gray-800 mb-3">
                                        Ризици означени као &quot;Није применљиво&quot; (N/A):
                                    </h4>
                                    <div className="grid gap-2">
                                        {naSelections.map(selection => (
                                            <div key={selection.risk_id} className="flex items-center space-x-2 text-sm">
                                                <span className="font-medium text-gray-700">{selection.risk_id}:</span>
                                                <span className="text-gray-600">{selection.description}</span>
                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">N/A</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Warning about default financial data */}
                    {Array.from(prilogMData.values()).some(item => item.usingDefaultFinancialData) && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-orange-800">
                                        Упозорење: Користе се default финансијски подаци
                                    </h3>
                                    <div className="mt-2 text-sm text-orange-700">
                                        <p>
                                            Резултати процене ризика могу бити нетачни јер се користе default вредности:
                                        </p>
                                        <ul className="list-disc list-inside mt-1">
                                            <li>Пословни приходи: 1.000.000 РСД</li>
                                            <li>Вредност имовине: 5.000.000 РСД</li>
                                        </ul>
                                        <p className="mt-2">
                                            <strong>Препорука:</strong> Унесите стварне финансијске податке за тачну процену ризика према стандарду SRPS A.L2.003:2025.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prilog M table for calculated risks */}
                    {prilogMData.size > 0 && (
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

                                    console.log(`✅ Updated ${field} for item ${itemId} to ${value}`);

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
                    )}

                    {/* Prilog Lj table - prikaži samo ako ima podataka */}
                    {prilogMData.size > 0 && (
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

                                    console.log(`✅ Updated Prilog Lj opis for section ${sectionId}`);
                                } catch (error) {
                                    console.error('Error updating Prilog Lj opis:', error);
                                    alert('Грешка при чувању описа. Покушајте поново.');
                                }
                            }}
                        />
                    )}

                    {/* Prilog S table - prikaži uvek */}
                    <PrilogSTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        onUpdateItem={readOnly ? undefined : async (itemId: number, vrednost: string) => {
                            console.log(`✅ Updated Prilog S item ${itemId} with value: ${vrednost}`);
                        }}
                    />

                    {/* Prilog B1 table - Uticaj delatnosti */}
                    <PrilogB1Table prilogMData={prilogMData} />

                    {/* Prilog T table - Ocena resursa */}
                    <PrilogTTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        onResourceScoreUpdate={setSharedResourceScore}
                    />

                    {/* Prilog U table - Kvalifikovanost menadzera */}
                    <PrilogUTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        onScoreUpdate={setSharedPrilogUScore}
                    />

                    {/* Prilog Ћ table - Matrica za ocenjivanje */}
                    <PrilogChTable
                        procenaId={procenaId}
                        readOnly={readOnly}
                        resourceScoreOverride={sharedResourceScore}
                        prilogUScoreOverride={sharedPrilogUScore}
                    />

                    {/* Prilog F Container - Акт о процени ризика (Табеле Ф.1 - Ф.5) */}
                    <PrilogFContainer
                        procenaId={procenaId}
                        readOnly={readOnly}
                    />
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
        </div>
    );
}
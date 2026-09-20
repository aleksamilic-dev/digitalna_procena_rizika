"use client";
import { useState, useEffect } from "react";
import { RiskGroupData } from "../data/riskGroups";
import { PrilogMData, primeniRucnuIzmenu, recalculatePrilogM, resolveFinansijskiPodaci } from "../data/riskDataLoader";
import { useRiskAssessmentData } from "./hooks/useRiskAssessmentData";
import { useRiskAssessmentActions } from "./hooks/useRiskAssessmentActions";
import { getCellClass } from "./utils/riskAssessmentHelpers";
import RiskAssessmentContent from "./RiskAssessmentContent";
import type { AssessmentTab } from "./OptimizedRiskAssessment";
import { card } from "./ui";

interface RiskSelection {
    risk_id: string;
    danger_level: number;
    description: string;
}

interface RiskAssessmentTableProps {
    procenaId: string;
    riskGroupData: RiskGroupData;
    onSelectionChange?: (selections: RiskSelection[]) => void;
    onPrilogMUpdate?: (prilogMData: PrilogMData[]) => void;
    onUnsavedChanges?: (hasUnsaved: boolean) => void;
    readOnly?: boolean;
    activeTab: AssessmentTab;
    onGoToTab: (tab: AssessmentTab) => void;
}



export default function RiskAssessmentTable({ procenaId, riskGroupData, onSelectionChange, onPrilogMUpdate, onUnsavedChanges, readOnly = false, activeTab, onGoToTab }: RiskAssessmentTableProps) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Use custom hooks for data management
    const {
        selections,
        setSelections,
        prilogMData,
        setPrilogMData,
        initialLoading,
        hasValidFinancialData,
        setHasValidFinancialData,
        currentFinancialData,
        setCurrentFinancialData
    } = useRiskAssessmentData(procenaId, riskGroupData, onSelectionChange);

    // Use custom hook for actions
    const {
        loading,
        saving,
        pendingRiskData,
        setPendingRiskData,
        handleCellClick,
        handleParametersSet,
        handleSaveChanges
    } = useRiskAssessmentActions({
        procenaId,
        riskGroupData,
        selections,
        setSelections,
        prilogMData,
        setPrilogMData,
        onSelectionChange,
        setHasUnsavedChanges,
        currentFinancialData,
        hasValidFinancialData
    });



    // Notify parent component about unsaved changes
    useEffect(() => {
        if (onUnsavedChanges) {
            onUnsavedChanges(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, onUnsavedChanges]);

    // Reset unsaved changes when component mounts (new group)
    useEffect(() => {
        setHasUnsavedChanges(false);
    }, [riskGroupData.id]);

    // Kolone 7 i 9-12 zavise od Priloga B1 (Svo svih grupa) i finansijskih podataka:
    // preračunaj ih posle učitavanja i posle izmene finansijskih podataka
    useEffect(() => {
        if (initialLoading || readOnly) return;
        const { finansijskiPodaci, usingDefaultFinancialData } =
            resolveFinansijskiPodaci(currentFinancialData, hasValidFinancialData);
        const items = Array.from(prilogMData.values());
        const recalculated = recalculatePrilogM(items, finansijskiPodaci, usingDefaultFinancialData);
        const promenjeno = recalculated.some((item, index) => {
            const staro = items[index];
            return item.steta !== staro.steta || item.posledice !== staro.posledice ||
                item.nivoRizika !== staro.nivoRizika || item.kategorijaRizika !== staro.kategorijaRizika ||
                item.prihvatljivost !== staro.prihvatljivost || item.stepenSS !== staro.stepenSS ||
                item.stepenVMSH !== staro.stepenVMSH || item.vmshIznos !== staro.vmshIznos;
        });
        const oznakaPromenjena = recalculated.some((item, index) =>
            item.usingDefaultFinancialData !== items[index].usingDefaultFinancialData);
        if (promenjeno || oznakaPromenjena) {
            setPrilogMData(new Map(recalculated.map(item => [item.id, item])));
        }
        if (promenjeno) {
            setHasUnsavedChanges(true);
        }
    }, [initialLoading, readOnly, currentFinancialData, hasValidFinancialData, prilogMData, setPrilogMData]);

    // Kontrolna tabla (statistike po grupama) dobija sve stavke svih grupa
    useEffect(() => {
        if (!initialLoading && onPrilogMUpdate) {
            onPrilogMUpdate(Array.from(prilogMData.values()));
        }
    }, [initialLoading, prilogMData, onPrilogMUpdate]);

    // Create getCellClass function with current selections
    const getCellClassWithSelections = (riskId: string, level: number, hasContent: boolean) => {
        return getCellClass(riskId, level, hasContent, selections);
    };

    const handlePrilogMItemUpdate = (itemId: string, field: 'posledice' | 'steta' | 'opisIdentifikovanihRizika', value: number | string) => {
        setPrilogMData(prevData => {
            const newData = new Map(prevData);
            const item = newData.get(itemId);
            if (item) {
                // Ručna izmena štete ili posledica preračunava posledice, nivo, kategoriju i prihvatljivost
                const updatedItem = field === 'opisIdentifikovanihRizika'
                    ? { ...item, [field]: value as string }
                    : { ...item, ...primeniRucnuIzmenu(item, field, value as number) };
                newData.set(itemId, updatedItem);
            }
            return newData;
        });
    };

    if (initialLoading) {
        return (
            <div className={`${card} p-8 text-center text-sm text-slate-500`}>
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                Учитавам табелу за процену ризика...
            </div>
        );
    }

    return (
        <RiskAssessmentContent
            key={`${procenaId}-${riskGroupData.id}-${selections.size}`} // Force re-render when selections change
            procenaId={procenaId}
            riskGroupData={riskGroupData}
            selections={selections}
            prilogMData={prilogMData}
            hasUnsavedChanges={hasUnsavedChanges}
            saving={saving}
            loading={loading}
            hasValidFinancialData={hasValidFinancialData}
            currentFinancialData={currentFinancialData}
            setCurrentFinancialData={setCurrentFinancialData}
            setHasValidFinancialData={setHasValidFinancialData}
            pendingRiskData={pendingRiskData}
            setPendingRiskData={setPendingRiskData}
            onCellClick={handleCellClick}
            onParametersSet={handleParametersSet}
            onSaveChanges={handleSaveChanges}
            getCellClass={getCellClassWithSelections}
            onPrilogMUpdate={handlePrilogMItemUpdate}
            readOnly={readOnly}
            activeTab={activeTab}
            onGoToTab={onGoToTab}
        />
    );
}
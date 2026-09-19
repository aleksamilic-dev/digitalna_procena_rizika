import { useState } from "react";
import { RiskGroupData } from "../../data/riskGroups";
import {
    PrilogMData,
    getSvoPoGrupama,
    izracunajVerovatnocu,
    recalculatePrilogM,
    resolveFinansijskiPodaci
} from "../../data/riskDataLoader";

interface RiskSelection {
    risk_id: string;
    danger_level: number;
    description: string;
}



interface FinancialData {
    poslovniPrihodi: number;
    vrednostImovine: number;
    delatnost: string;
    stvarnaSteta: number;
}

interface UseRiskAssessmentActionsProps {
    procenaId: string;
    riskGroupData: RiskGroupData;
    selections: Map<string, RiskSelection>;
    setSelections: (selections: Map<string, RiskSelection>) => void;
    prilogMData: Map<string, PrilogMData>;
    setPrilogMData: (data: Map<string, PrilogMData>) => void;
    onSelectionChange?: (selections: RiskSelection[]) => void;
    setHasUnsavedChanges: (hasUnsaved: boolean) => void;
    currentFinancialData: FinancialData | null; // Dodaj finansijske podatke
    hasValidFinancialData: boolean; // Dodaj flag za validnost
}

export function useRiskAssessmentActions({
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
}: UseRiskAssessmentActionsProps) {
    const [loading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingRiskData, setPendingRiskData] = useState<{
        riskId: string;
        dangerLevel: number;
        description: string;
    } | null>(null);

    const recalculateAll = (items: PrilogMData[]) => {
        const { finansijskiPodaci, usingDefaultFinancialData } =
            resolveFinansijskiPodaci(currentFinancialData, hasValidFinancialData);
        return recalculatePrilogM(items, finansijskiPodaci, usingDefaultFinancialData);
    };

    const toPrilogMMap = (items: PrilogMData[]) => new Map(items.map(item => [item.id, item]));

    const handleCellClick = async (riskId: string, dangerLevel: number, description: string) => {
        if (loading) {
            return;
        }

        const existingSelection = selections.get(riskId);
        if (existingSelection && existingSelection.danger_level === dangerLevel) {
            console.log('Selection already exists with same danger level, skipping...');
            return;
        }

        // Handle N/A selection (level 0) directly without parameters form
        if (dangerLevel === 0) {
            const newSelection: RiskSelection = {
                risk_id: riskId,
                danger_level: dangerLevel,
                description
            };

            const newSelections = new Map(selections);
            newSelections.set(riskId, newSelection);
            setSelections(newSelections);

            // Remove from Prilog M data since it's not applicable; Svo grupe (Prilog B1) se menja,
            // pa se preračunavaju sve stavke
            const remaining = Array.from(prilogMData.values()).filter(item => item.id !== riskId);
            setPrilogMData(toPrilogMMap(recalculateAll(remaining)));

            if (onSelectionChange) {
                onSelectionChange(Array.from(newSelections.values()));
            }

            setHasUnsavedChanges(true);
            return;
        }

        setPendingRiskData({ riskId, dangerLevel, description });
        return { showParametersForm: true };
    };

    const handleParametersSet = async (params: {
        stepenIzlozenosti: number;
        stepenRanjivosti: number;
        kriticnost: number;
    }) => {
        if (!pendingRiskData) return;

        const { riskId, dangerLevel, description } = pendingRiskData;

        const newSelection: RiskSelection = {
            risk_id: riskId,
            danger_level: dangerLevel,
            description
        };

        const newSelections = new Map(selections);
        newSelections.set(riskId, newSelection);
        setSelections(newSelections);

        // Kolone 4-6 i 8 iz unetih parametara; kolone 7 i 9-12 zavise od Priloga B1 (Svo svih grupa)
        // i finansijskih podataka, pa se posle dodavanja stavke preračunavaju sve stavke
        const prilogMItem: PrilogMData = {
            id: riskId,
            groupId: riskGroupData.id,
            requirement: description,
            velicinaOpasnosti: dangerLevel,
            ...izracunajVerovatnocu(dangerLevel, params.stepenIzlozenosti, params.stepenRanjivosti),
            kriticnost: params.kriticnost,
            steta: null,
            posledice: null,
            nivoRizika: null,
            kategorijaRizika: null,
            prihvatljivost: null,
            opisIdentifikovanihRizika: prilogMData.get(riskId)?.opisIdentifikovanihRizika ?? null
        };

        const others = Array.from(prilogMData.values()).filter(item => item.id !== riskId);
        setPrilogMData(toPrilogMMap(recalculateAll([...others, prilogMItem])));

        if (onSelectionChange) {
            onSelectionChange(Array.from(newSelections.values()));
        }

        setHasUnsavedChanges(true);
        setPendingRiskData(null);
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const selectionsToSave = Array.from(selections.values());
            const prilogMToSave = Array.from(prilogMData.values());

            const [selectionResults, prilogMResults, prilogB1Result] = await Promise.allSettled([
                Promise.all(selectionsToSave.map(selection =>
                    fetch(`/api/procena/${procenaId}/risk-selection`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            risk_id: selection.risk_id,
                            danger_level: selection.danger_level,
                            description: selection.description
                        })
                    })
                )),
                Promise.all(prilogMToSave.map(item =>
                    fetch(`/api/procena/${procenaId}/prilog-m`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    })
                )),
                // Prilog B1 se čuva zajedno sa Prilogom M jer Svo po grupama potiče iz njega
                fetch(`/api/procena/${procenaId}/prilog-b1`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ svoPoGrupama: Object.fromEntries(getSvoPoGrupama(prilogMToSave)) })
                })
            ]);

            let hasErrors = false;

            if (selectionResults.status === 'rejected' || selectionResults.value.some(response => !response.ok)) {
                console.error('Error saving selections:', selectionResults);
                hasErrors = true;
            }

            if (prilogMResults.status === 'rejected' || prilogMResults.value.some(response => !response.ok)) {
                console.error('Error saving Prilog M data:', prilogMResults);
                hasErrors = true;
            }

            if (prilogB1Result.status === 'rejected' || !prilogB1Result.value.ok) {
                console.error('Error saving Prilog B1 data:', prilogB1Result);
                hasErrors = true;
            }

            if (!hasErrors) {
                setHasUnsavedChanges(false);
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                successDiv.textContent = '✅ Промене су успешно сачуване!';
                document.body.appendChild(successDiv);
                setTimeout(() => document.body.removeChild(successDiv), 3000);
            } else {
                throw new Error('Error saving data');
            }

        } catch (error) {
            console.error('Error saving:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorDiv.textContent = '❌ Greška pri čuvanju promena!';
            document.body.appendChild(errorDiv);
            setTimeout(() => document.body.removeChild(errorDiv), 3000);
        } finally {
            setSaving(false);
        }
    };

    return {
        loading,
        saving,
        pendingRiskData,
        setPendingRiskData,
        handleCellClick,
        handleParametersSet,
        handleSaveChanges
    };
}
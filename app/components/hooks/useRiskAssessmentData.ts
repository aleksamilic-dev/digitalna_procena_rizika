import { useState, useEffect, useCallback, useRef } from "react";
import { RiskGroupData } from "../../data/riskGroups";
import { PrilogMData, normalizePrilogMRow } from "../../data/riskDataLoader";

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

export function useRiskAssessmentData(
    procenaId: string,
    riskGroupData: RiskGroupData,
    onSelectionChange?: (selections: RiskSelection[]) => void
) {
    const [selections, setSelections] = useState<Map<string, RiskSelection>>(new Map());
    const [prilogMData, setPrilogMData] = useState<Map<string, PrilogMData>>(new Map());
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasValidFinancialData, setHasValidFinancialData] = useState(false);
    const [currentFinancialData, setCurrentFinancialData] = useState<FinancialData | null>(null);
    const loadedRef = useRef(false); // Koristi ref umesto state da se izbegnu rerenderovanja

    // Load financial data
    const loadFinancialData = useCallback(async () => {
        try {
            const finResponse = await fetch(`/api/procena/${procenaId}/financial-data`);
            if (finResponse.ok) {
                const finData = await finResponse.json();
                const hasValid = finData.poslovniPrihodi > 0 && finData.vrednostImovine > 0;
                setHasValidFinancialData(hasValid);
                setCurrentFinancialData(finData);
                return hasValid;
            }
        } catch (error) {
            console.error('Error loading financial data:', error);
        }
        return false;
    }, [procenaId]);

    // Load existing data on mount - SAMO JEDNOM
    useEffect(() => {
        if (loadedRef.current) return; // Ako su podaci već učitani, ne radi ništa
        loadedRef.current = true; // Označi da su podaci učitani
        
        async function loadExistingData() {
            try {
                // Check financial data
                await loadFinancialData();

                // Load selections
                const selectionsResponse = await fetch(`/api/procena/${procenaId}/risk-selection`);
                if (selectionsResponse.ok) {
                    const selectionsData = await selectionsResponse.json();
                    const selectionsMap = new Map<string, RiskSelection>();

                    selectionsData.forEach((item: { riskId?: string; riskid?: string; dangerLevel?: number; dangerlevel?: number; description?: string }) => {
                        // Handle different field name cases from database
                        const riskId = item.riskId || item.riskid;
                        const dangerLevel = item.dangerLevel ?? item.dangerlevel;
                        const description = item.description || '';

                        // dangerLevel 0 = "Није применљиво" (N/A)
                        if (riskId && dangerLevel !== undefined && dangerLevel !== null) {
                            selectionsMap.set(riskId, {
                                risk_id: riskId,
                                danger_level: dangerLevel,
                                description: description
                            });
                        }
                    });

                    setSelections(selectionsMap);

                    if (onSelectionChange) {
                        onSelectionChange(Array.from(selectionsMap.values()));
                    }
                }

                // Load Prilog M data - uvek učitaj iz API-ja da dobiješ najnovije podatke uključujući sekcijske ID-jeve
                {
                    // Učitaj iz API-ja
                    const prilogMResponse = await fetch(`/api/procena/${procenaId}/prilog-m`);
                    if (prilogMResponse.ok) {
                        const prilogMData = await prilogMResponse.json();
                        const prilogMMap = new Map<string, PrilogMData>();

                        // Učitaj SVE podatke, ne filtriraj po grupi
                        prilogMData.forEach((item: Record<string, unknown>) => {
                            const mappedItem = normalizePrilogMRow(item);
                            prilogMMap.set(mappedItem.id, mappedItem);
                        });

                        setPrilogMData(prilogMMap);
                    }
                }

            } catch (error) {
                console.error('Error loading existing data:', error);
            } finally {
                setInitialLoading(false);
            }
        }

        if (procenaId && riskGroupData.id) {
            loadExistingData();
        }
    }, [procenaId, riskGroupData.id, loadFinancialData, onSelectionChange]); // Dodao sve dependencies

    // Finansijski podaci sačuvani iz zaglavlja procene (OptimizedRiskAssessment)
    useEffect(() => {
        const handleFinancialDataSaved = (event: Event) => {
            const { procenaId: savedProcenaId, data } = (event as CustomEvent<{ procenaId: string; data: FinancialData }>).detail;
            if (savedProcenaId === procenaId) {
                setHasValidFinancialData(data.poslovniPrihodi > 0 && data.vrednostImovine > 0);
                setCurrentFinancialData(data);
            }
        };

        window.addEventListener('financialDataSaved', handleFinancialDataSaved);
        return () => window.removeEventListener('financialDataSaved', handleFinancialDataSaved);
    }, [procenaId]);

    return {
        selections,
        setSelections,
        prilogMData,
        setPrilogMData,
        initialLoading,
        hasValidFinancialData,
        setHasValidFinancialData,
        currentFinancialData,
        setCurrentFinancialData,
        loadFinancialData
    };
}
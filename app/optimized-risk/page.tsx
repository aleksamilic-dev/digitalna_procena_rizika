'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import LegalEntityForm from '../components/LegalEntityForm';
import { btn, card, pageContainer, PageHeader } from '../components/ui';

interface PravnoLice {
    id: number;
    naziv: string;
    pib: string;
}

export default function OptimizedRiskPage() {
    const router = useRouter();
    const [existingPravnaLica, setExistingPravnaLica] = useState<PravnoLice[]>([]);
    const [loadingEntities, setLoadingEntities] = useState(true);
    const [selectionMode, setSelectionMode] = useState<'select' | 'new'>('select');
    const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
    const [creatingProcena, setCreatingProcena] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const response = await fetch('/api/pravno-lice?limit=1000');
                if (response.ok) {
                    const result = await response.json();
                    setExistingPravnaLica(result.data);
                }
            } catch (error) {
                console.error('Error fetching entities:', error);
            } finally {
                setLoadingEntities(false);
            }
        };
        fetchEntities();
    }, []);

    // Procena dobija svoju adresu, pa osvežavanje stranice ne vraća korisnika na izbor pravnog lica
    const handleSelectExisting = async () => {
        if (!selectedEntityId) return;
        setCreatingProcena(true);
        setError(null);

        try {
            const response = await fetch('/api/procena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pravnoLiceId: selectedEntityId })
            });
            const data = await response.json();

            if (response.ok) {
                router.push(`/optimized-risk/${data.procenaId}`);
            } else if (data.existingProcenaId) {
                // Pravno lice već ima procenu u toku - nastavlja se ta procena
                router.push(`/optimized-risk/${data.existingProcenaId}`);
            } else {
                setError(data.error || 'Грешка при креирању процене');
                setCreatingProcena(false);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            setError('Грешка при комуникацији са сервером');
            setCreatingProcena(false);
        }
    };

    if (selectionMode === 'new') {
        return (
            <div className={pageContainer}>
                <button
                    onClick={() => setSelectionMode('select')}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад на избор
                </button>
                <LegalEntityForm
                    onSuccess={(data) => router.push(`/optimized-risk/${data.procenaId}`)}
                />
            </div>
        );
    }

    return (
        <div className={pageContainer}>
            <PageHeader
                title="Нова процена ризика"
                description="Изаберите правно лице за које радите процену или унесите ново."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className={`${card} p-6`}>
                    <h2 className="text-base font-semibold text-slate-900">Постојеће правно лице</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Ако правно лице већ има процену у току, отвориће се та процена.
                    </p>
                    <select
                        value={selectedEntityId || ''}
                        onChange={(e) => setSelectedEntityId(Number(e.target.value) || null)}
                        className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        disabled={loadingEntities || existingPravnaLica.length === 0}
                    >
                        <option value="">
                            {loadingEntities ? 'Учитавање...' : existingPravnaLica.length === 0 ? 'Нема постојећих правних лица' : 'Изаберите правно лице...'}
                        </option>
                        {existingPravnaLica.map(pl => (
                            <option key={pl.id} value={pl.id}>
                                {pl.naziv} (ПИБ {pl.pib})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleSelectExisting}
                        disabled={!selectedEntityId || creatingProcena}
                        className={`${btn.primary} mt-4 w-full`}
                    >
                        {creatingProcena ? 'Отварам процену...' : 'Настави'}
                        {!creatingProcena && <ArrowRight className="h-4 w-4" />}
                    </button>
                </div>

                <div className={`${card} p-6`}>
                    <h2 className="text-base font-semibold text-slate-900">Ново правно лице</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Унесите податке о правном лицу. Процена за њега се креира аутоматски.
                    </p>
                    <button
                        onClick={() => setSelectionMode('new')}
                        className={`${btn.secondary} mt-4 w-full`}
                    >
                        <Plus className="h-4 w-4" />
                        Унеси ново правно лице
                    </button>
                </div>
            </div>
        </div>
    );
}

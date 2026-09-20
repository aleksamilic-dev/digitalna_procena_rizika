'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OptimizedRiskAssessment, { type ProcenaInfo } from '../../components/OptimizedRiskAssessment';
import { btn, card, pageContainer, Spinner } from '../../components/ui';

export default function OptimizedRiskByIdPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const procenaId = params.id as string;
    const editParam = searchParams.get('edit');
    const [procena, setProcena] = useState<ProcenaInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadProcena() {
            try {
                const response = await fetch(`/api/procena/${procenaId}`);
                if (!response.ok) {
                    throw new Error(response.status === 404 ? 'Процена није пронађена.' : 'Грешка при учитавању процене.');
                }
                const data = await response.json();
                if (!cancelled) {
                    setProcena({
                        pravnoLiceId: data.pravnoLiceId,
                        naziv: data.naziv,
                        pib: data.pib,
                        status: data.status,
                        datum: data.datum
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Грешка при учитавању процене.');
                }
            }
        }

        loadProcena();
        return () => { cancelled = true; };
    }, [procenaId]);

    if (error) {
        return (
            <div className={pageContainer}>
                <div className={`${card} mx-auto max-w-md p-8 text-center`}>
                    <h1 className="text-lg font-semibold text-slate-900">{error}</h1>
                    <Link href="/procena-history" className={`${btn.secondary} mt-6`}>
                        Назад на процене
                    </Link>
                </div>
            </div>
        );
    }

    if (!procena) {
        return <Spinner label="Учитавам процену ризика..." />;
    }

    // Procena u toku se otvara za uređivanje, završena za pregled; ?edit= menja podrazumevani režim
    const isEditMode = editParam === null ? procena.status === 'u_toku' : editParam === 'true';

    return (
        <OptimizedRiskAssessment
            procenaId={procenaId}
            procena={procena}
            readOnly={!isEditMode}
            modeToggleHref={`/optimized-risk/${procenaId}?edit=${!isEditMode}`}
        />
    );
}

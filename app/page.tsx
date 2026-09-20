'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { btn, card, pageContainer, PageHeader, ProgressBar, Spinner } from './components/ui';

interface Procena {
    id: number;
    datum: string;
    status: string;
    naziv: string;
    pib: string;
    ukupnoRizika: number;
    visokoRizicniRizici: number;
    zavrsenoStavki: number;
    ukupnoStavki: number;
}

export default function Home() {
    const [ime, setIme] = useState('');
    const [procene, setProcene] = useState<Procena[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const korisnik = JSON.parse(localStorage.getItem('korisnik') || 'null');
            setIme(korisnik?.ime ?? '');
        } catch {
            // Ime u pozdravu nije obavezno
        }

        fetch('/api/procena')
            .then(response => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(setProcene)
            .catch(() => setError('Greška pri učitavanju procena.'))
            .finally(() => setLoading(false));
    }, []);

    const uToku = procene.filter(p => p.status === 'u_toku');
    const zavrsene = procene.filter(p => p.status === 'zavrsena').slice(0, 5);

    return (
        <div className={pageContainer}>
            <PageHeader
                title={ime ? `Dobrodošli, ${ime}` : 'Dobrodošli'}
                description="Procene u toku i poslednje završene procene."
                actions={
                    <>
                        <Link href="/pravna-lica/novi" className={btn.secondary}>
                            <Plus className="h-4 w-4" />
                            Novo pravno lice
                        </Link>
                        <Link href="/optimized-risk" className={btn.primary}>
                            <Plus className="h-4 w-4" />
                            Nova procena
                        </Link>
                    </>
                }
            />

            {loading ? (
                <Spinner label="Učitavanje..." />
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            U toku ({uToku.length})
                        </h2>
                        {uToku.length === 0 ? (
                            <div className={`${card} p-8 text-center`}>
                                <p className="text-sm text-slate-600">Trenutno nema procena u toku.</p>
                                <Link href="/optimized-risk" className={`${btn.primary} mt-4`}>
                                    <Plus className="h-4 w-4" />
                                    Započni novu procenu
                                </Link>
                            </div>
                        ) : (
                            <ul className={`${card} divide-y divide-slate-100`}>
                                {uToku.map(procena => {
                                    const procenat = procena.ukupnoStavki > 0
                                        ? Math.min(100, Math.round((procena.zavrsenoStavki / procena.ukupnoStavki) * 100))
                                        : 0;
                                    return (
                                        <li key={procena.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/optimized-risk/${procena.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                                    {procena.naziv}
                                                </Link>
                                                <p className="text-xs text-slate-500">
                                                    PIB {procena.pib} · započeta {new Date(procena.datum).toLocaleDateString('sr-Latn-RS')}
                                                    {procena.visokoRizicniRizici > 0 && (
                                                        <span className="text-red-600"> · {procena.visokoRizicniRizici} visokih rizika</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="w-full sm:w-56">
                                                <div className="mb-1 flex justify-between text-xs text-slate-600">
                                                    <span>{procena.zavrsenoStavki} od {procena.ukupnoStavki} stavki</span>
                                                    <span className="font-medium text-slate-900">{procenat}%</span>
                                                </div>
                                                <ProgressBar percent={procenat} />
                                            </div>
                                            <Link href={`/optimized-risk/${procena.id}`} className={btn.primary}>
                                                Nastavi
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {zavrsene.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-baseline justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Nedavno završene
                                </h2>
                                <Link href="/procena-history" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Sve procene →
                                </Link>
                            </div>
                            <ul className={`${card} divide-y divide-slate-100`}>
                                {zavrsene.map(procena => (
                                    <li key={procena.id} className="flex items-center justify-between gap-4 p-4">
                                        <div className="min-w-0">
                                            <Link href={`/optimized-risk/${procena.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                                {procena.naziv}
                                            </Link>
                                            <p className="text-xs text-slate-500">
                                                PIB {procena.pib} · {procena.ukupnoRizika} rizika
                                                {procena.visokoRizicniRizici > 0 && `, ${procena.visokoRizicniRizici} visokih`}
                                            </p>
                                        </div>
                                        <Link href={`/optimized-risk/${procena.id}`} className={btn.secondary}>
                                            Otvori
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { btn, card, input, pageContainer, PageHeader, Spinner, StatusBadge } from '../components/ui';

interface ProcenaRizika {
    id: number;
    datum: string;
    status: string;
    pravnoLiceId: number;
}

interface PravnoLice {
    id: number;
    naziv: string;
    skraceno_poslovno_ime?: string;
    pib: string;
    maticni_broj?: string;
    procene: ProcenaRizika[];
}

export default function PravnaLicaPage() {
    const [pravnaLica, setPravnaLica] = useState<PravnoLice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pretraga, setPretraga] = useState('');
    const [kreiranjeZa, setKreiranjeZa] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchPravnaLica();
    }, []);

    const fetchPravnaLica = async () => {
        try {
            const response = await fetch('/api/pravno-lice?limit=1000');
            if (response.ok) {
                const result = await response.json();
                setPravnaLica(result.data);
            } else {
                setError('Greška pri učitavanju pravnih lica');
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri učitavanju podataka');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRisk = async (pravnoLiceId: number) => {
        setKreiranjeZa(pravnoLiceId);
        try {
            const response = await fetch('/api/procena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pravnoLiceId })
            });
            const data = await response.json();

            if (response.ok) {
                router.push(`/optimized-risk/${data.procenaId}`);
            } else if (data.existingProcenaId) {
                // Pravno lice već ima procenu u toku - nastavlja se ta procena
                router.push(`/optimized-risk/${data.existingProcenaId}`);
            } else {
                setError(data.error || 'Greška pri kreiranju procene rizika');
                setKreiranjeZa(null);
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri kreiranju procene rizika');
            setKreiranjeZa(null);
        }
    };

    const filtrirana = pravnaLica.filter(pl => {
        const pojam = pretraga.trim().toLowerCase();
        if (!pojam) return true;
        return pl.naziv.toLowerCase().includes(pojam)
            || pl.pib?.includes(pojam)
            || (pl.maticni_broj ?? '').includes(pojam);
    });

    return (
        <div className={pageContainer}>
            <PageHeader
                title="Pravna lica"
                description="Pregled pravnih lica i njihovih procena rizika."
                actions={
                    <Link href="/pravna-lica/novi" className={btn.primary}>
                        <Plus className="h-4 w-4" />
                        Novo pravno lice
                    </Link>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <Spinner label="Učitavanje..." />
            ) : pravnaLica.length === 0 ? (
                <div className={`${card} p-10 text-center`}>
                    <h3 className="text-sm font-medium text-slate-900">Nema pravnih lica</h3>
                    <p className="mt-1 text-sm text-slate-600">Dodajte prvo pravno lice da biste započeli procenu.</p>
                    <Link href="/pravna-lica/novi" className={`${btn.primary} mt-4`}>
                        <Plus className="h-4 w-4" />
                        Novo pravno lice
                    </Link>
                </div>
            ) : (
                <div className={card}>
                    <div className="border-b border-slate-200 p-4">
                        <input
                            type="text"
                            placeholder="Pretraži po nazivu, PIB-u ili matičnom broju..."
                            value={pretraga}
                            onChange={(e) => setPretraga(e.target.value)}
                            className={`${input} lg:w-96`}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Pravno lice</th>
                                    <th className="px-4 py-3">PIB</th>
                                    <th className="px-4 py-3">Matični broj</th>
                                    <th className="px-4 py-3">Procene</th>
                                    <th className="px-4 py-3"><span className="sr-only">Akcije</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtrirana.map(pravnoLice => {
                                    const aktivna = pravnoLice.procene.find(p => p.status === 'u_toku');
                                    const poslednja = pravnoLice.procene[0];

                                    return (
                                        <tr key={pravnoLice.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <Link href={`/pravna-lica/${pravnoLice.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                                    {pravnoLice.naziv}
                                                </Link>
                                                {pravnoLice.skraceno_poslovno_ime && (
                                                    <div className="text-xs text-slate-500">{pravnoLice.skraceno_poslovno_ime}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{pravnoLice.pib}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{pravnoLice.maticni_broj || '—'}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {pravnoLice.procene.length === 0 ? (
                                                    <span className="text-slate-400">—</span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-slate-700">
                                                        {pravnoLice.procene.length}
                                                        {poslednja && <StatusBadge status={aktivna ? 'u_toku' : poslednja.status} />}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/pravna-lica/${pravnoLice.id}`} className={btn.secondary}>
                                                        Detalji
                                                    </Link>
                                                    {aktivna ? (
                                                        <Link href={`/optimized-risk/${aktivna.id}`} className={btn.primary}>
                                                            Nastavi procenu
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCreateRisk(pravnoLice.id)}
                                                            disabled={kreiranjeZa === pravnoLice.id}
                                                            className={btn.primary}
                                                        >
                                                            {kreiranjeZa === pravnoLice.id ? 'Kreiram...' : 'Nova procena'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filtrirana.length === 0 && (
                        <p className="py-10 text-center text-sm text-slate-500">
                            Nema pravnih lica koja odgovaraju pretrazi.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

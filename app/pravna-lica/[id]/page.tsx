'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import OrganizacijaProceneForm from '../../components/OrganizacijaProceneForm';
import { btn, card, input, pageContainer, Spinner, StatusBadge } from '../../components/ui';

interface ProcenaRizika {
    id: number;
    datum: string;
    status: string;
}

interface Usluga {
    id: number;
    naziv_usluge: string;
    datum_izrade?: string;
    opis?: string;
}

interface PravnoLice {
    id: number;
    naziv: string;
    skraceno_poslovno_ime?: string;
    pib: string;
    maticni_broj?: string;
    adresa?: string;
    adresa_sediste?: string;
    adresa_ostala?: string;
    sifra_delatnosti?: string;
    lice_zastupanje?: string;
    lice_komunikacija?: string;
    tim_procena_rizika?: string;
    telefon_faks?: string;
    internet_adresa?: string;
    procene: ProcenaRizika[];
    usluge: Usluga[];
}

// Puni nazivi polja iz SRPS A.L2.003:2025 su predugački za tabelu, pa stoje kao opis
const PODACI: { labela: string; opis?: string; vrednost: (pl: PravnoLice) => string | undefined }[] = [
    { labela: 'Skraćeno poslovno ime', vrednost: pl => pl.skraceno_poslovno_ime },
    { labela: 'PIB', vrednost: pl => pl.pib },
    { labela: 'Matični broj', vrednost: pl => pl.maticni_broj },
    { labela: 'Šifra delatnosti', vrednost: pl => pl.sifra_delatnosti },
    { labela: 'Adresa sedišta', vrednost: pl => pl.adresa_sediste || pl.adresa },
    {
        labela: 'Ostale lokacije',
        opis: 'Adrese ogranaka, izdvojenih mesta i ostalih funkcionalnih celina koje nisu na adresi sedišta',
        vrednost: pl => pl.adresa_ostala
    },
    {
        labela: 'Odgovorno lice',
        opis: 'Lice odgovorno za zastupanje i lice ovlašćeno za komunikaciju u vezi sa procenom rizika',
        vrednost: pl => pl.lice_zastupanje || pl.lice_komunikacija
    },
    {
        labela: 'Tim za procenu rizika',
        opis: 'Lica iz posmatrane organizacije koja učestvuju u timu (ime, prezime, stručna sprema)',
        vrednost: pl => pl.tim_procena_rizika
    },
    { labela: 'Telefon / faks', vrednost: pl => pl.telefon_faks },
    { labela: 'Internet adresa', vrednost: pl => pl.internet_adresa },
];

export default function PravnoLiceDetaljiPage() {
    const params = useParams();
    const router = useRouter();
    const pravnoLiceId = params.id as string;

    const [pravnoLice, setPravnoLice] = useState<PravnoLice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [kreiranje, setKreiranje] = useState(false);

    // Forma za uslugu: null = zatvorena, 'nova' = dodavanje, broj = uređivanje te usluge
    const [formaUsluge, setFormaUsluge] = useState<'nova' | number | null>(null);
    const [nazivUsluge, setNazivUsluge] = useState('');
    const [datumIzrade, setDatumIzrade] = useState('');
    const [opisUsluge, setOpisUsluge] = useState('');

    const fetchPravnoLice = useCallback(async () => {
        try {
            const response = await fetch(`/api/pravno-lice?id=${pravnoLiceId}`);
            if (!response.ok) throw new Error();
            const result = await response.json();
            if (!result.data?.length) {
                setError('Pravno lice nije pronađeno.');
                return;
            }
            setPravnoLice(result.data[0]);
        } catch {
            setError('Greška pri učitavanju podataka.');
        } finally {
            setLoading(false);
        }
    }, [pravnoLiceId]);

    useEffect(() => {
        fetchPravnoLice();
    }, [fetchPravnoLice]);

    const handleCreateRisk = async () => {
        setKreiranje(true);
        try {
            const response = await fetch('/api/procena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pravnoLiceId: Number(pravnoLiceId) })
            });
            const data = await response.json();

            if (response.ok) {
                router.push(`/optimized-risk/${data.procenaId}`);
            } else if (data.existingProcenaId) {
                router.push(`/optimized-risk/${data.existingProcenaId}`);
            } else {
                setError(data.error || 'Greška pri kreiranju procene rizika');
                setKreiranje(false);
            }
        } catch {
            setError('Greška pri kreiranju procene rizika');
            setKreiranje(false);
        }
    };

    const handleDeletePravnoLice = async () => {
        if (!pravnoLice) return;
        const potvrda = confirm(
            `Obrisati pravno lice "${pravnoLice.naziv}"?\n\nBrišu se i sve njegove procene rizika. Ova akcija se ne može poništiti.`
        );
        if (!potvrda) return;

        try {
            const response = await fetch(`/api/pravno-lice?id=${pravnoLice.id}`, { method: 'DELETE' });
            if (response.ok) {
                router.push('/pravna-lica');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri brisanju pravnog lica');
            }
        } catch {
            setError('Greška pri brisanju pravnog lica');
        }
    };

    const otvoriFormuUsluge = (usluga?: Usluga) => {
        setFormaUsluge(usluga ? usluga.id : 'nova');
        setNazivUsluge(usluga?.naziv_usluge ?? '');
        setDatumIzrade(usluga?.datum_izrade?.split('T')[0] ?? new Date().toISOString().split('T')[0]);
        setOpisUsluge(usluga?.opis ?? '');
    };

    const zatvoriFormuUsluge = () => {
        setFormaUsluge(null);
        setNazivUsluge('');
        setDatumIzrade('');
        setOpisUsluge('');
    };

    const sacuvajUslugu = async () => {
        if (!nazivUsluge.trim()) {
            setError('Naziv usluge je obavezan');
            return;
        }

        try {
            const response = formaUsluge === 'nova'
                ? await fetch('/api/pravno-lice', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pravnoLiceId: Number(pravnoLiceId),
                        naziv_usluge: nazivUsluge,
                        datum_izrade: datumIzrade || new Date().toISOString().split('T')[0],
                        opis: opisUsluge
                    })
                })
                : await fetch('/api/usluge', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: formaUsluge,
                        naziv_usluge: nazivUsluge,
                        datum_izrade: datumIzrade,
                        opis: opisUsluge
                    })
                });

            if (response.ok) {
                await fetchPravnoLice();
                zatvoriFormuUsluge();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri čuvanju usluge');
            }
        } catch {
            setError('Greška pri čuvanju usluge');
        }
    };

    const obrisiUslugu = async (usluga: Usluga) => {
        if (!confirm(`Obrisati uslugu "${usluga.naziv_usluge}"?`)) return;

        try {
            const response = await fetch(`/api/usluge?id=${usluga.id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchPravnoLice();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri brisanju usluge');
            }
        } catch {
            setError('Greška pri brisanju usluge');
        }
    };

    if (loading) {
        return <Spinner label="Učitavanje..." />;
    }

    if (!pravnoLice) {
        return (
            <div className={pageContainer}>
                <div className={`${card} mx-auto max-w-md p-8 text-center`}>
                    <p className="text-sm font-medium text-slate-900">{error || 'Pravno lice nije pronađeno.'}</p>
                    <Link href="/pravna-lica" className={`${btn.secondary} mt-6`}>Nazad na pravna lica</Link>
                </div>
            </div>
        );
    }

    const aktivnaProcena = pravnoLice.procene.find(p => p.status === 'u_toku');
    const formaUslugeOtvorena = formaUsluge !== null;

    return (
        <div className={pageContainer}>
            <Link href="/pravna-lica" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                <ArrowLeft className="h-4 w-4" />
                Pravna lica
            </Link>

            <div className="mt-2 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold text-slate-900">{pravnoLice.naziv}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        PIB {pravnoLice.pib}
                        {pravnoLice.maticni_broj && ` · matični broj ${pravnoLice.maticni_broj}`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {aktivnaProcena ? (
                        <Link href={`/optimized-risk/${aktivnaProcena.id}`} className={btn.primary}>
                            Nastavi procenu
                        </Link>
                    ) : (
                        <button onClick={handleCreateRisk} disabled={kreiranje} className={btn.primary}>
                            <Plus className="h-4 w-4" />
                            {kreiranje ? 'Kreiram...' : 'Nova procena'}
                        </button>
                    )}
                    <button onClick={handleDeletePravnoLice} className={btn.danger}>
                        <Trash2 className="h-4 w-4" />
                        Obriši
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <section className={`${card} p-6`}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">Podaci o pravnom licu</h2>
                    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        {PODACI.map(polje => (
                            <div key={polje.labela}>
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500" title={polje.opis}>
                                    {polje.labela}
                                </dt>
                                <dd className="mt-0.5 text-sm text-slate-900">{polje.vrednost(pravnoLice) || '—'}</dd>
                                {polje.opis && <p className="mt-0.5 text-xs text-slate-400">{polje.opis}</p>}
                            </div>
                        ))}
                    </dl>
                </section>

                <section className={`${card} p-6`}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">
                            Usluge ({pravnoLice.usluge?.length || 0})
                        </h2>
                        {!formaUslugeOtvorena && (
                            <button onClick={() => otvoriFormuUsluge()} className={btn.secondary}>
                                <Plus className="h-4 w-4" />
                                Dodaj uslugu
                            </button>
                        )}
                    </div>

                    {formaUslugeOtvorena && (
                        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <h3 className="mb-3 text-sm font-medium text-slate-900">
                                {formaUsluge === 'nova' ? 'Nova usluga' : 'Izmena usluge'}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="naziv-usluge" className="mb-1 block text-xs font-medium text-slate-700">
                                        Naziv usluge *
                                    </label>
                                    <input
                                        id="naziv-usluge"
                                        type="text"
                                        value={nazivUsluge}
                                        onChange={(e) => setNazivUsluge(e.target.value)}
                                        placeholder="Unesite naziv usluge..."
                                        className={input}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="datum-izrade" className="mb-1 block text-xs font-medium text-slate-700">
                                            Datum izrade
                                        </label>
                                        <input
                                            id="datum-izrade"
                                            type="date"
                                            value={datumIzrade}
                                            onChange={(e) => setDatumIzrade(e.target.value)}
                                            className={input}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="opis-usluge" className="mb-1 block text-xs font-medium text-slate-700">
                                            Opis (opciono)
                                        </label>
                                        <input
                                            id="opis-usluge"
                                            type="text"
                                            value={opisUsluge}
                                            onChange={(e) => setOpisUsluge(e.target.value)}
                                            placeholder="Kratak opis usluge..."
                                            className={input}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={sacuvajUslugu} className={btn.primary}>Sačuvaj</button>
                                    <button onClick={zatvoriFormuUsluge} className={btn.secondary}>Otkaži</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!pravnoLice.usluge?.length ? (
                        <p className="text-sm text-slate-500">Nema dodatih usluga.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {pravnoLice.usluge.map(usluga => (
                                <li key={usluga.id} className="flex items-center justify-between gap-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900">{usluga.naziv_usluge}</p>
                                        <p className="text-xs text-slate-500">
                                            {usluga.datum_izrade && new Date(usluga.datum_izrade).toLocaleDateString('sr-Latn-RS')}
                                            {usluga.opis && ` · ${usluga.opis}`}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button onClick={() => otvoriFormuUsluge(usluga)} className={btn.icon} title="Izmeni uslugu">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => obrisiUslugu(usluga)} className={btn.iconDanger} title="Obriši uslugu">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className={`${card} p-6`}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                        Procene rizika ({pravnoLice.procene.length})
                    </h2>
                    {pravnoLice.procene.length === 0 ? (
                        <p className="text-sm text-slate-500">Još nema procena za ovo pravno lice.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {pravnoLice.procene.map(procena => (
                                <li key={procena.id} className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Procena #{procena.id}</p>
                                        <p className="text-xs text-slate-500">
                                            Kreirana {new Date(procena.datum).toLocaleDateString('sr-Latn-RS')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={procena.status} />
                                        <Link href={`/optimized-risk/${procena.id}`} className={btn.secondary}>
                                            {procena.status === 'u_toku' ? 'Nastavi' : 'Otvori'}
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className={`${card} p-6`}>
                    <OrganizacijaProceneForm
                        pravnoLiceId={pravnoLice.id}
                        onSave={() => fetchPravnoLice()}
                    />
                </section>
            </div>
        </div>
    );
}

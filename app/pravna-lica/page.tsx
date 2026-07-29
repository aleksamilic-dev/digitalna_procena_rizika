'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OrganizacijaProceneForm from '../components/OrganizacijaProceneForm';

interface ProcenaRizika {
    id: number;
    datum: string;
    status: string;
    pravnoLiceId: number;
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
    adresa?: string; // Zadržavamo za kompatibilnost
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

interface Korisnik {
    id: number;
    email: string;
    ime: string;
    prezime: string;
    je_admin: boolean;
}

export default function PravnaLicaPage() {
    const [pravnaLica, setPravnaLica] = useState<PravnoLice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [korisnik, setKorisnik] = useState<Korisnik | null>(null);
    // const [editingProcena, setEditingProcena] = useState<number | null>(null);
    const [editingPravnoLice, setEditingPravnoLice] = useState<number | null>(null);
    const [editingUsluga, setEditingUsluga] = useState<number | null>(null);
    const [nazivUsluge, setNazivUsluge] = useState('');
    const [datumIzrade, setDatumIzrade] = useState('');
    const [opisUsluge, setOpisUsluge] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const korisnikData = localStorage.getItem('korisnik');

        if (!token || !korisnikData) {
            router.push('/prijava');
            return;
        }

        setKorisnik(JSON.parse(korisnikData));
        fetchPravnaLica();
    }, [router]);

    const fetchPravnaLica = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pravno-lice', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/procena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pravnoLiceId
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Osvezi podatke pre prelaska na novu procenu
                await fetchPravnaLica();
                router.push(`/optimized-risk/${data.procenaId}`);
            } else {
                const errorData = await response.json();
                if (errorData.existingProcenaId) {
                    // Ako već postoji aktivna procena, preusmeri na nju
                    router.push(`/optimized-risk/${errorData.existingProcenaId}`);
                } else {
                    setError(errorData.error || 'Greška pri kreiranju procene rizika');
                }
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri kreiranju procene rizika');
        }
    };

    const handleDeletePravnoLice = async (pravnoLiceId: number, naziv: string) => {
        const potvrda = confirm(`Da li ste sigurni da želite da obrišete pravno lice "${naziv}"?\n\nOvo će obrisati i sve povezane procene rizika. Ova akcija se ne može poništiti.`);

        if (!potvrda) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/pravno-lice?id=${pravnoLiceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Osvezi podatke nakon brisanja
                await fetchPravnaLica();
                setError(null); // Ukloni eventualne greške
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri brisanju pravnog lica');
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri brisanju pravnog lica');
        }
    };

    const handleAddUsluga = async (pravnoLiceId: number) => {
        if (!nazivUsluge.trim()) {
            setError('Naziv usluge je obavezan');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pravno-lice', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pravnoLiceId,
                    naziv_usluge: nazivUsluge,
                    datum_izrade: datumIzrade || new Date().toISOString().split('T')[0],
                    opis: opisUsluge
                })
            });

            if (response.ok) {
                await fetchPravnaLica();
                setEditingPravnoLice(null);
                setNazivUsluge('');
                setDatumIzrade('');
                setOpisUsluge('');
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri dodavanju usluge');
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri dodavanju usluge');
        }
    };

    const handleUpdateUsluga = async (uslugaId: number) => {
        if (!nazivUsluge.trim()) {
            setError('Naziv usluge je obavezan');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/usluge', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: uslugaId,
                    naziv_usluge: nazivUsluge,
                    datum_izrade: datumIzrade,
                    opis: opisUsluge
                })
            });

            if (response.ok) {
                await fetchPravnaLica();
                setEditingUsluga(null);
                setNazivUsluge('');
                setDatumIzrade('');
                setOpisUsluge('');
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri ažuriranju usluge');
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri ažuriranju usluge');
        }
    };

    const handleDeleteUsluga = async (uslugaId: number, nazivUsluge: string) => {
        if (!confirm(`Da li ste sigurni da želite da obrišete uslugu "${nazivUsluge}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/usluge?id=${uslugaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await fetchPravnaLica();
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Greška pri brisanju usluge');
            }
        } catch (error) {
            console.error('Greška:', error);
            setError('Greška pri brisanju usluge');
        }
    };

    const startAddingUsluga = (pravnoLiceId: number) => {
        setEditingPravnoLice(pravnoLiceId);
        setNazivUsluge('');
        setDatumIzrade(new Date().toISOString().split('T')[0]);
        setOpisUsluge('');
    };

    const startEditingUsluga = (usluga: Usluga) => {
        setEditingUsluga(usluga.id);
        setNazivUsluge(usluga.naziv_usluge);
        setDatumIzrade(usluga.datum_izrade || new Date().toISOString().split('T')[0]);
        setOpisUsluge(usluga.opis || '');
    };

    const cancelEditing = () => {
        setEditingPravnoLice(null);
        setEditingUsluga(null);
        setNazivUsluge('');
        setDatumIzrade('');
        setOpisUsluge('');
        setError(null);
    };


    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'u_toku': { label: 'U toku', color: 'bg-yellow-100 text-yellow-800' },
            'zavrsena': { label: 'Završena', color: 'bg-green-100 text-green-800' },
            'na_cekanju': { label: 'Na čekanju', color: 'bg-gray-100 text-gray-800' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['na_cekanju'];

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (!korisnik) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Učitavanje...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pravna lica</h1>
                        <p className="text-gray-600">Pregled svih pravnih lica i njihovih procena rizika</p>
                    </div>
                    <button
                        onClick={() => router.push('/pravna-lica/novi')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Novo pravno lice
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pravnaLica.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Nema pravnih lica</h3>
                                <p className="text-gray-600 mb-6">Trenutno nema registrovanih pravnih lica u sistemu.</p>
                                <button
                                    onClick={() => router.push('/optimized-risk')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Dodaj prvo pravno lice
                                </button>
                            </div>
                        ) : (
                            pravnaLica.map((pravnoLice) => (
                                <div key={pravnoLice.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-1">Poslovno ime (pun naziv): {pravnoLice.naziv}</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                            {pravnoLice.skraceno_poslovno_ime && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Skraceno poslovno ime:</span>
                                                                    <span className="ml-2">{pravnoLice.skraceno_poslovno_ime}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.adresa_sediste && (
                                                                <div className="flex items-center">
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="font-medium">Adresa sediste:</span>
                                                                    <span className="ml-2">{pravnoLice.adresa_sediste}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.adresa_ostala && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Adresa desita i ogranaka, izdvojenih mesta i ostalih funkcionalnih celina posmatrane organizacije koji nisu na istoj adresi kao sediste:</span>
                                                                    <span className="ml-2">{pravnoLice.adresa_ostala}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.sifra_delatnosti && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Sifra delatnosti:</span>
                                                                    <span className="ml-2">{pravnoLice.sifra_delatnosti}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.maticni_broj && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">maticni broj:</span>
                                                                    <span className="ml-2">{pravnoLice.maticni_broj}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <span className="font-medium">PIB klijenta:</span>
                                                                <span className="ml-2 font-semibold text-gray-800">{pravnoLice.pib}</span>
                                                            </div>
                                                            {(pravnoLice.lice_zastupanje || pravnoLice.lice_komunikacija) && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Lice odgovorno za zastupanje i lice ovslasceno za komunikaciju u vezi procenom rizika:</span>
                                                                    <span className="ml-2">{pravnoLice.lice_zastupanje || pravnoLice.lice_komunikacija}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.tim_procena_rizika && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Podaci o licima iz posmatrane organizacije koja ucestvuju u timu za procenu rizika ( ime, prezime, strucna sprema):</span>
                                                                    <span className="ml-2">{pravnoLice.tim_procena_rizika}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.telefon_faks && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">broj telefona / faksa:</span>
                                                                    <span className="ml-2">{pravnoLice.telefon_faks}</span>
                                                                </div>
                                                            )}
                                                            {pravnoLice.internet_adresa && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium">Internet adresa:</span>
                                                                    <span className="ml-2">{pravnoLice.internet_adresa}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Dugme za brisanje */}
                                                    <button
                                                        onClick={() => handleDeletePravnoLice(pravnoLice.id, pravnoLice.naziv)}
                                                        className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                        title="Obriši pravno lice"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sekcija 1.3 - Organizacija koja vrsi procenu rizika */}
                                        <div className="mb-4 mt-6 border-t border-gray-200 pt-4">
                                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">1.3 — Organizacija koja vrši procenu (ovlašćena kuća)</p>
                                            <OrganizacijaProceneForm
                                                pravnoLiceId={pravnoLice.id}
                                                onSave={() => fetchPravnaLica()}
                                            />
                                        </div>

                                        {/* Sekcija za naziv usluge i datum izrade */}
                                        {/* Sekcija za usluge */}
                                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-lg font-semibold text-blue-900">📋 Usluge ({pravnoLice.usluge?.length || 0})</h4>
                                                <button
                                                    onClick={() => startAddingUsluga(pravnoLice.id)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                                                >
                                                    + Dodaj uslugu
                                                </button>
                                            </div>

                                            {/* Forma za dodavanje/editovanje usluge */}
                                            {(editingPravnoLice === pravnoLice.id || editingUsluga) && (
                                                <div className="mb-4 p-3 bg-white rounded-lg border border-blue-300">
                                                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                                                        {editingUsluga ? 'Uredi uslugu' : 'Dodaj novu uslugu'}
                                                    </h5>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Naziv usluge *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={nazivUsluge}
                                                                onChange={(e) => setNazivUsluge(e.target.value)}
                                                                placeholder="Unesite naziv usluge..."
                                                                className="w-full px-3 py-2 text-sm text-black placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Datum izrade
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={datumIzrade}
                                                                    onChange={(e) => setDatumIzrade(e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Opis (opciono)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={opisUsluge}
                                                                    onChange={(e) => setOpisUsluge(e.target.value)}
                                                                    placeholder="Kratak opis usluge..."
                                                                    className="w-full px-3 py-2 text-sm text-black placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => editingUsluga ? handleUpdateUsluga(editingUsluga) : handleAddUsluga(pravnoLice.id)}
                                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                                                            >
                                                                {editingUsluga ? 'Ažuriraj' : 'Dodaj'}
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                                                            >
                                                                Otkaži
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lista usluga */}
                                            <div className="space-y-2">
                                                {!pravnoLice.usluge || pravnoLice.usluge.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-500 text-sm">
                                                        Nema dodanih usluga
                                                    </div>
                                                ) : (
                                                    pravnoLice.usluge.map((usluga) => (
                                                        <div key={usluga.id} className="p-3 bg-white rounded-lg border border-blue-200">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="text-base font-medium text-gray-900 mb-1">
                                                                        {usluga.naziv_usluge}
                                                                    </div>
                                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                        {usluga.datum_izrade && (
                                                                            <span>
                                                                                📅 {new Date(usluga.datum_izrade).toLocaleDateString('sr-RS')}
                                                                            </span>
                                                                        )}
                                                                        {usluga.opis && (
                                                                            <span className="text-gray-500">
                                                                                {usluga.opis}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <button
                                                                        onClick={() => startEditingUsluga(usluga)}
                                                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                                                        title="Uredi uslugu"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUsluga(usluga.id, usluga.naziv_usluge)}
                                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                                        title="Obriši uslugu"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end space-x-2 mb-4">
                                            {(() => {
                                                const aktivnaProcena = pravnoLice.procene.find(p => p.status === 'u_toku');

                                                if (aktivnaProcena) {
                                                    return (
                                                        <div className="flex flex-col items-end space-y-2">
                                                            <button
                                                                onClick={() => router.push(`/optimized-risk/${aktivnaProcena.id}`)}
                                                                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Nastavi procenu
                                                            </button>
                                                            <p className="text-xs text-orange-600 text-right max-w-48">
                                                                Završite aktivnu procenu pre kreiranja nove
                                                            </p>
                                                        </div>
                                                    );
                                                } else if (pravnoLice.procene.length === 0) {
                                                    return (
                                                        <button
                                                            onClick={() => handleCreateRisk(pravnoLice.id)}
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            Kreiraj procenu rizika
                                                        </button>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="flex flex-col items-end space-y-2">
                                                            <button
                                                                onClick={() => handleCreateRisk(pravnoLice.id)}
                                                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                Nova procena
                                                            </button>
                                                            <p className="text-xs text-gray-500 text-right max-w-48">
                                                                Sve prethodne procene su završene
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {/* Procene rizika */}
                                        {pravnoLice.procene.length > 0 && (
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-900">Procene rizika ({pravnoLice.procene.length})</h4>
                                                    {pravnoLice.procene.some(p => p.status === 'u_toku') && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Aktivna procena
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {pravnoLice.procene.map((procena) => (
                                                        <div key={procena.id} className={`p-3 rounded-lg ${procena.status === 'u_toku' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                                            }`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${procena.status === 'u_toku' ? 'bg-orange-100' : 'bg-blue-100'
                                                                        }`}>
                                                                        <svg className={`w-4 h-4 ${procena.status === 'u_toku' ? 'text-orange-600' : 'text-blue-600'
                                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Procena #{procena.id}
                                                                            {procena.status === 'u_toku' && (
                                                                                <span className="ml-2 text-orange-600 text-xs">(u toku)</span>
                                                                            )}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600">
                                                                            Kreirana: {new Date(procena.datum).toLocaleDateString('sr-RS', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    {getStatusBadge(procena.status)}
                                                                    <button
                                                                        onClick={() => router.push(`/optimized-risk/${procena.id}`)}
                                                                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${procena.status === 'u_toku'
                                                                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                                                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                                                                            }`}
                                                                    >
                                                                        {procena.status === 'u_toku' ? 'Nastavi' : 'Otvori'}
                                                                    </button>
                                                                </div>
                                                            </div>


                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
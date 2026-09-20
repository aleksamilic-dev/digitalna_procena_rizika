'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { btn, card, input, pageContainer, Spinner } from '../components/ui';

interface Korisnik {
    id: number;
    email: string;
    ime: string;
    prezime: string;
    je_admin: boolean;
}

export default function Profil() {
    const [korisnik, setKorisnik] = useState<Korisnik | null>(null);
    const [formData, setFormData] = useState({
        ime: '',
        prezime: '',
        email: '',
        trenutnaLozinka: '',
        novaLozinka: '',
        potvrdaLozinke: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('osnovni');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const korisnikData = localStorage.getItem('korisnik');

        if (!token || !korisnikData) {
            router.push('/prijava');
            return;
        }

        const korisnikObj = JSON.parse(korisnikData);
        setKorisnik(korisnikObj);
        setFormData({
            ime: korisnikObj.ime,
            prezime: korisnikObj.prezime,
            email: korisnikObj.email,
            trenutnaLozinka: '',
            novaLozinka: '',
            potvrdaLozinke: ''
        });
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ime: formData.ime,
                    prezime: formData.prezime,
                    email: formData.email
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Ažuriraj localStorage
                const updatedKorisnik = { ...korisnik, ...data.korisnik };
                localStorage.setItem('korisnik', JSON.stringify(updatedKorisnik));
                setKorisnik(updatedKorisnik);
                setSuccess('Profil je uspešno ažuriran!');
            } else {
                setError(data.greška || 'Došlo je do greške');
            }
        } catch {
            setError('Došlo je do greške pri slanju zahteva');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.novaLozinka !== formData.potvrdaLozinke) {
            setError('Nova lozinka i potvrda se ne poklapaju');
            return;
        }

        if (formData.novaLozinka.length < 6) {
            setError('Nova lozinka mora imati najmanje 6 karaktera');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profil/lozinka', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    trenutnaLozinka: formData.trenutnaLozinka,
                    novaLozinka: formData.novaLozinka
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Lozinka je uspešno promenjena!');
                setFormData({
                    ...formData,
                    trenutnaLozinka: '',
                    novaLozinka: '',
                    potvrdaLozinke: ''
                });
            } else {
                setError(data.greška || 'Došlo je do greške');
            }
        } catch {
            setError('Došlo je do greške pri slanju zahteva');
        } finally {
            setLoading(false);
        }
    };

    if (!korisnik) {
        return (
            <Spinner label="Učitavanje..." />
        );
    }

    return (
        <div className={pageContainer}>
            <main className="mx-auto max-w-3xl">
                <div className={`${card} overflow-hidden`}>
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                            {korisnik.ime.charAt(0)}{korisnik.prezime.charAt(0)}
                        </span>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">{korisnik.ime} {korisnik.prezime}</h1>
                            <p className="text-sm text-slate-600">
                                {korisnik.email}
                                {korisnik.je_admin && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Administrator</span>}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200">
                        <nav className="flex gap-6 px-6">
                            <button
                                onClick={() => setActiveTab('osnovni')}
                                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'osnovni'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                Osnovni podaci
                            </button>
                            <button
                                onClick={() => setActiveTab('lozinka')}
                                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'lozinka'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                Promena lozinke
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Messages */}
                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-green-700">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Osnovni podaci tab */}
                        {activeTab === 'osnovni' && (
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="ime" className="block text-sm font-medium text-slate-700">
                                            Ime
                                        </label>
                                        <input
                                            id="ime"
                                            type="text"
                                            required
                                            className={input}
                                            value={formData.ime}
                                            onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="prezime" className="block text-sm font-medium text-slate-700">
                                            Prezime
                                        </label>
                                        <input
                                            id="prezime"
                                            type="text"
                                            required
                                            className={input}
                                            value={formData.prezime}
                                            onChange={(e) => setFormData({ ...formData, prezime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                        Email adresa
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className={input}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={btn.primary}
                                    >
                                        {loading ? 'Čuvanje...' : 'Sačuvaj izmene'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Promena lozinke tab */}
                        {activeTab === 'lozinka' && (
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="trenutnaLozinka" className="block text-sm font-medium text-slate-700">
                                        Trenutna lozinka
                                    </label>
                                    <input
                                        id="trenutnaLozinka"
                                        type="password"
                                        required
                                        className={input}
                                        value={formData.trenutnaLozinka}
                                        onChange={(e) => setFormData({ ...formData, trenutnaLozinka: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="novaLozinka" className="block text-sm font-medium text-slate-700">
                                        Nova lozinka
                                    </label>
                                    <input
                                        id="novaLozinka"
                                        type="password"
                                        required
                                        className={input}
                                        value={formData.novaLozinka}
                                        onChange={(e) => setFormData({ ...formData, novaLozinka: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500">Minimalno 6 karaktera</p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="potvrdaLozinke" className="block text-sm font-medium text-slate-700">
                                        Potvrda nove lozinke
                                    </label>
                                    <input
                                        id="potvrdaLozinke"
                                        type="password"
                                        required
                                        className={input}
                                        value={formData.potvrdaLozinke}
                                        onChange={(e) => setFormData({ ...formData, potvrdaLozinke: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={btn.primary}
                                    >
                                        {loading ? 'Menjanje...' : 'Promeni lozinku'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
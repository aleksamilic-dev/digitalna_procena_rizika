'use client';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {btn, card, pageContainer, PageHeader, Spinner} from '../components/ui';

interface Korisnik {
    id: number;
    email: string;
    ime: string;
    prezime: string;
    status: string;
    datum_kreiranja: string;
}

export default function AdminPage() {
    const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const korisnikData = localStorage.getItem('korisnik');

        if (!token || !korisnikData) {
            router.push('/prijava');
            return;
        }

        const korisnik = JSON.parse(korisnikData);
        if (!korisnik.je_admin) {
            router.push('/');
            return;
        }

        fetchKorisnici();
    }, [router]);

    const fetchKorisnici = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/korisnici', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setKorisnici(data);
            }
        } catch (error) {
            console.error('Greška pri učitavanju korisnika:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (korisnikId: number, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/korisnici', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({korisnikId, status}),
            });
            if (response.ok) {
                fetchKorisnici(); // Osvežava listu
            }
        } catch (error) {
            console.error('Greška pri ažuriranju statusa:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'na_cekanju':
                return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
            case 'odobren':
                return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
            case 'odbačen':
                return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
            default:
                return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'na_cekanju':
                return 'На чекању';
            case 'odobren':
                return 'Одобрен';
            case 'odbačen':
                return 'Одбачен';
            default:
                return status;
        }
    };

    if (loading) {
        return <Spinner label="Учитавање..." />;
    }

    const naCekanju = korisnici.filter(k => k.status === 'na_cekanju').length;

    return (
        <div className={pageContainer}>
            <PageHeader
                title="Корисници"
                description="Одобравање налога и преглед свих регистрованих корисника."
            />

            <div className="mb-4 flex flex-wrap gap-6 text-sm text-slate-600">
                <span><span className="font-semibold text-slate-900">{korisnici.length}</span> укупно</span>
                <span><span className="font-semibold text-amber-600">{naCekanju}</span> на чекању</span>
                <span><span className="font-semibold text-green-600">{korisnici.filter(k => k.status === 'odobren').length}</span> одобрених</span>
            </div>

            <div className={card}>
                {korisnici.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-500">Тренутно нема регистрованих корисника.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {korisnici.map((korisnik) => (
                            <li key={korisnik.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                        {korisnik.ime.charAt(0)}{korisnik.prezime.charAt(0)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            {korisnik.ime} {korisnik.prezime}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {korisnik.email} · регистрован {new Date(korisnik.datum_kreiranja).toLocaleDateString('sr-RS')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(korisnik.status)}`}>
                                        {getStatusText(korisnik.status)}
                                    </span>
                                    {korisnik.status === 'na_cekanju' && (
                                        <>
                                            <button onClick={() => handleStatusChange(korisnik.id, 'odobren')} className={btn.primary}>
                                                Одобри
                                            </button>
                                            <button onClick={() => handleStatusChange(korisnik.id, 'odbačen')} className={btn.danger}>
                                                Одбаци
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

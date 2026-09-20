'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';

interface Korisnik {
    id: number;
    email: string;
    ime: string;
    prezime: string;
    je_admin: boolean;
}

const NAV_LINKOVI = [
    { href: '/', label: 'Početna', aktivan: (p: string) => p === '/' },
    { href: '/pravna-lica', label: 'Pravna lica', aktivan: (p: string) => p.startsWith('/pravna-lica') },
    { href: '/procena-history', label: 'Procene', aktivan: (p: string) => p.startsWith('/procena-history') || p.startsWith('/optimized-risk') },
];

// Stranice za prijavu i registraciju nemaju header
const BEZ_HEADERA = ['/prijava', '/registracija'];

export default function Header() {
    const [korisnik, setKorisnik] = useState<Korisnik | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const ucitajKorisnika = () => {
            const korisnikData = localStorage.getItem('korisnik');
            setKorisnik(korisnikData ? JSON.parse(korisnikData) : null);
        };
        ucitajKorisnika();

        window.addEventListener('storage', ucitajKorisnika);
        window.addEventListener('focus', ucitajKorisnika);
        return () => {
            window.removeEventListener('storage', ucitajKorisnika);
            window.removeEventListener('focus', ucitajKorisnika);
        };
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('korisnik');
        setKorisnik(null);
        router.push('/prijava');
    };

    if (!korisnik || BEZ_HEADERA.includes(pathname)) {
        return null;
    }

    const navLink = (link: typeof NAV_LINKOVI[number]) => (
        <Link
            key={link.href}
            href={link.href}
            aria-current={link.aktivan(pathname) ? 'page' : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${link.aktivan(pathname)
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {link.label}
        </Link>
    );

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <span className="hidden text-sm font-semibold leading-tight text-slate-900 sm:block">
                                Digitalni registar
                                <span className="block text-xs font-normal text-slate-500">Procena rizika</span>
                            </span>
                        </Link>
                        <nav className="hidden items-center gap-1 md:flex" aria-label="Glavna navigacija">
                            {NAV_LINKOVI.map(navLink)}
                        </nav>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            href="/profil"
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                            title="Profil"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                {korisnik.ime.charAt(0)}{korisnik.prezime.charAt(0)}
                            </span>
                            <span className="hidden text-sm font-medium text-slate-700 lg:block">
                                {korisnik.ime} {korisnik.prezime}
                            </span>
                        </Link>
                        {korisnik.je_admin && (
                            <Link href="/admin" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900" title="Admin panel">
                                <Settings className="h-5 w-5" />
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600"
                            title="Odjava"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Glavna navigacija">
                    {NAV_LINKOVI.map(navLink)}
                </nav>
            </div>
        </header>
    );
}

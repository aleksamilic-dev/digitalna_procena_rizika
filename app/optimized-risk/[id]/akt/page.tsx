'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { normalizePrilogMRow, type PrilogMData } from '../../../data/riskDataLoader';
import { RISK_GROUPS } from '../../../data/riskGroups';
import { btn, card, Spinner } from '../../../components/ui';

interface ProcenaInfo {
    naziv: string;
    pib: string;
    datum: string;
    status: string;
}

interface FData {
    f1_podaci_o_organizaciji?: string;
    f1_menadzer_rizika?: string;
    f2_podaci_o_posmatranoj_org?: string;
    f2_sifra_delatnosti?: string;
    f2_odgovorno_lice?: string;
    f2_podaci_o_licima?: string;
    f3_eksterni_kontekst?: Record<string, string>;
    f3_interni_kontekst?: Record<string, string>;
    f4_identifikacija?: string;
    f4_analiza?: string;
    f4_vrednovanje?: string;
    f6_zakljucak?: Record<string, string>;
}

interface Mera {
    id: number;
    group_id: number | string;
    mera?: string;
    opis_i_obrazlozenje?: string;
}

const EKSTERNI_KONTEKST = [
    { k: 'makrolokacija', l: 'а) макролокација' },
    { k: 'mikrolokacija', l: 'б) микролокација' },
    { k: 'konkurencija', l: 'в) конкуренција' },
    { k: 'istorija_stetnih_dogadjaja', l: 'г) историја штетних догађаја' },
];

const INTERNI_KONTEKST = [
    { k: 'istorija_stetnih_dogadjaja', l: 'а) историја штетних догађаја' },
    { k: 'velicina_org_uticaj', l: 'б) величина организације и утицај природе делатности' },
    { k: 'nacin_organizovanja', l: 'в) начин организовања пословних процеса' },
    { k: 'nacin_stepen_zastite', l: 'г) начин и степен заштите лица, имовине и пословања' },
    { k: 'delovanje_zainteresovanih', l: 'д) деловање интерних заинтересованих страна' },
];

const ZAKLJUCAK = [
    { k: 'tacka_1', l: '1. Оцена и приказ нивоа и категорије агрегатног ризика посматране организације' },
    { k: 'tacka_2', l: '2. Закључни приказ нивоа и категорије ризика по огранцима/издвојеним местима' },
    { k: 'tacka_3', l: '3. Закључни приказ стања заштите' },
    { k: 'tacka_4', l: '4. Преглед нових мера заштите' },
    { k: 'tacka_5', l: '5. Активности које треба да предузима и одржава менаџмент у функцији квалитета обезбеђења' },
];

const KATEGORIJE = [
    { id: 1, naziv: 'ПРВА — изразито велики' },
    { id: 2, naziv: 'ДРУГА — велики' },
    { id: 3, naziv: 'ТРЕЋА — умерено велики' },
    { id: 4, naziv: 'ЧЕТВРТА — мали' },
    { id: 5, naziv: 'ПЕТА — врло мали' },
];

// Prazna polja se u aktu prikazuju kao crta, da se vidi da podatak nije unet
function vrednost(tekst?: string | null) {
    const ocisceno = (tekst ?? '').trim();
    return ocisceno === '' ? <span className="text-slate-400">—</span> : <span className="whitespace-pre-wrap">{ocisceno}</span>;
}

function Red({ labela, tekst }: { labela: string; tekst?: string | null }) {
    return (
        <tr>
            <th scope="row" className="w-1/3 border border-slate-800 p-2 text-left align-top font-semibold">{labela}</th>
            <td className="border border-slate-800 p-2 align-top">{vrednost(tekst)}</td>
        </tr>
    );
}

function Sekcija({ naslov, children }: { naslov: string; children: React.ReactNode }) {
    return (
        <section className="print-section mb-6">
            <h2 className="mb-2 text-center text-base font-bold">{naslov}</h2>
            {children}
        </section>
    );
}

export default function AktProcenePage() {
    const params = useParams();
    const procenaId = params.id as string;

    const [procena, setProcena] = useState<ProcenaInfo | null>(null);
    const [fData, setFData] = useState<FData>({});
    const [mere, setMere] = useState<Mera[]>([]);
    const [stavke, setStavke] = useState<PrilogMData[]>([]);
    const [loading, setLoading] = useState(true);
    const [greska, setGreska] = useState<string | null>(null);

    const ucitaj = useCallback(async () => {
        setLoading(true);
        setGreska(null);
        try {
            const [procenaRes, fRes, f5Res, mRes] = await Promise.all([
                fetch(`/api/procena/${procenaId}`),
                fetch(`/api/procena/${procenaId}/prilog-f-general`),
                fetch(`/api/procena/${procenaId}/prilog-f5`),
                fetch(`/api/procena/${procenaId}/prilog-m`),
            ]);

            if (!procenaRes.ok) {
                throw new Error('Процена није пронађена.');
            }
            const procenaData = await procenaRes.json();
            setProcena({
                naziv: procenaData.naziv,
                pib: procenaData.pib,
                datum: procenaData.datum,
                status: procenaData.status,
            });

            if (fRes.ok) {
                const rezultat = await fRes.json();
                setFData(rezultat.fData || {});
            }
            if (f5Res.ok) {
                setMere(await f5Res.json());
            }
            if (mRes.ok) {
                const redovi = await mRes.json();
                setStavke(redovi.map((red: Record<string, unknown>) => normalizePrilogMRow(red)));
            }
        } catch (err) {
            setGreska(err instanceof Error ? err.message : 'Грешка при учитавању акта.');
        } finally {
            setLoading(false);
        }
    }, [procenaId]);

    useEffect(() => {
        ucitaj();
    }, [ucitaj]);

    if (loading) {
        return <Spinner label="Припремам акт о процени..." />;
    }

    if (greska || !procena) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className={`${card} p-8 text-center`}>
                    <p className="text-sm font-medium text-slate-900">{greska || 'Процена није пронађена.'}</p>
                    <div className="mt-6 flex justify-center gap-2">
                        <button onClick={ucitaj} className={btn.secondary}>Покушај поново</button>
                        <Link href={`/optimized-risk/${procenaId}`} className={btn.secondary}>Назад на процену</Link>
                    </div>
                </div>
            </div>
        );
    }

    const neprihvatljivi = stavke.filter(stavka => stavka.prihvatljivost === 'NEPRIHVATLJIV');
    const merePoGrupama = RISK_GROUPS.map((grupa, index) => ({
        grupa,
        redovi: mere.filter(mera => Number(mera.group_id) === index + 1 && ((mera.mera ?? '').trim() !== '' || (mera.opis_i_obrazlozenje ?? '').trim() !== '')),
    })).filter(unos => unos.redovi.length > 0);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
            <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link href={`/optimized-risk/${procenaId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                    <ArrowLeft className="h-4 w-4" />
                    Назад на процену
                </Link>
                <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-500">У прозору за штампу изаберите „Сачувај као PDF“.</p>
                    <button onClick={() => window.print()} className={btn.primary}>
                        <Printer className="h-4 w-4" />
                        Штампа / PDF
                    </button>
                </div>
            </div>

            <article className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
                <header className="print-section mb-8 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Прилог Ф (нормативан) · SRPS A.L2.003:2025</p>
                    <h1 className="mt-2 text-xl font-bold">Акт о процени ризика у заштити лица, имовине и пословања</h1>
                    <p className="mt-3 font-semibold">{procena.naziv}</p>
                    <p className="text-slate-600">
                        ПИБ {procena.pib} · процена #{procenaId} · {new Date(procena.datum).toLocaleDateString('sr-RS')}
                    </p>
                </header>

                <Sekcija naslov="Збирни подаци процене">
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            <tr>
                                <th scope="row" className="w-1/3 border border-slate-800 p-2 text-left font-semibold">Процењено ставки</th>
                                <td className="border border-slate-800 p-2">{stavke.length}</td>
                            </tr>
                            {KATEGORIJE.map(kategorija => (
                                <tr key={kategorija.id}>
                                    <th scope="row" className="border border-slate-800 p-2 text-left font-semibold">{kategorija.naziv}</th>
                                    <td className="border border-slate-800 p-2">
                                        {stavke.filter(stavka => stavka.kategorijaRizika === kategorija.id).length}
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <th scope="row" className="border border-slate-800 p-2 text-left font-semibold">Неприхватљиви ризици</th>
                                <td className="border border-slate-800 p-2">{neprihvatljivi.length}</td>
                            </tr>
                        </tbody>
                    </table>

                    {neprihvatljivi.length > 0 && (
                        <table className="mt-4 w-full border-collapse text-sm">
                            <caption className="mb-1 text-left font-semibold">Ставке оцењене као неприхватљиве</caption>
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-800 p-2 text-left">Р. бр.</th>
                                    <th className="border border-slate-800 p-2 text-left">Захтев</th>
                                    <th className="border border-slate-800 p-2 text-left">Ниво</th>
                                    <th className="border border-slate-800 p-2 text-left">Категорија</th>
                                </tr>
                            </thead>
                            <tbody>
                                {neprihvatljivi.map(stavka => (
                                    <tr key={stavka.id}>
                                        <td className="border border-slate-800 p-2 align-top">{stavka.id}</td>
                                        <td className="border border-slate-800 p-2 align-top">{stavka.requirement || '—'}</td>
                                        <td className="border border-slate-800 p-2 align-top">{stavka.nivoRizika ?? '—'}</td>
                                        <td className="border border-slate-800 p-2 align-top">{stavka.kategorijaRizika ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Sekcija>

                <Sekcija naslov="Табела Ф.1 – Подаци о организацији која врши процену ризика">
                    <table className="w-full border-collapse">
                        <tbody>
                            <Red labela="1. Пословно име (назив), адреса седишта, матични број (МБ), порески идентификациони број (ПИБ)" tekst={fData.f1_podaci_o_organizaciji} />
                            <Red labela="2. Име и презиме менаџера ризика, број лиценце" tekst={fData.f1_menadzer_rizika} />
                        </tbody>
                    </table>
                </Sekcija>

                <Sekcija naslov="Табела Ф.2 – Подаци о посматраној организацији">
                    <table className="w-full border-collapse">
                        <tbody>
                            <Red labela="1. Пословно име (назив), МБ, ПИБ, адреса седишта и огранака" tekst={fData.f2_podaci_o_posmatranoj_org} />
                            <Red labela="2. Шифра делатности" tekst={fData.f2_sifra_delatnosti} />
                            <Red labela="3. Лице одговорно за заступање и лице(а) овлашћена за комуникацију" tekst={fData.f2_odgovorno_lice} />
                            <Red labela="4. Подаци о лицима из посматране организације која учествују у тиму" tekst={fData.f2_podaci_o_licima} />
                        </tbody>
                    </table>
                </Sekcija>

                <Sekcija naslov="Табела Ф.3 – Контекст процене ризика">
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr className="bg-slate-100">
                                <td colSpan={2} className="border border-slate-800 p-2 font-bold">1. Екстерни контекст</td>
                            </tr>
                            {EKSTERNI_KONTEKST.map(polje => (
                                <Red key={polje.k} labela={polje.l} tekst={fData.f3_eksterni_kontekst?.[polje.k]} />
                            ))}
                            <tr className="bg-slate-100">
                                <td colSpan={2} className="border border-slate-800 p-2 font-bold">2. Интерни контекст</td>
                            </tr>
                            {INTERNI_KONTEKST.map(polje => (
                                <Red key={polje.k} labela={polje.l} tekst={fData.f3_interni_kontekst?.[polje.k]} />
                            ))}
                        </tbody>
                    </table>
                </Sekcija>

                <Sekcija naslov="Табела Ф.4 – Процена ризика">
                    <table className="w-full border-collapse">
                        <tbody>
                            <Red labela="1. Идентификација ризика" tekst={fData.f4_identifikacija} />
                            <Red labela="2. Анализа ризика" tekst={fData.f4_analiza} />
                            <Red labela="3. Вредновање ризика" tekst={fData.f4_vrednovanje} />
                        </tbody>
                    </table>
                </Sekcija>

                <Sekcija naslov="Табела Ф.5 – Мере за поступање са ризицима">
                    {merePoGrupama.length === 0 ? (
                        <p className="text-slate-500">Мере још нису унете.</p>
                    ) : (
                        merePoGrupama.map(({ grupa, redovi }) => (
                            <table key={grupa.id} className="mb-4 w-full border-collapse">
                                <caption className="mb-1 text-left font-semibold">
                                    {grupa.name.replace(' (нормативан)', '')} — {grupa.kratkiNaziv}
                                </caption>
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="w-1/3 border border-slate-800 p-2 text-left">Мера</th>
                                        <th className="border border-slate-800 p-2 text-left">Опис и образложење</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {redovi.map(red => (
                                        <tr key={red.id}>
                                            <td className="border border-slate-800 p-2 align-top">{vrednost(red.mera)}</td>
                                            <td className="border border-slate-800 p-2 align-top">{vrednost(red.opis_i_obrazlozenje)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ))
                    )}
                </Sekcija>

                <Sekcija naslov="Табела Ф.6 – Закључак процене ризика">
                    <table className="w-full border-collapse">
                        <tbody>
                            {ZAKLJUCAK.map(tacka => (
                                <Red key={tacka.k} labela={tacka.l} tekst={fData.f6_zakljucak?.[tacka.k]} />
                            ))}
                        </tbody>
                    </table>
                </Sekcija>

                <footer className="print-section mt-10 flex justify-between gap-8 text-sm">
                    <div className="w-1/2">
                        <p>Датум: ____________________</p>
                    </div>
                    <div className="w-1/2 text-right">
                        <p>Менаџер ризика</p>
                        <p className="mt-8">____________________</p>
                    </div>
                </footer>
            </article>
        </div>
    );
}

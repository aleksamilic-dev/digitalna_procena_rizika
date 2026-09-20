'use client';

import { useState } from 'react';

interface LegalEntityFormProps {
    onSuccess: (data: {
        success: boolean;
        pravnoLiceId: number;
        procenaId: number;
        pravnoLice: {
            id: number;
            naziv: string;
            pib: string;
            adresa: string;
        }
    }) => void;
    submitLabel?: string;
    loadingLabel?: string;
}

export default function LegalEntityForm({ onSuccess, submitLabel = "Сачувај и започни процену", loadingLabel = "Чувам..." }: LegalEntityFormProps) {
    // Stilovi za input polja
    const inputStyle = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
    const textareaStyle = "w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

    // Form state za pravno lice
    const [naziv, setNaziv] = useState('');
    const [skraceno_poslovno_ime, setSkracenoPoslovnoIme] = useState('');
    const [pib, setPib] = useState('');
    const [maticni_broj, setMaticniBroj] = useState('');
    const [adresa_sediste, setAdresaSediste] = useState('');
    const [adresa_ostala, setAdresaOstala] = useState('');
    const [sifra_delatnosti, setSifraDelatnosti] = useState('');
    const [lice_zastupanje, setLiceZastupanje] = useState('');
    const [lice_komunikacija, setLiceKomunikacija] = useState('');
    const [tim_procena_rizika, setTimProcenaRizika] = useState('');
    const [telefon_faks, setTelefonFaks] = useState('');
    const [internet_adresa, setInternetAdresa] = useState('');
    const [loading, setLoading] = useState(false);

    // Funkcija za čuvanje pravnog lica i kreiranje procene
    const handleSubmitPravnoLice = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/pravno-lice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    naziv,
                    skraceno_poslovno_ime,
                    pib,
                    maticni_broj,
                    adresa_sediste,
                    adresa_ostala,
                    sifra_delatnosti,
                    lice_zastupanje,
                    lice_komunikacija,
                    tim_procena_rizika,
                    telefon_faks,
                    internet_adresa,
                    adresa: adresa_sediste // Za kompatibilnost
                })
            });

            const data = await response.json();

            if (data.success) {
                // Pozovi onSuccess callback sa podacima
                onSuccess({
                    ...data,
                    pravnoLice: {
                        id: data.pravnoLiceId,
                        naziv,
                        pib,
                        adresa: adresa_sediste
                    }
                });
            } else {
                alert(data.error || 'Greška pri čuvanju podataka');
            }
        } catch (error) {
            console.error('Greška:', error);
            alert('Greška pri komunikaciji sa serverom');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmitPravnoLice}
            className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">Подаци о правном лицу</h2>
                <p className="mt-1 text-sm text-slate-600">Поља означена звездицом су обавезна.</p>
            </div>

            <div className="flex flex-col gap-8 w-full">
                {/* Основни подаци */}
                <div className="space-y-6">
                    <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                        Основни подаци
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="naziv" className="text-sm font-medium text-slate-700">
                                Пословно име (пун назив) *
                            </label>
                            <input
                                id="naziv"
                                type="text"
                                placeholder="Унесите пун назив правног лица..."
                                value={naziv}
                                onChange={e => setNaziv(e.target.value)}
                                className={inputStyle}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="skraceno_poslovno_ime" className="text-sm font-medium text-slate-700">
                                Скраћено пословно име
                            </label>
                            <input
                                id="skraceno_poslovno_ime"
                                type="text"
                                placeholder="Скраћени назив..."
                                value={skraceno_poslovno_ime}
                                onChange={e => setSkracenoPoslovnoIme(e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="pib" className="text-sm font-medium text-slate-700">
                                ПИБ *
                            </label>
                            <input
                                id="pib"
                                type="text"
                                placeholder="Унесите ПИБ..."
                                value={pib}
                                onChange={e => setPib(e.target.value)}
                                className={inputStyle}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="maticni_broj" className="text-sm font-medium text-slate-700">
                                Матични број
                            </label>
                            <input
                                id="maticni_broj"
                                type="text"
                                placeholder="Унесите матични број..."
                                value={maticni_broj}
                                onChange={e => setMaticniBroj(e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="sifra_delatnosti" className="text-sm font-medium text-slate-700">
                            Шифра делатности
                        </label>
                        <input
                            id="sifra_delatnosti"
                            type="text"
                            placeholder="Унесите шифру делатности..."
                            value={sifra_delatnosti}
                            onChange={e => setSifraDelatnosti(e.target.value)}
                            className={inputStyle}
                        />
                    </div>
                </div>

                {/* Адресе */}
                <div className="space-y-6">
                    <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                        Адресе
                    </h3>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="adresa_sediste" className="text-sm font-medium text-slate-700">
                            Адреса седишта
                        </label>
                        <input
                            id="adresa_sediste"
                            type="text"
                            placeholder="Унесите адресу седишта..."
                            value={adresa_sediste}
                            onChange={e => setAdresaSediste(e.target.value)}
                            className={inputStyle}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="adresa_ostala" className="text-sm font-medium text-slate-700">
                            Адресе огранака и осталих функционалних целина
                        </label>
                        <textarea
                            id="adresa_ostala"
                            placeholder="Унесите адресе огранака, издвојених места и осталих функционалних целина које нису на истој адреси као седиште..."
                            value={adresa_ostala}
                            onChange={e => setAdresaOstala(e.target.value)}
                            rows={3}
                            className={textareaStyle}
                        />
                    </div>
                </div>

                {/* Контакт подаци */}
                <div className="space-y-6">
                    <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                        Контакт подаци
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="telefon_faks" className="text-sm font-medium text-slate-700">
                                Број телефона / факса
                            </label>
                            <input
                                id="telefon_faks"
                                type="text"
                                placeholder="Унесите број телефона/факса..."
                                value={telefon_faks}
                                onChange={e => setTelefonFaks(e.target.value)}
                                className={inputStyle}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="internet_adresa" className="text-sm font-medium text-slate-700">
                                Интернет адреса
                            </label>
                            <input
                                id="internet_adresa"
                                type="url"
                                placeholder="https://www.example.com"
                                value={internet_adresa}
                                onChange={e => setInternetAdresa(e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Одговорна лица */}
                <div className="space-y-6">
                    <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                        Одговорна лица
                    </h3>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="lice_zastupanje" className="text-sm font-medium text-slate-700">
                            Лице одговорно за заступање
                        </label>
                        <input
                            id="lice_zastupanje"
                            type="text"
                            placeholder="Име, презиме и функција лица одговорног за заступање..."
                            value={lice_zastupanje}
                            onChange={e => setLiceZastupanje(e.target.value)}
                            className={inputStyle}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="lice_komunikacija" className="text-sm font-medium text-slate-700">
                            Лице овлашћено за комуникацију у вези процене ризика
                        </label>
                        <input
                            id="lice_komunikacija"
                            type="text"
                            placeholder="Име, презиме и контакт лица за комуникацију..."
                            value={lice_komunikacija}
                            onChange={e => setLiceKomunikacija(e.target.value)}
                            className={inputStyle}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="tim_procena_rizika" className="text-sm font-medium text-slate-700">
                            Тим за процену ризика
                        </label>
                        <textarea
                            id="tim_procena_rizika"
                            placeholder="Подаци о лицима из организације која учествују у тиму за процену ризика (име, презиме, стручна спрема)..."
                            value={tim_procena_rizika}
                            onChange={e => setTimProcenaRizika(e.target.value)}
                            rows={4}
                            className={textareaStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Submit button */}
            <div className="border-t border-slate-200 pt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? loadingLabel : submitLabel}
                </button>

                {/* Security note */}
                <div className="mt-4 text-center text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <svg className='inline w-4 h-4 text-slate-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                        </svg>
                        Ваши подаци су заштићени и биће коришћени само за потребе процене ризика
                    </span>
                </div>
            </div>
        </form>
    );
}

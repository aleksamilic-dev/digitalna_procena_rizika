'use client';

import React, { useState, useEffect } from 'react';

interface OrganizacijaData {
    id?: number;
    poslovno_ime: string;
    adresa_sediste: string;
    maticni_broj: string;
    pib: string;
    broj_licence: string;
    menadzer_ime: string;
    menadzer_licence: string;
}

interface ClanTima {
    id?: number;
    ime: string;
    broj_licence: string;
}

interface OrganizacijaProceneFormProps {
    pravnoLiceId: number;
    onSave?: () => void;
}

export default function OrganizacijaProceneForm({ pravnoLiceId, onSave }: OrganizacijaProceneFormProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organizacija, setOrganizacija] = useState<OrganizacijaData>({
        poslovno_ime: '',
        adresa_sediste: '',
        maticni_broj: '',
        pib: '',
        broj_licence: '',
        menadzer_ime: '',
        menadzer_licence: ''
    });
    const [clanoviTima, setClanoviTima] = useState<ClanTima[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/pravno-lice/${pravnoLiceId}/organizacija-procene`);
            if (response.ok) {
                const data = await response.json();
                setOrganizacija(data.organizacija);
                setClanoviTima(data.clanoviTima || []);
            }
        } catch (error) {
            console.error('Greška pri učitavanju podataka:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pravnoLiceId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch(`/api/pravno-lice/${pravnoLiceId}/organizacija-procene`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizacija, clanoviTima })
            });

            if (response.ok) {
                alert('Podaci uspešno sačuvani!');
                if (onSave) onSave();
            } else {
                alert('Greška pri čuvanju podataka');
            }
        } catch (error) {
            console.error('Greška:', error);
            alert('Greška pri čuvanju podataka');
        } finally {
            setSaving(false);
        }
    };

    const dodajClana = () => {
        setClanoviTima([...clanoviTima, { ime: '', broj_licence: '' }]);
    };

    const ukloniClana = (index: number) => {
        setClanoviTima(clanoviTima.filter((_, i) => i !== index));
    };

    const updateClan = (index: number, field: keyof ClanTima, value: string) => {
        const newClanovi = [...clanoviTima];
        newClanovi[index] = { ...newClanovi[index], [field]: value };
        setClanoviTima(newClanovi);
    };

    if (loading) {
        return <div className="text-center py-4">Učitavanje...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">1.3. ПОДАЦИ О ОРГАНИЗАЦИЈИ КОЈА ВРШИ ПРОЦЕНУ РИЗИКА</h2>

                {/* Napomena o razlici */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2">
                    <span className="text-amber-600 text-lg mt-0.5">&#9432;</span>
                    <div className="text-sm text-amber-800">
                        <strong>Napomena:</strong> Ovaj odeljak sadrži podatke o <strong>ovlašćenoj organizaciji koja vrši procenu rizika</strong> (npr. Securitas, konsultantska kuća i sl.), 
                        a <strong>ne</strong> o pravnom licu nad kojim se procena vrši. 
                        Podaci o klijentu (PIB, matični broj i adresa klijenta) nalaze se u <strong>odeljku 1.1.</strong> iznad.
                    </div>
                </div>

                {/* a) Podaci o organizaciji */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-3 bg-blue-100 p-2 text-gray-900">а) Подаци о организацији која врши процену (овлашћена кућа)</h3>
                    <table className="w-full border-collapse border border-gray-300">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 w-1/3 font-medium text-gray-900">
                                    Пословно име (назив)
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.poslovno_ime}
                                        onChange={(e) => setOrganizacija({ ...organizacija, poslovno_ime: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                    Адреса седиште
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.adresa_sediste}
                                        onChange={(e) => setOrganizacija({ ...organizacija, adresa_sediste: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                    Матични број
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.maticni_broj}
                                        onChange={(e) => setOrganizacija({ ...organizacija, maticni_broj: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                    ПИБ <span className="text-xs font-normal text-blue-600">(овлашћене куће)</span>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.pib}
                                        onChange={(e) => setOrganizacija({ ...organizacija, pib: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                    Број лиценце
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.broj_licence}
                                        onChange={(e) => setOrganizacija({ ...organizacija, broj_licence: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* b) Menadžer rizika */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-3 bg-blue-100 p-2 text-gray-900">б) Менаџер ризика – вођа тима</h3>
                    <table className="w-full border-collapse border border-gray-300">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 w-1/3 font-medium text-gray-900">
                                    Име и презиме менаџера ризика – вођа тима
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.menadzer_ime}
                                        onChange={(e) => setOrganizacija({ ...organizacija, menadzer_ime: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                    Број лиценце
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={organizacija.menadzer_licence}
                                        onChange={(e) => setOrganizacija({ ...organizacija, menadzer_licence: e.target.value })}
                                        className="w-full p-1 border rounded text-gray-900 font-medium"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* v) Članovi tima */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-3 bg-blue-100 p-2 text-gray-900">в) Чланови тима за процену ризика</h3>
                    <table className="w-full border-collapse border border-gray-300">
                        <tbody>
                            {clanoviTima.map((clan, index) => (
                                <React.Fragment key={index}>
                                    <tr>
                                        <td className="border border-gray-300 bg-blue-50 p-2 w-1/3 font-medium text-gray-900">
                                            Име и презиме члана тима за процену ризика
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <input
                                                type="text"
                                                value={clan.ime}
                                                onChange={(e) => updateClan(index, 'ime', e.target.value)}
                                                className="w-full p-1 border rounded text-gray-900 font-medium"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-2 w-24">
                                            <button
                                                onClick={() => ukloniClana(index)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                Уклони
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-blue-50 p-2 font-medium text-gray-900">
                                            Број лиценце
                                        </td>
                                        <td className="border border-gray-300 p-2" colSpan={2}>
                                            <input
                                                type="text"
                                                value={clan.broj_licence}
                                                onChange={(e) => updateClan(index, 'broj_licence', e.target.value)}
                                                className="w-full p-1 border rounded text-gray-900 font-medium"
                                            />
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    <button
                        onClick={dodajClana}
                        className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        + Додај члана тима
                    </button>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {saving ? 'Чување...' : 'Сачувај податке'}
                    </button>
                </div>
            </div>
        </div>
    );
}

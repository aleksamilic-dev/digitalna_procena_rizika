"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileDown, Search, Trash2 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { btn, card, input, Spinner, StatusBadge } from './ui';

interface ProcenaData {
    id: number;
    datum: string;
    status: string;
    pravnoLiceId: number;
    naziv: string;
    pib: string;
    adresa: string;
    ukupnoRizika: number;
    visokoRizicniRizici: number;
}

interface ProcenaHistoryTableProps {
    className?: string; // Props can be added here if needed in the future
}

export default function ProcenaHistoryTable({}: ProcenaHistoryTableProps) {
    const [procene, setProocene] = useState<ProcenaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'datum' | 'naziv'>('datum');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [exportingPDF, setExportingPDF] = useState(false);

    useEffect(() => {
        loadProocene();
    }, []);

    const loadProocene = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/procena');

            if (!response.ok) {
                throw new Error('Greška pri učitavanju procena');
            }

            const data = await response.json();
            setProocene(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Neočekivana greška');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column: 'datum' | 'naziv') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleDeleteProcena = async (procenaId: number, naziv: string) => {
        if (!confirm(`Да ли сте сигурни да желите да обришете процену за "${naziv}"?\n\nОва акција је неповратна и обрисаће све повезане податке.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/procena/${procenaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Ukloni procenu iz lokalnog state-a
                setProocene(prev => prev.filter(p => p.id !== procenaId));
            } else {
                const errorData = await response.json();
                alert(`Грешка при брисању: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Greška pri brisanju procene:', error);
            alert('Дошло је до грешке при брисању процене.');
        }
    };

    const handleExportToPDF = async () => {
        setExportingPDF(true);
        try {
            // Create a temporary div with the content to export
            const exportContent = document.createElement('div');
            exportContent.style.position = 'absolute';
            exportContent.style.left = '-9999px';
            exportContent.style.top = '0';
            exportContent.style.width = '800px';
            exportContent.style.backgroundColor = 'white';
            exportContent.style.padding = '20px';
            exportContent.style.fontFamily = 'Arial, sans-serif';

            const currentDate = new Date().toLocaleDateString('sr-RS');
            const totalHighRisks = filteredAndSortedProocene.reduce((sum, p) => sum + (p.visokoRizicniRizici || 0), 0);

            exportContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 10px;">Историја процена ризика</h1>
                    <p style="color: #374151; font-size: 14px;">Генерисано: ${currentDate}</p>
                </div>
                
                <div style="display: flex; justify-content: space-around; margin-bottom: 30px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #2563eb;">${filteredAndSortedProocene.length}</div>
                        <div style="font-size: 12px; color: #374151;">Укупно процена</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${totalHighRisks}</div>
                        <div style="font-size: 12px; color: #374151;">Високи ризици</div>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; color: #111827; font-weight: bold;">Правно лице</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; color: #111827; font-weight: bold;">ПИБ</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; color: #111827; font-weight: bold;">Датум</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #111827; font-weight: bold;">Укупно ризика</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #111827; font-weight: bold;">Високи ризици</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #111827; font-weight: bold;">Ниво ризика</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredAndSortedProocene.map(procena => {
                const safeUkupno = procena.ukupnoRizika || 0;
                const safeVisoki = procena.visokoRizicniRizici || 0;
                const procenat = safeUkupno > 0 ? (safeVisoki / safeUkupno) * 100 : 0;
                let nivoText = 'Безбедно';
                let nivoColor = '#059669';
                if (procenat >= 50) {
                    nivoText = 'Висок ризик';
                    nivoColor = '#dc2626';
                } else if (procenat >= 25) {
                    nivoText = 'Средњи ризик';
                    nivoColor = '#d97706';
                } else if (procenat > 0) {
                    nivoText = 'Низак ризик';
                    nivoColor = '#ca8a04';
                }

                return `
                                <tr>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; color: #111827;">${procena.naziv}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; color: #111827;">${procena.pib}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; color: #111827;">${new Date(procena.datum).toLocaleDateString('sr-RS')}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #111827;">${procena.ukupnoRizika || 0}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #dc2626; font-weight: bold;">${procena.visokoRizicniRizici || 0}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: ${nivoColor}; font-weight: bold;">${nivoText}</td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #374151;">
                    <p>Систем за дигиталну процену ризика</p>
                </div>
            `;

            document.body.appendChild(exportContent);

            // Convert to canvas
            const canvas = await html2canvas(exportContent, {
                useCORS: true,
                allowTaint: true,
                background: '#ffffff'
            });

            // Remove temporary element
            document.body.removeChild(exportContent);

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const fileName = `istorija_procena_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Greška pri eksportu u PDF:', error);
            alert('Дошло је до грешке при експорту у PDF.');
        } finally {
            setExportingPDF(false);
        }
    };

    const getRiskLevelBadge = (visokoRizicni: number, ukupno: number) => {
        const safeVisokoRizicni = visokoRizicni || 0;
        const safeUkupno = ukupno || 0;
        
        if (safeUkupno === 0) {
            return <span className="text-xs text-slate-400">—</span>;
        }

        const procenat = (safeVisokoRizicni / safeUkupno) * 100;

        if (procenat >= 50) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Висок ризик</span>;
        } else if (procenat >= 25) {
            return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Средњи ризик</span>;
        } else if (procenat > 0) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Низак ризик</span>;
        } else {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Безбедно</span>;
        }
    };

    // Filtriranje i sortiranje
    const filteredAndSortedProocene = procene
        .filter(procena => {
            const matchesSearch = searchTerm === '' ||
                procena.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
                procena.pib.includes(searchTerm);
            return matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'datum':
                    comparison = new Date(a.datum).getTime() - new Date(b.datum).getTime();
                    break;
                case 'naziv':
                    comparison = a.naziv.localeCompare(b.naziv);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

    if (loading) {
        return <Spinner label="Учитавам процене..." />;
    }

    if (error) {
        return (
            <div className={`${card} p-8 text-center`}>
                <p className="text-sm font-medium text-red-600">{error}</p>
                <button onClick={loadProocene} className={`${btn.secondary} mt-4`}>
                    Покушај поново
                </button>
            </div>
        );
    }

    const sortIndikator = (column: 'datum' | 'naziv') =>
        sortBy === column ? <span>{sortOrder === 'asc' ? '↑' : '↓'}</span> : null;

    return (
        <div className={card}>
            {/* Pretraga, zbirni podaci i izvoz */}
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Претражи по називу или ПИБ-у..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${input} pl-9`}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex gap-6 text-sm text-slate-600">
                        <span><span className="font-semibold text-slate-900">{procene.length}</span> укупно</span>
                        <span><span className="font-semibold text-slate-900">{procene.filter(p => p.status === 'u_toku').length}</span> у току</span>
                        <span><span className="font-semibold text-red-600">{procene.reduce((sum, p) => sum + (p.visokoRizicniRizici || 0), 0)}</span> високих ризика</span>
                    </div>
                    <button
                        onClick={handleExportToPDF}
                        disabled={exportingPDF || filteredAndSortedProocene.length === 0}
                        className={btn.secondary}
                    >
                        <FileDown className="h-4 w-4" />
                        {exportingPDF ? 'Извозим...' : 'Извези у PDF'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3">
                                <button onClick={() => handleSort('naziv')} className="flex items-center gap-1 uppercase hover:text-slate-700">
                                    Правно лице {sortIndikator('naziv')}
                                </button>
                            </th>
                            <th className="px-4 py-3">
                                <button onClick={() => handleSort('datum')} className="flex items-center gap-1 uppercase hover:text-slate-700">
                                    Креирана {sortIndikator('datum')}
                                </button>
                            </th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3">Ризици</th>
                            <th className="px-4 py-3">Ниво ризика</th>
                            <th className="px-4 py-3"><span className="sr-only">Акције</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAndSortedProocene.map((procena) => (
                            <tr key={procena.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <Link href={`/optimized-risk/${procena.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                        {procena.naziv}
                                    </Link>
                                    <div className="text-xs text-slate-500">ПИБ {procena.pib}</div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                    {new Date(procena.datum).toLocaleDateString('sr-RS')}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <StatusBadge status={procena.status} cirilica />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                    {procena.ukupnoRizika || 0}
                                    {(procena.visokoRizicniRizici || 0) > 0 && (
                                        <span className="ml-1 text-xs text-red-600">({procena.visokoRizicniRizici} високих)</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {getRiskLevelBadge(procena.visokoRizicniRizici, procena.ukupnoRizika)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link href={`/optimized-risk/${procena.id}`} className={btn.secondary}>
                                            {procena.status === 'u_toku' ? 'Настави' : 'Отвори'}
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteProcena(procena.id, procena.naziv)}
                                            className={btn.iconDanger}
                                            title="Обриши процену"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredAndSortedProocene.length === 0 && (
                <div className="py-12 text-center">
                    <h3 className="text-sm font-medium text-slate-900">Нема процена за приказ</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {searchTerm
                            ? 'Покушајте са другачијим појмом за претрагу.'
                            : 'Нову процену започните дугметом „Нова процена“.'}
                    </p>
                </div>
            )}
        </div>
    );
}

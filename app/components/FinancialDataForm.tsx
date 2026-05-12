'use client';

import React, { useState } from 'react';
import { UTICAJ_DELATNOSTI } from '../data/riskDataLoader';

interface FinancialData {
  poslovniPrihodi: number;
  vrednostImovine: number;
  delatnost: string;
  stvarnaSteta: number;
}

interface FinancialDataFormProps {
  procenaId: string;
  initialData?: Partial<FinancialData>;
  onSave: (data: FinancialData) => void;
  onClose: () => void;
}

export default function FinancialDataForm({ procenaId, initialData, onSave, onClose }: FinancialDataFormProps) {
  // Jednostavno - koristi initialData ili default vrednosti, bez API poziva
  const [formData, setFormData] = useState<FinancialData>({
    poslovniPrihodi: initialData?.poslovniPrihodi ?? 1000000,
    vrednostImovine: initialData?.vrednostImovine ?? 5000000,
    delatnost: initialData?.delatnost || 'default',
    stvarnaSteta: initialData?.stvarnaSteta ?? 0
  });
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validacija obaveznih polja
    if (!formData.poslovniPrihodi || formData.poslovniPrihodi <= 0) {
      alert('Пословни приходи су обавезни и морају бити већи од 0');
      return;
    }

    if (!formData.vrednostImovine || formData.vrednostImovine <= 0) {
      alert('Вредност имовине је обавезна и мора бити већа од 0');
      return;
    }

    setSaving(true);

    try {
      // Sačuvaj finansijske podatke - SAMO OVDE SE POZIVA API
      const response = await fetch(`/api/procena/${procenaId}/financial-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave(formData);
        onClose();
      } else {
        throw new Error('Greška pri čuvanju podataka');
      }
    } catch (error) {
      console.error('Greška:', error);
      alert('Greška pri čuvanju finansijskih podataka');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof FinancialData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const delatnostiOptions = Object.keys(UTICAJ_DELATNOSTI).map(key => ({
    value: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    iud: UTICAJ_DELATNOSTI[key]
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              💰 Finansijski подаци за процену
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Upozorenje o važnosti finansijskih podataka */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Важно: Финансијски подаци су обавезни за тачну процену ризика
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Према стандарду SRPS A.L2.003:2025, финансијски подаци се користе за:
                  </p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Калкулацију стварне штете (СШ) на основу пословних прихода</li>
                    <li>Калкулацију вероватно максималне штете (ВМШ) на основу вредности имовине</li>
                    <li>Одређивање прихватљивости ризика</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poslovni prihodi */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Poslovni prihodi (AOP 1001) - RSD <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.poslovniPrihodi || ''}
                onChange={(e) => handleChange('poslovniPrihodi', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${!formData.poslovniPrihodi || formData.poslovniPrihodi <= 0
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-600'
                  }`}
                placeholder="Унесите пословне приходе (нпр. 1.000.000)"
                required
                min="1"
              />
              <p className="text-xs text-gray-900 mt-1">
                <strong>Обавезно поље.</strong> Из последњег објављеног биланса успеха (AOP 1001)
              </p>
            </div>

            {/* Vrednost imovine */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Vrednost imovine (SVnpoz) - RSD <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.vrednostImovine || ''}
                onChange={(e) => handleChange('vrednostImovine', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${!formData.vrednostImovine || formData.vrednostImovine <= 0
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-600'
                  }`}
                placeholder="Унесите вредност имовине (нпр. 5.000.000)"
                required
                min="1"
              />
              <p className="text-xs text-gray-900 mt-1">
                <strong>Обавезно поље.</strong> Садашња вредност некретина, постројења, опреме и залиха (SVnpoz)
              </p>
            </div>

            {/* Delatnost */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Delatnost organizacije
              </label>
              <select
                value={formData.delatnost}
                onChange={(e) => handleChange('delatnost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                {delatnostiOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} (Iud: {option.iud})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-900 mt-1">
                Иуд – Indeks uticaja delatnosti (decimalni prikaz uticaja delatnosti) služi za proračun verovatno maksimalne štete (VMŠ)
              </p>
            </div>

            {/* Stvarna šteta */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Stvarna šteta (SŠ) - RSD
              </label>
              <input
                type="number"
                value={formData.stvarnaSteta}
                onChange={(e) => handleChange('stvarnaSteta', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Унесите штету ако је било (може бити 0)"
              />
              <p className="text-xs text-gray-900 mt-1">
                Evidentirana šteta u protekle 3 godine (može biti 0)
              </p>
            </div>

            {/* Kalkulacija preview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Pregled kalkulacije</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>
                  <strong>SŠ procenat:</strong> {formData.poslovniPrihodi > 0 ?
                    ((formData.stvarnaSteta / formData.poslovniPrihodi) * 100).toFixed(2) : 0}% od poslovnih prihoda
                </div>
                <div>
                  <strong>Иуд (indeks uticaja delatnosti):</strong> {UTICAJ_DELATNOSTI[formData.delatnost]}
                  <br />
                  <span className="text-xs text-gray-600">Decimalni prikaz uticaja delatnosti za proračun VMŠ (Prilog B1, tabela B1, kol. 4)</span>
                </div>
                <div>
                  <strong>Ukupna vrednost za kalkulacije:</strong> {(formData.poslovniPrihodi + formData.vrednostImovine).toLocaleString()} RSD
                </div>
              </div>
            </div>

            {/* Dugmad */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                Otkaži
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Čuvam...' : 'Sačuvaj'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
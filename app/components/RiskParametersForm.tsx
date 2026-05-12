"use client";
import { useState } from "react";

interface RiskParametersFormProps {
  riskId: string;
  riskDescription: string;
  onParametersSet: (params: {
    stepenIzlozenosti: number;
    stepenRanjivosti: number;
    kriticnost: number;
  }) => void;
  onCancel: () => void;
}

export default function RiskParametersForm({ 
  riskId, 
  riskDescription, 
  onParametersSet, 
  onCancel 
}: RiskParametersFormProps) {
  const [stepenIzlozenosti, setStepenIzlozenosti] = useState(3);
  const [stepenRanjivosti, setStepenRanjivosti] = useState(3);
  const [kriticnost, setKriticnost] = useState(3);

  const handleSubmit = () => {
    onParametersSet({
      stepenIzlozenosti,
      stepenRanjivosti,
      kriticnost
    });
  };

  const izlozenostOpisi = {
    1: "Zanemarljiva (1-2 dana)",
    2: "Povremena (3-7 dana)", 
    3: "Dugotrajna (1-12 meseci)",
    4: "Pretežna (1-3 godine)",
    5: "Trajna (više godina)"
  };

  const ranjivostOpisi = {
    1: "Vrlo velika (potpuno slaba zaštita)",
    2: "Velika (samo fizička zaštita)",
    3: "Srednja (samo tehnička zaštita)", 
    4: "Mala (kombinacija zaštite)",
    5: "Vrlo mala (potpuna zaštita prema aktu)"
  };

  const kriticnostOpisi = {
    1: "Vrlo velika (potpuni prekid funkcionisanja)",
    2: "Velika (ozbiljno narušavanje)",
    3: "Srednja (funkcionisanje uz povećanje napora)",
    4: "Mala (poremećaji u radu)",
    5: "Minimalna (problemi koji se rešavaju u hodu)"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Parametri za procenu rizika
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Rizik:</strong> {riskId}
          </p>
          <p className="text-sm text-gray-600">
            {riskDescription}
          </p>
        </div>

        <div className="space-y-6">
          {/* Stepen izloženosti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stepen izloženosti (Si, Prilog N - tabela N.3)
            </label>
            <select
              value={stepenIzlozenosti}
              onChange={(e) => setStepenIzlozenosti(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 mb-2"
            >
              {Object.entries(izlozenostOpisi).map(([value, opis]) => (
                <option key={value} value={value}>
                  {value} - {opis}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Koliko dugo je organizacija izložena ovom riziku? Stepenovanje se vrši prema Prilogu N, tabela N.3.
            </p>
          </div>

          {/* Stepen ranjivosti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stepen ranjivosti (Sr, Prilog N - tabela N.4)
            </label>
            <select
              value={stepenRanjivosti}
              onChange={(e) => setStepenRanjivosti(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 mb-2"
            >
              {Object.entries(ranjivostOpisi).map(([value, opis]) => (
                <option key={value} value={value}>
                  {value} - {opis}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Koliko je organizacija ranjiva na ovaj rizik? Stepenovanje se vrši prema Prilogu N, tabela N.4.
            </p>
          </div>

          {/* Kritičnost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kritičnost (K, Prilog Nj - tabela Nj.2)
            </label>
            <select
              value={kriticnost}
              onChange={(e) => setKriticnost(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 mb-2"
            >
              {Object.entries(kriticnostOpisi).map(([value, opis]) => (
                <option key={value} value={value}>
                  {value} - {opis}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Stepen kritičnosti (К) izražen je od 1 do 5, određuje se na osnovu podataka iz kontrolne liste. 
              Izračunava se za svaki faktor unutar grupe rizika i agregatno (prosečno) za svaku grupu rizika.
            </p>
          </div>
        </div>

        {/* Dugmad */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Otkaži
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Potvrdi i izračunaj
          </button>
        </div>
      </div>
    </div>
  );
}

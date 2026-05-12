'use client';

import React from 'react';
import { PrilogMData } from '../data/riskDataLoader';

interface PrilogMDetailsProps {
  data: PrilogMData;
  onClose: () => void;
}

export default function PrilogMDetails({ data, onClose }: PrilogMDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📊 Detaljne kalkulacije - {data.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Osnovni podaci */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">📋 Osnovni podaci</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>ID:</strong> {data.id}</div>
                <div><strong>Grupa:</strong> {data.groupId}</div>
                <div><strong>Zahtev:</strong> {data.requirement}</div>
              </div>
            </div>

            {/* Kalkulacije prema standardu */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 mb-4">🧮 Kalkulacije prema SRPS A.L2.003:2025</h3>

              {/* Kolona 4: Izloženost */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 4: Izloženost (I)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> I = (Si + Svo)/2</p>
                  <p><strong>Kalkulacija:</strong> I = (Si + {data.velicinaOpasnosti})/2 = {data.izlozenost}</p>
                  <p><strong>Objašnjenje:</strong> Si = stepen izloženosti (1-5, Prilog N tabela N.3), Svo = stepen veličine opasnosti (1-5, Prilog Lj kol. 3)</p>
                </div>
              </div>

              {/* Kolona 5: Ranjivost */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 5: Ranjivost (R)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> R = (Sr + Svo)/2</p>
                  <p><strong>Kalkulacija:</strong> R = (Sr + {data.velicinaOpasnosti})/2 = {data.ranjivost}</p>
                  <p><strong>Objašnjenje:</strong> Sr = stepen ranjivosti (1-5, Prilog N tabela N.4), Svo = stepen veličine opasnosti (1-5, Prilog Lj kol. 3)</p>
                </div>
              </div>

              {/* Kolona 6: Verovatnoća */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 6: Verovatnoća (V)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> V = I × R (iz matrice N.5)</p>
                  <p><strong>Kalkulacija:</strong> Ranjivost {data.ranjivost} × Izloženost {data.izlozenost} = {data.verovatnoca}</p>
                  <p><strong>Matrica:</strong> Prilog N, tabela N.5</p>
                  <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-xs">
                    <p className="mb-1"><strong>НАПОМЕНА 1:</strong> Према упутству В = И (кол. 4) # Р (кол. 5)</p>
                    <p><strong>НАПОМЕНА 2:</strong> Добијене вредности се заокружују на целе бројеве.</p>
                  </div>
                </div>
              </div>

              {/* Kolona 7: Štete */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 7: Štete (Š)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> Š = (SŠ + VMŠ)/2</p>
                  <div className="mt-2 pl-4 border-l-2 border-blue-200">
                    <p><strong>SŠ (Stvarna šteta):</strong></p>
                    <p className="text-xs text-gray-600">• Iz finansijskih podataka prema Prilogu Nj, tabela Nj.1</p>
                    <p className="text-xs text-gray-600">• Procenat od poslovnih prihoda (AOP 1001)</p>
                  </div>
                  <div className="mt-2 pl-4 border-l-2 border-green-200">
                    <p><strong>VMŠ (Verovatno maksimalna šteta):</strong></p>
                    <p className="text-xs text-gray-600">• VMŠ = SVnpoz × Ivo</p>
                    <p className="text-xs text-gray-600">• Ivo = Иуд × Кво</p>
                    <p className="text-xs text-gray-600">• Индекс утицаја делатности је децимални приказ утицаја делатности (Уд) и служи за прорачун вероватно максималне штете (Прилог Б1, кол. 4)</p>
                    <p className="text-xs text-gray-600">• Кво – koeficijent veličine opasnosti: 10%(Svo=1), 15%(Svo=2), 20%(Svo=3), 25%(Svo=4), 30%(Svo=5)</p>
                    <p className="text-xs text-gray-600">• Stepen Svo se preuzima iz Priloga Lj, kol. 3</p>
                    <p className="text-xs text-gray-600">• Prema Prilogu Nj, tabela Nj.1a</p>
                  </div>
                  <p className="mt-2"><strong>Finalni rezultat:</strong> <span className="bg-yellow-100 px-2 py-1 rounded">{data.steta}</span></p>
                </div>
              </div>

              {/* Kolona 8: Kritičnost */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 8: Kritičnost (K)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Vrednost:</strong> <span className="bg-purple-100 px-2 py-1 rounded font-bold">{data.kriticnost}</span></p>
                  <p className="mt-2"><strong>Objašnjenje:</strong> Stepen kritičnosti (К) izražen je od 1 do 5, određuje se na osnovu podataka iz kontrolne liste prema kriterijumu u Prilogu Nj, tabela Nj.2</p>
                  <p className="text-xs text-gray-600 mt-1">• Izračunava se za svaki faktor unutar grupe rizika i agregatno (prosečno) za svaku grupu rizika</p>
                </div>
              </div>

              {/* Kolona 9: Posledice */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 9: Posledice (P)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> P = Š × K (iz matrice Nj.3)</p>
                  <p><strong>Kalkulacija:</strong> Šteta {data.steta} × Kritičnost {data.kriticnost} = {data.posledice}</p>
                  <p><strong>Matrica:</strong> Prilog Nj, tabela Nj.3</p>
                </div>
              </div>

              {/* Kolona 10: Nivo rizika */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Kolona 10: Nivo rizika (NR)</h4>
                <div className="text-sm text-gray-800">
                  <p><strong>Formula:</strong> NR = V × P (iz matrice O.2)</p>
                  <p><strong>Kalkulacija:</strong> Verovatnoća {data.verovatnoca} × Posledice {data.posledice} = {data.nivoRizika}</p>
                  <p><strong>Matrica:</strong> Prilog O, tabela O.2</p>
                </div>
              </div>
            </div>

            {/* Finalni rezultati */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-4">🎯 Finalni rezultati</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-800 mb-2">Kategorija rizika</h4>
                  <div className={`inline-block px-3 py-1 rounded text-white font-bold ${data.kategorijaRizika === 1 ? 'bg-red-700' :
                      data.kategorijaRizika === 2 ? 'bg-orange-600' :
                        data.kategorijaRizika === 3 ? 'bg-yellow-600' :
                          data.kategorijaRizika === 4 ? 'bg-blue-600' :
                            'bg-green-600'
                    }`}>
                    {data.kategorijaRizika === 1 ? 'PRVA (Izrazito veliki)' :
                      data.kategorijaRizika === 2 ? 'DRUGA (Veliki)' :
                        data.kategorijaRizika === 3 ? 'TREĆA (Umereno veliki)' :
                          data.kategorijaRizika === 4 ? 'ČETVRTA (Mali)' :
                            'PETA (Vrlo mali)'}
                  </div>
                  <p className="text-xs text-gray-800 mt-2">Prema Prilogu P, tabela P.1</p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-gray-800 mb-2">Prihvatljivost</h4>
                  <div className={`inline-block px-3 py-1 rounded text-white font-bold ${data.prihvatljivost === 'NEPRIHVATLJIV' ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                    {data.prihvatljivost}
                  </div>
                  <p className="text-xs text-gray-800 mt-2">Prema Prilogu P, tabela P.2</p>
                </div>
              </div>
            </div>

            {/* Matrice reference */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">📚 Reference na standard</h3>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Matrica verovatnoće:</strong><br />
                  Prilog N, tabela N.5
                </div>
                <div>
                  <strong>Matrica posledica:</strong><br />
                  Prilog Nj, tabela Nj.3
                </div>
                <div>
                  <strong>Matrica nivo rizika:</strong><br />
                  Prilog O, tabela O.2
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

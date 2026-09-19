"use client";
import React from "react";
import { PrilogMData, calculatePrilogB1, getSvoPoGrupama } from "../data/riskDataLoader";

interface PrilogB1TableProps {
    prilogMData: Map<string, PrilogMData>;
}

// Nazivi grupa prema tabeli B1.1 iz Izmene 1 (SRPS A.L2.003/1:2025, tačka 2.11)
const RISK_GROUPS: { [key: number]: string } = {
    1: 'РИЗИЦИ ОД ОПШТЕ ПОСЛОВНИХ АКТИВНОСТИ',
    2: 'РИЗИЦИ ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ',
    3: 'ПРАВНИ РИЗИЦИ',
    4: 'РИЗИЦИ ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА',
    5: 'РИЗИЦИ ОД ПОЖАРА',
    6: 'РИЗИЦИ ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА',
    7: 'РИЗИЦИ ОД ЕКСПЛОЗИЈА',
    8: 'РИЗИЦИ ОД НЕПРИМЕНЕ СТАНДАРДА',
    9: 'РИЗИЦИ ПО ЖИВОТНУ СРЕДИНУ',
    10: 'РИЗИЦИ У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА',
    11: 'ИКТ РИЗИЦИ (заштита података)'
};

export default function PrilogB1Table({ prilogMData }: PrilogB1TableProps) {
    // Сво (кол. 3) се преузима из Прилога Љ, кол. 3; остале колоне се рачунају (Izmena 1, tačka 2.11)
    const data = calculatePrilogB1(getSvoPoGrupama(Array.from(prilogMData.values())));
    const totalSvo = data.reduce((sum, item) => sum + item.svo, 0);
    const totalUticaj = data.reduce((sum, item) => sum + item.uticaj, 0);

    return (
        <div className="p-6 bg-white border-2 border-gray-800 rounded-lg mt-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Прилог Б1</h2>
                <h3 className="text-lg font-bold text-gray-800 mb-2">(нормативан)</h3>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Утицај делатности</h4>
                <p className="font-bold text-gray-800 mb-2">Табела Б1.1 – Дистрибуција утицаја претежне делатности на ризике</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-gray-900">
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '50px' }}>РБ</th>
                            <th className="border border-gray-800 px-2 py-2 text-center">Група ризика</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '80px' }}>Степен величине опасности<br />(Сво)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Утицај делатности<br />(%)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Индекс утицаја делатности<br />(Иуд)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Коефицијент величине опасности<br />(Кво)</th>
                            <th className="border border-gray-800 px-2 py-2 text-center" style={{ width: '100px' }}>Индекс величине опасности<br />(Иво)</th>
                        </tr>
                        <tr className="bg-gray-50 text-xs text-gray-900 font-semibold">
                            <th className="border border-gray-800 px-1 py-1 text-center">1</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">2</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">3</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">4</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">5</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">6</th>
                            <th className="border border-gray-800 px-1 py-1 text-center">7</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.groupNumber} className="hover:bg-gray-50">
                                <td className="border border-gray-800 px-2 py-2 text-center font-medium bg-yellow-50 text-gray-900">{item.groupNumber}</td>
                                <td className="border border-gray-800 px-2 py-2 font-medium text-gray-900">{RISK_GROUPS[item.groupNumber]}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center bg-blue-50 text-gray-900 font-medium">{item.svo}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">
                                    {item.uticaj.toFixed(2)}%
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.iud.toFixed(4)}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.kvo.toFixed(2)}</td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-gray-900 font-medium">{item.ivo.toFixed(4)}</td>
                            </tr>
                        ))}
                        <tr className="bg-green-100 font-bold">
                            <td className="border border-gray-800 px-2 py-2 text-center"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center text-gray-900">АГРЕГАТНО</td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200 text-gray-900">
                                {totalSvo}
                            </td>
                            <td className="border border-gray-800 px-2 py-2 text-center text-green-800">
                                {totalUticaj.toFixed(2)}%
                            </td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                            <td className="border border-gray-800 px-2 py-2 text-center bg-gray-200"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-sm text-gray-800">
                <p className="font-semibold mb-2">Упутство за коришћење:</p>
                <p className="mb-1">
                    <strong>Кол. 3</strong> – Сво – степен величине опасности за посматрану организацију (са свим огранцима) по групама ризика,
                    и уноси се према Прилогу Љ, Кол. 3 (аутоматски, као заокружен просек фактора у групи)
                </p>
                <p className="mb-1">
                    <strong>Кол. 4</strong> – Утицај делатности (Уд) по групама ризика према формули:
                    Уд = Сво/ΣСво у %, тако да укупан збир буде 100%
                </p>
                <p className="mb-1">
                    <strong>Кол. 5</strong> – Индекс утицаја делатности (Иуд) децимални је приказ утицаја делатности (Уд) према Кол. 4,
                    и служи за прорачун вероватно максималне штете
                </p>
                <p className="mb-1">
                    <strong>Кол. 6</strong> – Коефицијент величине опасности (Кво) одређује се према следећим односима:
                    0,1 ако је Сво = 1; 0,15 ако је Сво = 2; 0,2 ако је Сво = 3; 0,25 ако је Сво = 4 и 0,3 ако је Сво = 5,
                    и служи за прорачун индекса величине опасности (Иво) у Кол. 7
                </p>
                <p>
                    <strong>Кол. 7</strong> – Индекс величине опасности (Иво) представља однос индекса утицаја делатности (Иуд) и
                    коефицијента величине опасности (Кво), одређује се према формули: Иво = Иуд×Кво, изражава се у
                    децималној вредности и служи за прорачун вероватно максималне штете (ВМШ)
                </p>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-gray-800">
                <p className="font-semibold mb-2">НАПОМЕНА:</p>
                <p>Наведени подаци морају да буду уписани у Дигитални регистар процена ризика.</p>
            </div>
        </div>
    );
}

"use client";
import React from "react";
import { PrilogFData } from "./PrilogTypes";

interface TabelaF2Props {
    data: PrilogFData;
    onChange: (field: keyof PrilogFData, value: string) => void;
    readOnly?: boolean;
}

export default function TabelaF2({ data, onChange, readOnly }: TabelaF2Props) {
    return (
        <div className="mb-6 border-2 border-gray-800 rounded p-4 bg-white">
            <h5 className="font-bold text-center mb-4 text-gray-800">Табела Ф.2 – Подаци о посматраној организацији</h5>
            <table className="w-full text-sm border-collapse border border-gray-800">
                <tbody>
                    <tr>
                        <td className="border border-gray-800 p-2 w-1/3 align-top font-semibold text-gray-900">
                            1. Пословно име (назив), матични број (МБ), порески идентификациони број (ПИБ), адреса седишта и огранака...
                        </td>
                        <td className="border border-gray-800 p-0">
                            <textarea
                                className="w-full h-24 p-2 focus:outline-none resize-none text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                value={data.f2_podaci_o_posmatranoj_org || ''}
                                onChange={(e) => onChange('f2_podaci_o_posmatranoj_org', e.target.value)}
                                disabled={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-gray-800 p-2 align-top font-semibold text-gray-900">
                            2. Шифра делатности, матични број, ПИБ
                        </td>
                        <td className="border border-gray-800 p-0">
                            <textarea
                                className="w-full h-16 p-2 focus:outline-none resize-none text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                value={data.f2_sifra_delatnosti || ''}
                                onChange={(e) => onChange('f2_sifra_delatnosti', e.target.value)}
                                disabled={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-gray-800 p-2 align-top font-semibold text-gray-900">
                            3. Лице одговорно за заступање и лице(а) овлашћена за комуникацију у вези са проценом ризика
                        </td>
                        <td className="border border-gray-800 p-0">
                            <textarea
                                className="w-full h-16 p-2 focus:outline-none resize-none text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                value={data.f2_odgovorno_lice || ''}
                                onChange={(e) => onChange('f2_odgovorno_lice', e.target.value)}
                                disabled={readOnly}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-gray-800 p-2 align-top font-semibold text-gray-900">
                            4. Подаци о лицима из посматране организације која учествују у тиму (име, презиме, стручна спрема и радно место)
                        </td>
                        <td className="border border-gray-800 p-0">
                            <textarea
                                className="w-full h-16 p-2 focus:outline-none resize-none text-gray-900 disabled:text-gray-900 disabled:opacity-100"
                                value={data.f2_podaci_o_licima || ''}
                                onChange={(e) => onChange('f2_podaci_o_licima', e.target.value)}
                                disabled={readOnly}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

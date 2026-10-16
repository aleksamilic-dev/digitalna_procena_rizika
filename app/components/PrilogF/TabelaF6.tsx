"use client";
import React from "react";
import { F6_ZAKLJUCAK_STAVKE, PrilogFData } from "./PrilogTypes";

interface TabelaF6Props {
    data: PrilogFData;
    onChange: (field: keyof PrilogFData, value: PrilogFData[keyof PrilogFData]) => void;
    readOnly?: boolean;
}

export default function TabelaF6({ data, onChange, readOnly = false }: TabelaF6Props) {
    const updateTacka = (key: keyof typeof data.f6_zakljucak, val: string) => {
        onChange('f6_zakljucak', { ...data.f6_zakljucak, [key]: val });
    };

    return (
        <div className="mb-6 border-2 border-gray-800 rounded p-4 bg-white break-inside-avoid">
            {/* Oznake Mera Text provided by User */}
            <div className="mb-8 text-sm text-gray-800">
                <h3 className="font-bold text-lg mb-4 text-center">ОЗНАКЕ МЕРА за поступање са ризицима</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold mb-2">А. Мере физичке заштите (објеката, лица, јавних окупљања)</h4>
                        <div className="pl-4">
                            <strong>1. Проактивне мере</strong>
                            <ul className="list-none pl-4 mb-2">
                                <li>а) контрола приступа објекту и деловима објекта</li>
                                <li>б) контрола понашања и кретања у штићеном простору и објекту</li>
                                <li>в) патролирање</li>
                                <li>г) преглед лица, пртљага и возила – контрола робе и предмета</li>
                                <li>д) пратња и заштита</li>
                                <li>ђ) протипожарна стража</li>
                                <li>е) менаџмент из контролног центра – даљински мониторинг</li>
                                <li>ж) _______________________</li>
                            </ul>
                            <strong>2. Реактивне мере</strong>
                            <ul className="list-none pl-4">
                                <li>а) узбуњивање и евакуација</li>
                                <li>б) обавештавање јавних служби и надређених</li>
                                <li>в) примена овлашћења – употреба средстава принуде</li>
                                <li>г) гашење почетног пожара</li>
                                <li>д) пружање прве помоћи</li>
                                <li>ђ) обезбеђење лица места и чување материјалних доказа</li>
                                <li>е) интервенција патролних тимова контролног центра</li>
                                <li>ж) _______________________</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-2">Б. Мере техничке заштите (објеката, лица, јавних окупљања)</h4>
                        <div className="pl-4">
                            <strong>1. Проактивне мере</strong>
                            <ul className="list-none pl-4 mb-2">
                                <li>а) механичка заштита – ограде</li>
                                <li>б) алармни системи – противпровални</li>
                                <li>в) алармни системи – противпрепадни</li>
                                <li>г) алармни системи – противпожарни</li>
                                <li>д) систем видео-обезбеђења</li>
                                <li>ђ) систем електронског надзора робе</li>
                                <li>е) систем за контролу приступа – картица</li>
                                <li>ж) систем за контролу приступа – шифра</li>
                                <li>з) систем за контролу приступа – биометрија</li>
                                <li>и) систем за контролу приступа – комбинација КШБ</li>
                                <li>ј) систем за детекцију оружја, експлозивних...</li>
                                <li>к) систем електрохемијске заштите</li>
                                <li>л) интегрисана заштита...</li>
                                <li>љ) __________________</li>
                            </ul>
                            <strong>2. Реактивне мере</strong>
                            <ul className="list-none pl-4">
                                <li>а) сигнализација неовлашћеног уласка...</li>
                                <li>б) тестирање и провера система...</li>
                                <li>в) санирање оштећења механичке заштите</li>
                                <li>г) анализа снимљених записа...</li>
                                <li>д) техничка интервенција патролног тима...</li>
                                <li>ђ) __________________</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <h4 className="font-bold mb-2">В) Нормативно-административне и процедуралне мере</h4>
                        <ol className="list-decimal pl-5">
                            <li>Доношење интерне правне регулативе (општих аката)</li>
                            <li>Усаглашавање са законом</li>
                            <li>Уношење заштитних уговорних клаузула</li>
                            <li>Увођење процедура и механизама надзора и контроле:
                                <ul className="list-none pl-4 text-xs mt-1 space-y-1">
                                    <li>а) процедуре које регулишу рад службе обезбеђења</li>
                                    <li>б) процедуре које регулишу однос запослених и службе обезбеђења</li>
                                    <li>в) процедуре које регулишу механизме надзора...</li>
                                    <li>г) процедура мониторинга закључених уговора</li>
                                    <li>д) механизми и процедуре које регулишу унутрашње истраге</li>
                                    <li>ђ) едукација и тренинг запослених</li>
                                    <li>е) уређење простора</li>
                                    <li>ж) процедуре након извршеног кривичног дела</li>
                                    <li>з) _______________</li>
                                </ul>
                            </li>
                            <li>Усаглашавање са релевантним стандардима</li>
                        </ol>
                    </div>

                    <div>
                        <h4 className="font-bold mb-2">Г) Остале опције за ублажавање ризика</h4>
                        <ol className="list-decimal pl-5 mb-4">
                            <li>Избегавање ризика</li>
                            <li>Смањење ризика засновано на људским активностима:
                                <ul className="list-none pl-4">
                                    <li>a) контрола понашања</li>
                                    <li>б) процедурална контрола</li>
                                </ul>
                            </li>
                            <li>Смањење ризика без људских активности:
                                <ul className="list-none pl-4">
                                    <li>а) изменом постојеће технологије...</li>
                                    <li>б) увођењем нових безбедносних технологија...</li>
                                </ul>
                            </li>
                            <li>Подела ризика</li>
                            <li>Задржавање или прихватање ризика.</li>
                        </ol>

                        <h4 className="font-bold mb-2">Д. Опције за изводљивост</h4>
                        <ol className="list-decimal pl-5 mb-4">
                            <li>Мере су усклађене са политиком организације</li>
                            <li>Мере нису усклађене са политиком организације...</li>
                        </ol>

                        <h4 className="font-bold mb-2">Ђ. Анализа цена – ефикасност</h4>
                        <ol className="list-decimal pl-5">
                            <li>Увођење (годишњи износ) или износ корекције: a) радних процеса... б) производа...</li>
                            <li>Увођење (годишњи износ) или износ корекције: a) мера физичке... б) мера техничке... в) менаџмента...</li>
                            <li>Осигурање ризика (годишњи износ)</li>
                        </ol>
                    </div>
                </div>
                <hr className="my-6 border-gray-400" />
            </div>

            {/* Tabela F.6 Content Based on Image */}
            <h5 className="font-bold text-center mb-4 text-gray-800">Табела Ф.6 – Закључак процене ризика</h5>
            <div className="space-y-6">

                {/* 1 */}
                <div>
                    <div className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">
                        {F6_ZAKLJUCAK_STAVKE[0].naslov}
                    </div>
                    <div className="text-sm italic text-gray-700 mb-1 space-y-1">
                        {F6_ZAKLJUCAK_STAVKE[0].opisi.map(opis => <p key={opis}>{opis}</p>)}
                    </div>
                    <textarea
                        className="w-full h-24 border border-gray-400 p-2 text-gray-900 focus:outline-none resize-y rounded disabled:opacity-100 disabled:text-gray-900"
                        value={data.f6_zakljucak?.tacka_1 || ''}
                        onChange={(e) => updateTacka('tacka_1', e.target.value)}
                        disabled={readOnly}
                    />
                </div>

                {/* 2 */}
                <div>
                    <div className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">
                        {F6_ZAKLJUCAK_STAVKE[1].naslov}
                    </div>
                    <div className="text-sm italic text-gray-700 mb-1 space-y-1">
                        {F6_ZAKLJUCAK_STAVKE[1].opisi.map(opis => <p key={opis}>{opis}</p>)}
                    </div>
                    <textarea
                        className="w-full h-24 border border-gray-400 p-2 text-gray-900 focus:outline-none resize-y rounded disabled:opacity-100 disabled:text-gray-900"
                        value={data.f6_zakljucak?.tacka_2 || ''}
                        onChange={(e) => updateTacka('tacka_2', e.target.value)}
                        disabled={readOnly}
                    />
                </div>

                {/* 3 */}
                <div>
                    <div className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">
                        {F6_ZAKLJUCAK_STAVKE[2].naslov}
                    </div>
                    <div className="text-sm italic text-gray-700 mb-1 space-y-1">
                        {F6_ZAKLJUCAK_STAVKE[2].opisi.map(opis => <p key={opis}>{opis}</p>)}
                    </div>
                    <textarea
                        className="w-full h-24 border border-gray-400 p-2 text-gray-900 focus:outline-none resize-y rounded disabled:opacity-100 disabled:text-gray-900"
                        value={data.f6_zakljucak?.tacka_3 || ''}
                        onChange={(e) => updateTacka('tacka_3', e.target.value)}
                        disabled={readOnly}
                    />
                </div>

                {/* 4 */}
                <div>
                    <div className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">
                        {F6_ZAKLJUCAK_STAVKE[3].naslov}
                    </div>
                    <div className="text-sm italic text-gray-700 mb-1">
                        {F6_ZAKLJUCAK_STAVKE[3].opisi[0]}
                    </div>
                    <textarea
                        className="w-full h-24 border border-gray-400 p-2 text-gray-900 focus:outline-none resize-y rounded disabled:opacity-100 disabled:text-gray-900"
                        value={data.f6_zakljucak?.tacka_4 || ''}
                        onChange={(e) => updateTacka('tacka_4', e.target.value)}
                        disabled={readOnly}
                    />
                </div>

                {/* 5 */}
                <div>
                    <div className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">
                        {F6_ZAKLJUCAK_STAVKE[4].naslov}
                    </div>
                    <div className="text-sm italic text-gray-700 mb-1">
                        {F6_ZAKLJUCAK_STAVKE[4].opisi[0]}
                    </div>
                    <textarea
                        className="w-full h-24 border border-gray-400 p-2 text-gray-900 focus:outline-none resize-y rounded disabled:opacity-100 disabled:text-gray-900"
                        value={data.f6_zakljucak?.tacka_5 || ''}
                        onChange={(e) => updateTacka('tacka_5', e.target.value)}
                        disabled={readOnly}
                    />
                </div>

            </div>
        </div>
    );
}

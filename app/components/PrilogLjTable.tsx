"use client";
import React, { useState, useEffect, useMemo } from "react";
import { PrilogMData } from "../data/riskDataLoader";

interface PrilogLjTableProps {
    prilogMData: Map<string, PrilogMData>;
    procenaId: string;
    onUpdateOpis?: (itemId: string, opis: string) => void;
    readOnly?: boolean;
}

const SECTION_TITLES: { [key: string]: string } = {
    '1': 'ОПШТИХ ПОСЛОВНИХ АКТИВНОСТИ',
    '2': 'ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ',
    '3': 'ПРАВНИ РИЗИЦИ',
    '4': 'ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА',
    '5': 'ОД ПОЖАРА',
    '6': 'ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА',
    '7': 'ОД ЕКСПЛОЗИЈА',
    '8': 'ОД НЕУСАГЛАШЕНОСТИ СА СТАНДАРДИМА',
    '9': 'ПО ЖИВОТНУ СРЕДИНУ',
    '10': 'У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА',
    '11': 'У ОБЛАСТИ ИКТ СИСТЕМА'
};

export default function PrilogLjTable({ prilogMData, procenaId, onUpdateOpis, readOnly = false }: PrilogLjTableProps) {
    const [editingOpis, setEditingOpis] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [localOpisData, setLocalOpisData] = useState<Map<string, string>>(new Map());

    // Stabilno grupisanje podataka
    const sectionGroups = useMemo(() => {
        const groups = new Map<string, PrilogMData[]>();

        Array.from(prilogMData.values())
            .filter(item => item.velicinaOpasnosti !== null && item.velicinaOpasnosti > 0)
            .forEach(item => {
                const parts = item.id.split('.');
                const sectionId = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : item.id;

                if (!groups.has(sectionId)) {
                    groups.set(sectionId, []);
                }
                groups.get(sectionId)!.push(item);
            });

        return groups;
    }, [prilogMData]);

    // Učitaj opise iz Prilog Lj tabele
    useEffect(() => {
        async function loadPrilogLjData() {
            try {
                const response = await fetch(`/api/procena/${procenaId}/prilog-lj`);
                if (response.ok) {
                    const prilogLjData = await response.json();
                    const opisMap = new Map<string, string>();

                    prilogLjData.forEach((item: { sectionId: string; opisIdentifikovanihRizika: string }) => {
                        if (item.opisIdentifikovanihRizika) {
                            opisMap.set(item.sectionId, item.opisIdentifikovanihRizika);
                        }
                    });

                    setLocalOpisData(opisMap);
                }
            } catch (error) {
                console.error('Greška pri učitavanju Prilog Lj podataka:', error);
            }
        }

        if (sectionGroups.size > 0 && procenaId) {
            loadPrilogLjData();
        }
    }, [sectionGroups, procenaId]);

    const handleOpisClick = (itemId: string, currentOpis: string | null) => {
        if (readOnly) return; // Disable editing in read-only mode

        setEditingOpis(itemId);
        setEditValue(currentOpis || '');
    };

    const handleOpisBlur = (itemId: string) => {
        // Ažuriraj lokalno stanje odmah samo ako se vrednost promenila
        setLocalOpisData(prev => {
            const currentValue = prev.get(itemId);
            if (currentValue !== editValue) {
                return new Map(prev.set(itemId, editValue));
            }
            return prev;
        });

        if (onUpdateOpis && editValue.trim() !== '') {
            onUpdateOpis(itemId, editValue);
        }
        setEditingOpis(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, itemId: string) => {
        if (e.key === 'Enter') {
            handleOpisBlur(itemId);
        } else if (e.key === 'Escape') {
            setEditingOpis(null);
            setEditValue('');
        }
    };

    // Definišemo sve sekcije koje treba da se prikažu u Prilog Lj tabeli
    const allSections = useMemo(() => [
        { id: '1.1', name: 'Постојање правилника о организацији и систематизацији послова, ако има више од 10 запослених' },
        { id: '1.2', name: 'Постојање плана набавки/плана јавних набавки добара, радова и услуга са тачно утврђеним описима, роком реализације и финансијским износима' },
        { id: '1.3', name: 'Постојање ажурне свидењије о насталим штетама као последицама техничких ризика у пословању' },
        { id: '1.4', name: 'Постојање ажурне свидењије о насталим штетама као последицама финансијских ризика у пословању' },
        { id: '1.5', name: 'Постојање ажурне свидењије о насталим штетама као последицама физичких ризика у пословању' },
        { id: '1.6', name: 'Постојање ажурне свидењије о штетама насталим као последица противправног деловања' },
        { id: '2.1', name: 'Постојање организацијске и планске регулативе из области безбедности и здравља на радном месту и у радној средини' },
        { id: '2.2', name: 'Опремљеност одговарајућом заштитном опремом дефинисане актом о процени ризика на радном месту и у радној средини и евидентиране у прописаним обрасцима' },
        { id: '2.3', name: 'Оспособљеност људских ресурса за спровођење регулативе из области безбедности и здравља на радном месту и у радној средини и евидентиране у прописаним обрасцима' },
        { id: '2.4', name: 'Постојање система превентивних мера у складу са важећим законом' },
        { id: '2.5', name: 'Постојање редовних уплата обавезног доприноса за социјално осигурање, добровољног додатног пензијског осигурања, колективног комбинованог осигурања лица од последица несрећног случаја (незгоде) и тежих болести' },
        { id: '3.1', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне нормативне регулативе којом се уређује подношење и документа (пословне тајне, тајни подаци, подаци о личности и други осетљиви и поверљиви подаци)' },
        { id: '3.2', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности равноправних и организационих механизама заштите безбедности пословања од запослених и/или трећих лица' },
        { id: '3.3', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе којом се предвиђа надлежност у области надзора и контроле законитости пословања, поштовања интерних процедура од стране запослених и одговорних лица и спровођења мера за превенцију и поступање са ризиком' },
        { id: '3.4', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе и процедура за мониторинг, закључивање и реализације домаћих и међународних уговора и превенције настанка имовинске штете услед закључених неповољних пословних аранжмана' },
        { id: '3.5', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности унутрашњих механизама за праћење судских, управних и других спорова и поступака које покриснк води' },
        { id: '3.6', name: 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе којом се конституише адекватан систем унутрашње контроле над радом запослених и ангажованих лица задужених за физичку и техничку заштиту лица, имовине и континуитета пословања' },
        { id: '3.7', name: 'Постојање могућности наступања негативних последица на основу: постојања неадекватних, непотпуних или противречних закона и осталих прописа који, сами по себи или у вези са једним или другим, прозрокују тешкоће у погледу законитог функционисања организације и безбедности њеног пословања' },
        { id: '4.1', name: 'Постојање могућности да организација постане објект: имовинског криминалитета' },
        { id: '4.2', name: 'Постојање могућности да организација постане објект: насилничког криминалитета и тешких прекршаја против јавног реда и мира' },
        { id: '4.3', name: 'Постојање могућности да организација постане објект: политичког криминалитета (подразумева кривичну делатност која је непосредно повезана са политичким системом или политичким процесима, а укључује злоупотребу политичке моћи, корупцију, изборне превере, интимидације опозиције, политичка убиства и друге кривичне активности које се користе за освајање или задржавање политичке власти, а у одређеним случајевима обухвата и тероризам)' },
        { id: '4.4', name: 'Постојање могућности да организација постане објект: привредног криминалитета и привредних преступа и прекршаја везаних за привредно и финансијско пословање' },
        { id: '4.5', name: 'Постојање могућности да организација постане објект: корупције и других облика злоупотребе службеног положаја или положаја одговорног лица' },
        { id: '4.6', name: 'Постојање могућности да организација постане објект: других кривичних дела, прирпедних преступа и прекршаја чије је извршење у високом степену вероватно услед природе делатности или других околности везаних за пословање организације (попут високотехнолошког и еколошког криминала и криминала повезаног са повредама ауторских и сродних права)' },
        { id: '5.1', name: 'Постојање нормативних аката у складу са правном регулативом (правилник о заштити од пожара, односно правила о заштити од пожара, план заштите од пожара објекта или подручја)' },
        { id: '5.2', name: 'Постојање категоризације правног лица и организовање у складу са проценом угрожености у складу са прописима' },
        { id: '5.3', name: 'Постојање кадровске и техничке попуњености и квалификованост служе које ради на пословима заштите од пожара у складу са прописима' },
        { id: '5.4', name: 'Постојање и одржавање уређаја, опреме, инсталација и средстава за заштиту од пожара према Закону о заштити од пожара, техничким прописима и упутству произвођача опреме' },
        { id: '5.5', name: 'Постојање програма основне обуке и свидењија обуке запослених из области заштите од пожара' },
        { id: '5.6', name: 'Постојање свидењија о надзору противпожарне инспекције и постојање наложених мера заштите од пожара' },
        { id: '6.1', name: 'Постојање планске документације у области смањења ризика и управљања ванредним ситуацијама у складу са захтевима важећег закона (процена ризика од катастрофа, план заштите и спасавања у ванредним ситуацијама, план смањења ризика од катастрофа, секторни план заштите од великог удеса и план заштите од удеса, ако се доноси)' },
        { id: '6.2', name: 'Постојање оспособљености за поступање у ванредним ситуацијама' },
        { id: '6.3', name: 'Постојање опремљености за поступање у ванредним ситуацијама' },
        { id: '6.4', name: 'Постојање успостављеног система раног упозорења, обавештавања и узбуњивања' },
        { id: '7.1', name: 'Постојање нормативних аката и дозвола за рад са одређеним врстама експлозивних материјала (течним, чврстим, гасовитим) у складу са правном регулативом' },
        { id: '7.2', name: 'Постојање нормативних аката у складу са правном регулативом за заштиту од пожара објеката и/или подручја (и другим нормативима којима се уређује ова област)' },
        { id: '7.3', name: 'Постојање категоризације правног лица и организовање у складу са проценом угрожености и правном регулативом' },
        { id: '7.4', name: 'Постојање кадровске и техничке испуњености и квалификованост запослених који раде на пословима заштите од експлозије и руковања експлозивним материјама у складу са правном регулативом' },
        { id: '7.5', name: 'Постојање и одржавање уређаја, опреме, инсталација и средстава за заштиту од експлозије према релевантним законима и техничким прописима, нормативима и упутствима произвођача опреме' },
        { id: '7.6', name: 'Постојање програма основне обуке и свидењија обуке запослених из области заштите од експлозије и руковања експлозивним материјама' },
        { id: '7.7', name: 'Постојање свидењија о надзору државне инспекције и наложених мера заштите од експлозије' },
        { id: '8.1', name: 'SRPS A.L2.002, Друштвена безбедност – Услуге приватног обезбеђења – Захтеви и упутство за оцењивање усаглашености' },
        { id: '8.2', name: 'SRPS ISO/IEC 27001, Безбедност информација, сајбер безбедност и заштита приватности – Системи менаџмента безбедности информација – Захтеви' },
        { id: '8.3', name: 'SRPS ISO 22320, Безбедност и отпорност – Менаџмент ванредним ситуацијама – Смернице за менаџмент инцидентима' },
        { id: '8.4', name: 'SRPS EN 17483-2, Услуге приватног обезбеђења – Заштита критичне инфраструктуре – Део 2: Услуге обезбеђења у ваздухопловству и на аеродромима' },
        { id: '8.5', name: 'SRPS EN 17483-3, Услуге приватног обезбеђења – Заштита критичне инфраструктуре – Део 3: Услуге обезбеђења у поморству и лукама' },
        { id: '8.6', name: 'SRPS ISO 18788, Системи менаџмента услугама приватног обезбеђења – Захтеви са упутством за коришћење' },
        { id: '8.7', name: 'SRPS ISO 28000:2022, Безбедност и отпорност – Системи менаџмента безбедношћу – Захтеви' },
        { id: '8.8', name: 'SRPS ISO 22301, Безбедност и отпорност – Системи менаџмента континуитетом пословања – Захтеви' },
        { id: '8.9', name: 'SRPS ISO 9001, Системи менаџмента квалитетом – Захтеви' },
        { id: '9.1', name: 'Постојање извештаја о безбедности са свим неопходним елементима, план у случају удеса и да ли је примењена релевантна правна регулатива у области заштите животне средине' },
        { id: '9.2', name: 'Постојање доказа о оспособљености запослених за реаговање у случају удеса, периодична провера оспособљености запослених, одговорних лица и адекватна опремљеност одговорним опремом за реаговање у ванредним ситуацијама или еколошким инцидентима' },
        { id: '9.3', name: 'Постојање утврђеног нивоа биохазардног потенцијала коришћене технологије' },
        { id: '9.4', name: 'Постојање надзора и директне комуникације са одговорним лицима у државним службама за реаговање у ванредним ситуацијама или еколошким инцидентима' },
        { id: '10.1', name: 'Постојање политике управљања људским ресурсима уређена интерном нормативном регулативом' },
        { id: '10.2', name: 'Постојање стандардизованих критеријума и интерне процедуре за регрутацију, селекцију и класификацију запослених' },
        { id: '10.3', name: 'Постојање процедуре за адаптацију, развој и евалуацију запослених' },
        { id: '10.4', name: 'Постојање функционалног, безбедног и инклузивног радног места и окружења' },
        { id: '10.5', name: 'Постојање планова за обуке, стицање знања и развој запослених' },
        { id: '10.6', name: 'Постојање планирања људских ресурса и организационих промена, као и идентификације кључних запослених' },
        { id: '11.1', name: 'Постојање потпуног и адекватног документа сходно законској регулативи' },
        { id: '11.2', name: 'Постојање урађене процене ризика ИКТ система и идентификованих свих законом предвиђених мера заштите ИКТ система' },
        { id: '11.3', name: 'Постојање процедура на који начин организација врши обавештавање о инцидентима и да ли је одређено лице за управљање инцидентима' },
        { id: '11.4', name: 'Постојање одређеног лица за послове информационе безбедности и/или ангажовање спољних експерата и да ли је организација урадила ревизију докумената сходно законској регулативи' },
        { id: '11.5', name: 'Постојање интерних процедура рада и мера безбедности у ИКТ систему које регулишу забрану коришћења приватних налога е-поште, инсталирање приватних апликација и забрану приступа друштвеним мрежама' }
    ], []);

    // Kreiraj reprezentativne stavke kombinujući sve sekcije sa podacima iz sectionGroups
    const prilogMItems = useMemo(() => {
        return allSections.map(section => {
            const items = sectionGroups.get(section.id) || [];

            if (items.length > 0) {
                // Ako postoje procenjeni podaci za ovu sekciju
                const avgVO = Math.round(
                    items.reduce((sum, item) => sum + (item.velicinaOpasnosti || 0), 0) / items.length
                );

                const representativeItem = { ...items[0] };
                representativeItem.id = section.id;
                representativeItem.velicinaOpasnosti = avgVO;
                representativeItem.requirement = section.name;
                return representativeItem;
            } else {
                // Ako nema procenjenih podataka, kreiraj prazan item
                return {
                    id: section.id,
                    groupId: 'default',
                    requirement: section.name,
                    velicinaOpasnosti: null,
                    izlozenost: null,
                    ranjivost: null,
                    verovatnoca: null,
                    posledice: null,
                    steta: null,
                    kriticnost: null,
                    nivoRizika: null,
                    kategorijaRizika: null,
                    prihvatljivost: null,
                    opisIdentifikovanihRizika: null
                } as PrilogMData;
            }
        });
    }, [sectionGroups, allSections]);

    return (
        <div className="p-6 bg-white border-2 border-gray-800 rounded-lg mt-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Прилог Љ</h2>
                <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2">
                    Образац за идентификацију ризика и величина опасности
                </h3>
                <p className="text-xs text-gray-500 text-right">Образац SRPS A.L2.003/1</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '40px' }}>
                                1
                            </th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '60%' }}>
                                2
                            </th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '80px' }}>
                                Величина<br />опасности
                            </th>
                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ width: '120px' }}>
                                ОПИС<br />ИДЕНТИФИКОВАНИХ<br />РИЗИКА
                            </th>
                        </tr>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600"></th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">
                                ЗАХТЕВИ ЗА ПРОЦЕНУ РИЗИКА
                            </th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">3</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prilogMItems.map((item, index) => {
                            const sectionId = item.id.split('.')[0];
                            const prevSectionId = index > 0 ? prilogMItems[index - 1].id.split('.')[0] : null;
                            const isNewSection = sectionId !== prevSectionId;

                            return (
                                <React.Fragment key={item.id}>
                                    {isNewSection && SECTION_TITLES[sectionId] && (
                                        <tr className="bg-gray-300">
                                            <td className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800">
                                                {sectionId}
                                            </td>
                                            <td className="border border-gray-800 px-2 py-2 font-bold text-gray-800 text-xs" colSpan={3}>
                                                {SECTION_TITLES[sectionId]}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-800 px-2 py-2 text-center font-medium text-gray-800">
                                            {item.id}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-800 align-top">
                                            {item.requirement || 'Захтев за процену ризика'}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-center">
                                            {item.velicinaOpasnosti !== null && item.velicinaOpasnosti > 0 ? (
                                                <span className={`inline-block w-8 h-8 rounded-full text-white font-bold text-xs leading-8 ${item.velicinaOpasnosti >= 4 ? 'bg-red-600' :
                                                    item.velicinaOpasnosti === 3 ? 'bg-yellow-600' :
                                                        item.velicinaOpasnosti === 2 ? 'bg-blue-600' :
                                                            'bg-green-600'
                                                    }`}>
                                                    {item.velicinaOpasnosti}
                                                </span>
                                            ) : (
                                                <span className="inline-block w-8 h-8 rounded-full bg-gray-300 text-gray-600 font-bold text-xs leading-8">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-600">
                                            {editingOpis === item.id ? (
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleOpisBlur(item.id)}
                                                    onKeyDown={(e) => handleKeyPress(e, item.id)}
                                                    className="w-full h-20 text-xs border border-blue-500 rounded p-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    placeholder="Унесите опис идентификованих ризика..."
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className={`min-h-[20px] p-1 rounded ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50'}`}
                                                    onClick={() => handleOpisClick(item.id, localOpisData.get(item.id) || item.opisIdentifikovanihRizika || null)}
                                                    title={readOnly ? 'Режим прегледа - измене нису дозвољене' : 'Кликните да унесете опис идентификованих ризика'}
                                                >
                                                    {localOpisData.get(item.id) || item.opisIdentifikovanihRizika || (
                                                        <span className="text-gray-400 italic">Кликните да унесете опис...</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
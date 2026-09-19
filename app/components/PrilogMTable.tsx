"use client";
import React, { useState } from "react";
import { PrilogMData, AgregatniRedM, aggregatePrilogMPoNivoima } from "../data/riskDataLoader";
import Image from "next/image";

interface PrilogMTableProps {
    prilogMData: Map<string, PrilogMData>;
    onShowDetails: (item: PrilogMData) => void;
    onUpdateItem?: (itemId: string, field: 'posledice' | 'steta', value: number) => void;
    readOnly?: boolean;
}

export default function PrilogMTable({ prilogMData, onShowDetails, onUpdateItem, readOnly = false }: PrilogMTableProps) {
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [showImageModal, setShowImageModal] = useState<string | null>(null);

    // Mapiranje kolona na slike
    const columnImages: { [key: string]: { src: string; title: string } } = {
        'vo': { src: '/images/vo-scale.png', title: 'Величина опасности - скала вредности' },
        'izl': { src: '/images/izl-scale.png', title: 'Изложеност - скала вредности' },
        'ranj': { src: '/images/ranj-scale.png', title: 'Рањивост - скала вредности' },
        'ver': { src: '/images/ver-scale.png', title: 'Вероватноћа - скала вредности' },
        'posl': { src: '/images/posl-scale.png', title: 'Последице - скала вредности' },
        'stet': { src: '/images/stet-scale.png', title: 'Штета - скала вредности' },
        'krit': { src: '/images/krit-scale.png', title: 'Критичност - скала вредности' },
        'nivo': { src: '/images/nivo-scale.png', title: 'Ниво ризика - скала вредности' },
        'kat': { src: '/images/kat-scale.png', title: 'Категорија ризика - скала вредности' },
        'prihv': { src: '/images/prihv-scale.png', title: 'Прихватљивост - скала вредности' }
    };

    // Mapiranje sekcija na osnovu ID-jeva
    const getSectionInfo = (id: string) => {
        const majorSection = id.split('.')[0];
        const sectionMap: { [key: string]: { number: string; title: string } } = {
            '1': { number: '1', title: 'ОПШТИХ ПОСЛОВНИХ АКТИВНОСТИ' },
            '2': { number: '2', title: 'ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ' },
            '3': { number: '3', title: 'ПРАВНИ РИЗИЦИ' },
            '4': { number: '4', title: 'ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА' },
            '5': { number: '5', title: 'ОД ПОЖАРА' },
            '6': { number: '6', title: 'ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА' },
            '7': { number: '7', title: 'ОД ЕКСПЛОЗИЈА' },
            '8': { number: '8', title: 'ОД НЕУСАГЛАШЕНОСТИ СА СТАНДАРДИМА' },
            '9': { number: '9', title: 'ПО ЖИВОТНУ СРЕДИНУ' },
            '10': { number: '10', title: 'У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА' },
            '11': { number: '11', title: 'У ОБЛАСТИ ИКТ СИСТЕМА' }
        };
        return sectionMap[majorSection] || null;
    };

    // Funkcija za dobijanje naziva podsekcije iz podataka o grupama
    const getSubsectionTitle = (subsectionId: string) => {
        // Nazivi podsekcija prema slikama
        const subsectionTitles: { [key: string]: string } = {
            // Sekcija 1 - ОПШТИХ ПОСЛОВНИХ АКТИВНОСТИ
            '1.1': 'Постојање правилника о организацији и систематизацији послова, ако има више од 10 запослених',
            '1.2': 'Постојање плана набавки/плана јавних набавки добара, радова и услуга са тачно утврђеним описима, роком реализације и финансијским износима',
            '1.3': 'Постојање ажурне евиденције о насталим штетама као последицама техничких ризика у пословању',
            '1.4': 'Постојање ажурне евиденције о насталим штетама као последицама финансијских ризика у пословању',
            '1.5': 'Постојање ажурне евиденције о насталим штетама као последицама физичких ризика у пословању',
            '1.6': 'Постојање ажурне евиденције о штетама насталим као последица противправног деловања',

            // Sekcija 2 - ПО БЕЗБЕДНОСТ И ЗДРАВЉЕ НА РАДУ
            '2.1': 'Постојање организацијске и планске регулативе из области безбедности и здравља на радном месту и у радној средини',
            '2.2': 'Опремљеност одговарајућом заштитном опремом дефинисана актом о процени ризика на радном месту и у радној средини и евидентирана у прописаним обрасцима',
            '2.3': 'Оспособљеност људских ресурса за спровођење регулативе из области безбедности и здравља на радном месту и у радној средини и евидентирану у прописаним обрасцима',
            '2.4': 'Постојање система превентивних мера у складу са важећим законом',
            '2.5': 'Постојање редовних уплата обавезног доприноса за социјално осигурање, добровољног додатног пензијског осигурања, колективног комбинованог осигурања лица од последица несрећног случаја (незгоде) и тежих болести',

            // Sekcija 3 - ПРАВНИ РИЗИЦИ
            '3.1': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне нормативне регулативе којом се штите подаци и документа (пословне тајне, тајни подаци, подаци о личности и други осетљиви и поверљиви подаци)',
            '3.2': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности равноправних и организационих механизама заштите безбедности пословања од запослених и/или трећих лица',
            '3.3': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе којом се предвиђа надлежност у области надзора и контроле законитости пословања, поштовања интерних процедура од стране запослених и одговорних лица и спровођења мера за превенцију и поступање са ризиком',
            '3.4': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе и процедура за мониторинг, закључивања и реализације домаћих и међународних уговора и превенције настанка имовинске штете услед закључења неповољних пословних аранжмана',
            '3.5': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности унутрашњих механизама за праћење судских, управних и других спорова и поступака које корисник води',
            '3.6': 'Постојање могућности наступања негативних последица на основу: постојања, потпуности и адекватности интерне регулативе којом се конституише адекватан систем унутрашње контроле над радом запослених и ангажованих лица/организација задужених за физичку и техничку заштиту лица, имовине и континуитета пословања',
            '3.7': 'Постојање могућности наступања негативних последица на основу: постојања неадекватних, непотпуних или противречних закона и осталих прописа који, сами по себи или у вези један са другим, проузрокују тешкоће у погледу законитог функционисања организације и безбедности њеног пословања',

            // Sekcija 4 - ОД ПРОТИВПРАВНОГ ДЕЛОВАЊА
            '4.1': 'Постојање могућности да организација постане објект: имовинског криминалитета',
            '4.2': 'Постојање могућности да организација постане објект: насилничког криминалитета и тежих прекршаја против јавног реда и мира',
            '4.3': 'Постојање могућности да организација постане објект: политичког криминалитета (подразумева кривичну делатност која је директно повезана са политичким системом или политичким процесима, а укључује злоупотребу политичке моћи, корупцију, изборне преваре, игнорисање опозиције, политичка убиства и друге кривичне активности које се користе за освајање или задржавање политичке власти, а у одређеним случајевима обухвата и тероризам)',
            '4.4': 'Постојање могућности да организација постане објект: привредног криминалитета и привредних преступа и прекршаја везаних за привредно и финансијско пословање',
            '4.5': 'Постојање могућности да организација постане објект: корупције и других облика злоупотребе службеног положаја или положаја одговорног лица',
            '4.6': 'Постојање могућности да организација постане објект: других кривичних дела, привредних преступа и прекршаја чије је извршење у високом степену вероватно услед природе делатности или других околности везаних за пословање организације (попут високотехнолошког и еколошког криминала и криминала повезаног са повредама ауторских и сродних права)',

            // Sekcija 5 - ОД ПОЖАРА
            '5.1': 'Постојање нормативних аката у складу са правном регулативом (правилник о заштити од пожара, односно правила заштите од пожара, план заштите од пожара објекта или подручја)',
            '5.2': 'Постојање категоризације правног лица и организовање у складу са проценом угрожености у складу са прописима',
            '5.3': 'Постојање кадровске и техничке попуњености и квалификованост људства које ради на пословима заштите од пожара у складу са прописима',
            '5.4': 'Постојање и одржавање уређаја, опреме, инсталација и средстава за заштиту од пожара према Закону о заштити од пожара, техничким прописима и упутству произвођача опреме',
            '5.5': 'Постојање програма основне обуке и евиденција обуке запослених из области заштите од пожара',
            '5.6': 'Постојање евиденција о надзору противпожарне инспекције и постојање наложених мера заштите од пожара',

            // Sekcija 6 - ОД ЕЛЕМЕНТАРНИХ НЕПОГОДА И ДРУГИХ НЕСРЕЋА
            '6.1': 'Постојање планске документације у области смањења ризика и управљања ванредним ситуацијама у складу са захтевима важећег закона (процена ризика од катастрофа, план заштите и спасавања у ванредним ситуацијама, план смањења ризика од катастрофа, екстерни план заштите од великог удеса и план заштите од удеса, ако се доноси)',
            '6.2': 'Постојање оспособљености за поступање у ванредним ситуацијама',
            '6.3': 'Постојање опремљености за поступање у ванредним ситуацијама',
            '6.4': 'Постојање успостављеног система раног упозорења, обавештавања и узбуњивања',

            // Sekcija 7 - ОД ЕКСПЛОЗИЈА
            '7.1': 'Постојање нормативних аката и дозвола за рад са одређеним врстама експлозивних материјала (течним, чврстим, гасовитим) у складу са правном регулативом',
            '7.2': 'Постојање нормативних аката у складу са правном регулативом за заштиту од пожара објеката и/или подручја (и другим нормативима којима се уређује ова област)',
            '7.3': 'Постојање категоризације правног лица и организовања у складу са проценом угрожености и правном регулативом',
            '7.4': 'Постојање кадровске и техничке испуњености и квалификованости запослених који раде на пословима заштите од експлозије и рукују експлозивним материјама у складу са правном регулативом',
            '7.5': 'Постојање и одржавање уређаја, опреме, инсталација и средстава за заштиту од експлозије према релевантним законима и техничким прописима, нормативима и упутствима произвођача опреме',
            '7.6': 'Постојање програма основне обуке и евиденција обуке запослених из области заштите од експлозија и руковања експлозивним материјама',
            '7.7': 'Постојање евиденција о надзору државне инспекције и наложених мера заштите од експлозије',

            // Sekcija 8 - ОД НЕУСАГЛАШЕНОСТИ СА СТАНДАРДИМА
            '8.1': 'SRPS A.L2.002, Друштвена безбедност – Услуге приватног обезбеђења – Захтеви и упутство за оцењивање усаглашености',
            '8.2': 'SRPS ISO/IEC 27001, Безбедност информација, сајбер безбедност и заштита приватности – Системи менаџмента безбедношћу информација – Захтеви',
            '8.3': 'SRPS ISO 22320, Безбедност и отпорност – Менаџмент ванредним ситуацијама – Смернице за менаџмент инцидентима',
            '8.4': 'SRPS EN 17483-2, Услуге приватног обезбеђења – Заштита критичне инфраструктуре – Део 2: Услуге обезбеђења у ваздухопловству и на аеродромима',
            '8.5': 'SRPS EN 17483-3, Услуге приватног обезбеђења – Заштита критичне инфраструктуре – Део 3: Услуге обезбеђења у поморству и лукама',
            '8.6': 'SRPS ISO 18788, Систем менаџмента услугама приватног обезбеђења – Захтеви са упутством за коришћење',
            '8.7': 'SRPS ISO 28000:2022, Безбедност и отпорност – Систем менаџмента безбедношћу – Захтеви',
            '8.8': 'SRPS ISO 22301, Безбедност и отпорност – Системи менаџмента континуитетом пословања – Захтеви',
            '8.9': 'SRPS ISO 9001, Системи менаџмента квалитетом – Захтеви',

            // Sekcija 9 - ПО ЖИВОТНУ СРЕДИНУ
            '9.1': 'Постојање извештаја о безбедности са свим неопходним елементима, план у случају удеса и да ли је примењена релевантна правна регулатива у области заштите животне средине',
            '9.2': 'Постојање доказа о оспособљености запослених за реаговање у случају удеса, периодична провера оспособљености запослених, одговорних лица и адекватна опремљеност одговарајућом опремом за реаговање у ванредним ситуацијама или еколошким инцидентима',
            '9.3': 'Постојање утврђеног нивоа биохазардног потенцијала коришћене технологије',
            '9.4': 'Постојање надзора и директне комуникације са одговорним лицима у државним службама за реаговање у ванредним ситуацијама или еколошким инцидентима',

            // Sekcija 10 - У УПРАВЉАЊУ ЉУДСКИМ РЕСУРСИМА
            '10.1': 'Постојање политике управљања људским ресурсима уређене интерном нормативном регулативом',
            '10.2': 'Постојање стандардизованих критеријума и интерне процедуре за регрутацију, селекцију и класификацију запослених',
            '10.3': 'Постојање процедуре за адаптацију, развој и евалуацију запослених',
            '10.4': 'Постојање функционалног, безбедног и инклузивног радног места и окружења',
            '10.5': 'Постојање планова за обуке, стицање знања и развој запослених',
            '10.6': 'Постојање планирања људских ресурса и организационих промена, као и идентификације кључних запослених',

            // Sekcija 11 - У ОБЛАСТИ ИКТ СИСТЕМА
            '11.1': 'Постојање потпуног и адекватног документа сходно законској регулативи',
            '11.2': 'Постојање урађене процене ризика ИКТ система и идентификованих свих законом предвиђених мера заштите ИКТ система',
            '11.3': 'Постојање процедура на који начин организација врши обавештавање о инцидентима и да ли је одређено лице за управљање инцидентима',
            '11.4': 'Постојање одређеног лица за послове информационе безбедности и/или ангажовање спољних експерата и да ли је организација урадила ревизију документа сходно законској регулативи',
            '11.5': 'Постојање интерних процедура рада и мера безбедности у ИКТ систему које регулишу забрану коришћења приватних налога е-поште, инсталирање приватних апликација и забрану приступа друштвеним мрежама'
        };
        return subsectionTitles[subsectionId] || null;
    };

    if (prilogMData.size === 0) {
        return null;
    }

    const handleCellClick = (itemId: string, field: 'posledice' | 'steta', currentValue: number | null) => {
        if (readOnly) return; // Disable editing in read-only mode

        const cellKey = `${itemId}-${field}`;
        setEditingCell(cellKey);
        setEditValue(currentValue?.toString() || '');
    };

    const handleInputChange = (value: string) => {
        // Dozvoli samo brojeve 1-5
        if (value === '' || (/^[1-5]$/.test(value))) {
            setEditValue(value);
        }
    };

    const handleInputBlur = (itemId: string, field: 'posledice' | 'steta') => {
        const numValue = parseInt(editValue);
        if (numValue >= 1 && numValue <= 5 && onUpdateItem) {
            onUpdateItem(itemId, field, numValue);
        }
        setEditingCell(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, itemId: string, field: 'posledice' | 'steta') => {
        if (e.key === 'Enter') {
            handleInputBlur(itemId, field);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditValue('');
        }
    };

    // Agregatne vrednosti po faktorima (npr. 1.1), grupama rizika i za organizaciju (Prilog M, kol. 4-12)
    const agregati = aggregatePrilogMPoNivoima(Array.from(prilogMData.values()));

    const krugBoja = (vrednost: number) =>
        vrednost >= 4 ? 'bg-red-600' : vrednost === 3 ? 'bg-yellow-600' : vrednost === 2 ? 'bg-blue-600' : 'bg-green-600';
    const nivoBoja = (nivo: number) =>
        nivo >= 20 ? 'bg-red-700' : nivo >= 15 ? 'bg-red-600' : nivo >= 10 ? 'bg-orange-600' : nivo >= 6 ? 'bg-yellow-600' : 'bg-green-600';
    const kategorijaBoja = (kategorija: number) =>
        kategorija === 1 ? 'bg-red-700' : kategorija === 2 ? 'bg-orange-600' : kategorija === 3 ? 'bg-yellow-600' : kategorija === 4 ? 'bg-blue-600' : 'bg-green-600';

    const krug = (vrednost: number) => (
        <td className="border border-gray-800 px-1 py-2 text-center">
            <span className={`inline-block w-6 h-6 rounded-full text-white font-bold text-xs leading-6 ${krugBoja(vrednost)}`}>
                {vrednost}
            </span>
        </td>
    );

    // Kolone 3-12 i kolona "Детаљи" za agregatni red
    const agregatneCelije = (agregat: AgregatniRedM | undefined, oznaka: string) => agregat ? (
        <>
            {krug(agregat.velicinaOpasnosti)}
            {krug(agregat.izlozenost)}
            {krug(agregat.ranjivost)}
            {krug(agregat.verovatnoca)}
            {krug(agregat.steta)}
            {krug(agregat.kriticnost)}
            {krug(agregat.posledice)}
            <td className="border border-gray-800 px-1 py-2 text-center">
                <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${nivoBoja(agregat.nivoRizika)}`}>
                    {agregat.nivoRizika}
                </span>
            </td>
            <td className="border border-gray-800 px-1 py-2 text-center">
                <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${kategorijaBoja(agregat.kategorijaRizika)}`}>
                    {agregat.kategorijaRizika}
                </span>
            </td>
            <td className="border border-gray-800 px-1 py-2 text-center">
                <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${agregat.prihvatljivost === 'NEPRIHVATLJIV' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {agregat.prihvatljivost === 'NEPRIHVATLJIV' ? 'NE' : 'DA'}
                </span>
            </td>
            <td className="border border-gray-800 px-1 py-2 text-center">
                <span className="text-gray-600 text-xs">{oznaka}</span>
            </td>
        </>
    ) : (
        <td className="border border-gray-800 px-1 py-2 text-center text-gray-500 text-xs" colSpan={11}>
            Нема података
        </td>
    );

    // Ćelija kolone 7 (šteta) ili 9 (posledice) koja se može ručno izmeniti
    const izmenljivaCelija = (item: PrilogMData, field: 'posledice' | 'steta') => (
        <td className="border border-gray-800 px-1 py-2 text-center">
            {editingCell === `${item.id}-${field}` ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={() => handleInputBlur(item.id, field)}
                    onKeyDown={(e) => handleKeyPress(e, item.id, field)}
                    className="w-6 h-6 text-center text-xs border-2 border-blue-500 rounded bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
                    maxLength={1}
                    autoFocus
                />
            ) : (
                <span
                    className={`inline-block w-6 h-6 rounded-full text-white font-bold text-xs leading-6 ${readOnly ? '' : 'cursor-pointer hover:opacity-80'} ${krugBoja(item[field] || 0)}`}
                    onClick={() => handleCellClick(item.id, field, item[field])}
                    title={readOnly ? 'Режим прегледа - измене нису дозвољене' : 'Кликните да измените вредност (1-5)'}
                >
                    {item[field] || 0}
                </span>
            )}
        </td>
    );

    return (
        <div className="p-6 bg-white border-2 border-gray-800 rounded-lg">
            <h2 className="font-bold text-gray-800 mb-6 text-center text-lg">
                Прилoг М
            </h2>
            <h4 className="font-bold text-gray-800 mb-6 text-center text-lg">
                НИВО АГРЕГАТНОГ РИЗИКА, КАТЕГОРИЈА И ПРИХВАТЉИВОСТИ РИЗИКА
            </h4>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '60px' }}>
                                Р.<br />бр.
                            </th>

                            <th className="border border-gray-800 px-2 py-2 text-center font-bold text-gray-800" style={{ minWidth: '200px' }}>
                                ЗАХТЕВИ ЗА ПРОЦЕНУ РИЗИКА
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('vo')}
                                title="Кликните да видите скалу вредности"
                            >
                                Сво
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('izl')}
                                title="Кликните да видите скалу вредности"
                            >
                                Изл.
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('ranj')}
                                title="Кликните да видите скалу вредности"
                            >
                                Рањ.
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('ver')}
                                title="Кликните да видите скалу вредности"
                            >
                                Вер.
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('stet')}
                                title="Кликните да видите скалу вредности"
                            >
                                Штете
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('krit')}
                                title="Кликните да видите скалу вредности"
                            >
                                Критичност
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '50px' }}
                                onClick={() => setShowImageModal('posl')}
                                title="Кликните да видите скалу вредности"
                            >
                                Последице
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '60px' }}
                                onClick={() => setShowImageModal('nivo')}
                                title="Кликните да видите скалу вредности"
                            >
                                Ниво<br />риз.
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '70px' }}
                                onClick={() => setShowImageModal('kat')}
                                title="Кликните да видите скалу вредности"
                            >
                                Кат.<br />риз.
                            </th>
                            <th
                                className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                style={{ width: '80px' }}
                                onClick={() => setShowImageModal('prihv')}
                                title="Кликните да видите скалу вредности"
                            >
                                Прихв.
                            </th>
                            <th className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800" style={{ width: '60px' }}>
                                Детаљи
                            </th>
                        </tr>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">1</th>

                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">2</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">3</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">4</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">5</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">6</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">7</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">8</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">9</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">10</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">11</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">12</th>
                            <th className="border border-gray-800 px-1 py-1 text-center text-xs font-medium text-gray-600">13</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(prilogMData.values())
                            .sort((a, b) => {
                                // Natural sort for IDs like 1.1.1, 1.1.2, 1.2.1, etc.
                                const aParts = a.id.split('.').map(Number);
                                const bParts = b.id.split('.').map(Number);

                                for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                                    const aVal = aParts[i] || 0;
                                    const bVal = bParts[i] || 0;
                                    if (aVal !== bVal) {
                                        return aVal - bVal;
                                    }
                                }
                                return 0;
                            })
                            .reduce((acc, item, index, sortedArray) => {
                                const currentSection = getSectionInfo(item.id);
                                const prevItem = index > 0 ? sortedArray[index - 1] : null;
                                const prevSection = prevItem ? getSectionInfo(prevItem.id) : null;

                                // Red grupe rizika sa agregatnim (prosečnim) vrednostima grupe
                                if (currentSection && (!prevSection || prevSection.number !== currentSection.number)) {
                                    acc.push(
                                        <tr key={`section-${currentSection.number}`} className="bg-gray-300">
                                            <td className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-900 text-xs">
                                                {currentSection.number}
                                            </td>
                                            <td className="border border-gray-800 px-2 py-2 font-bold text-gray-900 text-xs text-left">
                                                {currentSection.title}
                                            </td>
                                            {agregatneCelije(agregati.grupe.get(parseInt(currentSection.number)), 'AVG')}
                                        </tr>
                                    );
                                }

                                // Red faktora rizika (npr. 1.1) sa agregatnim vrednostima njegovih stavki
                                const currentSubsection = item.id.split('.').slice(0, 2).join('.'); // npr. "1.1"
                                const prevSubsection = prevItem ? prevItem.id.split('.').slice(0, 2).join('.') : null;

                                if (currentSubsection !== prevSubsection && item.id.split('.').length > 2) {
                                    const subsectionTitle = getSubsectionTitle(currentSubsection) || 'Подсекција';

                                    acc.push(
                                        <tr key={`subsection-${currentSubsection}`} className="bg-gray-200">
                                            <td className="border border-gray-800 px-1 py-2 text-center font-bold text-gray-800 text-xs">
                                                {currentSubsection}
                                            </td>
                                            <td className="border border-gray-800 px-2 py-2 font-bold text-gray-800 text-xs">
                                                {subsectionTitle}
                                            </td>
                                            {agregatneCelije(agregati.faktori.get(currentSubsection), 'AVG')}
                                        </tr>
                                    );
                                }

                                // Red sa podacima: kol. 7 Штете, kol. 8 Критичност, kol. 9 Последице (Izmena 1)
                                acc.push(
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-800 px-1 py-2 text-center font-medium text-gray-800 text-xs">
                                            {item.id}
                                        </td>

                                        <td className="border border-gray-800 px-2 py-2 text-xs text-gray-800 align-top">
                                            {item.requirement || 'Захтев за процену ризика'}
                                        </td>
                                        {krug(item.velicinaOpasnosti || 0)}
                                        {krug(item.izlozenost || 0)}
                                        {krug(item.ranjivost || 0)}
                                        {krug(item.verovatnoca || 0)}
                                        {izmenljivaCelija(item, 'steta')}
                                        {krug(item.kriticnost || 0)}
                                        {izmenljivaCelija(item, 'posledice')}
                                        <td className="border border-gray-800 px-1 py-2 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${nivoBoja(item.nivoRizika || 0)}`}>
                                                {item.nivoRizika || 0}
                                            </span>
                                        </td>
                                        <td className="border border-gray-800 px-1 py-2 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${kategorijaBoja(item.kategorijaRizika || 5)}`}>
                                                {item.kategorijaRizika || 5}
                                            </span>
                                        </td>
                                        <td className="border border-gray-800 px-1 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${item.prihvatljivost === 'NEPRIHVATLJIV' ? 'bg-red-600' : 'bg-green-600'
                                                    }`}>
                                                    {item.prihvatljivost === 'NEPRIHVATLJIV' ? 'NE' : 'DA'}
                                                </span>
                                                {item.usingDefaultFinancialData && (
                                                    <span className="text-orange-600 text-xs mt-1" title="Koriste se default finansijski podaci - rezultat može biti netačan">
                                                        ⚠️
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-gray-800 px-1 py-2 text-center">
                                            <button
                                                onClick={() => onShowDetails(item)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                                                title="Prikaži detaljne kalkulacije"
                                            >
                                                📊
                                            </button>
                                        </td>
                                    </tr>
                                );

                                return acc;
                            }, [] as React.ReactElement[])
                            .concat([
                                <tr key="summary-row" className="bg-gray-600">
                                    <td className="border border-gray-800 px-2 py-2 font-bold text-white text-xs text-center" colSpan={9}>
                                        НИВО АГРЕГАТНОГ РИЗИКА, КАТЕГОРИЈА И ПРИХВАТЉИВОСТ РИЗИКА
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        {agregati.organizacija && (
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${nivoBoja(agregati.organizacija.nivoRizika)}`}>
                                                {agregati.organizacija.nivoRizika}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        {agregati.organizacija && (
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${kategorijaBoja(agregati.organizacija.kategorijaRizika)}`}>
                                                {agregati.organizacija.kategorijaRizika}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 text-center">
                                        {agregati.organizacija && (
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold text-xs ${agregati.organizacija.prihvatljivost === 'NEPRIHVATLJIV' ? 'bg-red-600' : 'bg-green-600'
                                                }`}>
                                                {agregati.organizacija.prihvatljivost === 'NEPRIHVATLJIV' ? 'НЕ' : 'ДА'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border border-gray-800 px-1 py-2 bg-gray-400">
                                        {/* Empty filler for Details column */}
                                    </td>
                                </tr>
                            ])}
                    </tbody>
                </table>
            </div>

            {/* Modal za prikaz slika */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(null)}>
                    <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                {columnImages[showImageModal]?.title}
                            </h3>
                            <button
                                onClick={() => setShowImageModal(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex justify-center">
                            <Image
                                src={columnImages[showImageModal]?.src || ''}
                                alt={columnImages[showImageModal]?.title || ''}
                                width={800}
                                height={600}
                                className="max-w-full h-auto"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        {showImageModal === 'ver' && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                                <p className="mb-2"><strong>НАПОМЕНА 1:</strong> Према упутству В = И (кол. 4) # Р (кол. 5)</p>
                                <p><strong>НАПОМЕНА 2:</strong> Добијене вредности се заокружују на целе бројеве.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

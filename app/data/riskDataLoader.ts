import { RiskGroupData } from './riskGroups';
import { GROUP1_DATA } from './group1Data';
import { GROUP2_DATA } from './group2Data';
import { GROUP3_DATA } from './group3Data';
import { GROUP4_DATA } from './group4Data';
import { GROUP5_DATA } from './group5Data';
import { GROUP6_DATA } from './group6Data';
import { GROUP7_DATA } from './group7Data';
import { GROUP8_DATA } from './group8Data';
import { GROUP9_DATA } from './group9Data';
import { GROUP10_DATA } from './group10Data';
import { GROUP11_DATA } from './group11Data';

// Prilog M - Analiza i vrednovanje rizika
export interface PrilogMData {
  id: string; // npr. "1.1.1", "2.1.3", itd.
  groupId: string; // "group1", "group2", itd.
  requirement: string;
  velicinaOpasnosti: number | null; // Kolona 3 - Svo iz korisničkog unosa (Prilog Lj, kol. 3)
  izlozenost: number | null; // Kolona 4 - (Si + Svo)/2
  ranjivost: number | null; // Kolona 5 - (Sr + Svo)/2
  verovatnoca: number | null; // Kolona 6 - И # Р (matrica N.5)
  steta: number | null; // Kolona 7 - (SŠ + VMŠ)/2
  kriticnost: number | null; // Kolona 8 - prema kriterijumu Nj.2
  posledice: number | null; // Kolona 9 - Ш # К (matrica Nj.3)
  nivoRizika: number | null; // Kolona 10 - V × P (matrica O.2)
  kategorijaRizika: number | null; // Kolona 11 - prema tabeli P.1
  prihvatljivost: 'PRIHVATLJIV' | 'NEPRIHVATLJIV' | null; // Kolona 12 - prema tabeli P.2
  stepenSS?: number | null; // Stepen stvarne štete (Prilog Nj, tabela Nj.1)
  stepenVMSH?: number | null; // Stepen verovatno maksimalne štete (Prilog Nj, tabela Nj.1a)
  vmshIznos?: number | null; // VMŠ = SVnpoz × Ivo (RSD)
  opisIdentifikovanihRizika?: string | null; // Opis identifikovanih rizika za PrilogLj
  usingDefaultFinancialData?: boolean; // Indikator da li se koriste default finansijski podaci
}

export interface FinansijskiPodaci {
  poslovniPrihodi: number; // AOP 1001
  vrednostImovine: number; // SVnpoz
  stvarnaSteta: number; // nominalni iznos stvarne štete
}

export const PODRAZUMEVANI_FINANSIJSKI_PODACI: FinansijskiPodaci = {
  poslovniPrihodi: 1000000,
  vrednostImovine: 5000000,
  stvarnaSteta: 0
};

// Uneti finansijski podaci ako su validni, inače podrazumevani (uz oznaku upozorenja)
export function resolveFinansijskiPodaci(
  podaci: Partial<FinansijskiPodaci> | null,
  validni: boolean
): { finansijskiPodaci: FinansijskiPodaci; usingDefaultFinancialData: boolean } {
  if (validni && podaci) {
    return {
      finansijskiPodaci: {
        poslovniPrihodi: Number(podaci.poslovniPrihodi) || 0,
        vrednostImovine: Number(podaci.vrednostImovine) || 0,
        stvarnaSteta: Number(podaci.stvarnaSteta) || 0
      },
      usingDefaultFinancialData: false
    };
  }
  return {
    finansijskiPodaci: { ...PODRAZUMEVANI_FINANSIJSKI_PODACI, stvarnaSteta: Number(podaci?.stvarnaSteta) || 0 },
    usingDefaultFinancialData: true
  };
}

// Matrice za računanje (iz priloga N, Nj, O, P) - PREMA STANDARDU SRPS A.L2.003:2025
export const MATRICE = {
  // Matrica za verovatnoću (Prilog N, tabela N.5)
  // IZLOŽENOST (redovi) vs RANJIVOST (kolone)
  // NAPOMENA 1: Prema upustvu В = И (kol. 4) # Р (kol. 5)
  // NAPOMENA 2: Dobijene vrednosti se zaokružuju na cele brojeve
  verovatnoca: [
    [3, 2, 1, 1, 1], // Izloženost 1 (zanemarljiva) vs Ranjivost 1-5 (vrlo velika-vrlo mala)
    [4, 3, 2, 2, 1], // Izloženost 2 (povremena)
    [5, 4, 3, 2, 2], // Izloženost 3 (duga)
    [5, 4, 3, 3, 3], // Izloženost 4 (pretežna)
    [5, 5, 4, 3, 3]  // Izloženost 5 (trajna)
  ],

  // Matrica za posledice (Prilog Nj, tabela Nj.3)
  // ŠTETA (redovi) vs KRITIČNOST (kolone)
  posledice: [
    [3, 2, 1, 1, 1], // Šteta 1 (vrlo mala) vs Kritičnost 1-5 (vrlo velika-vrlo mala)
    [4, 3, 2, 2, 1], // Šteta 2 (mala)
    [5, 4, 3, 2, 2], // Šteta 3 (srednja)
    [5, 4, 3, 3, 3], // Šteta 4 (velika)
    [5, 5, 4, 3, 3]  // Šteta 5 (vrlo velika)
  ],

  // Matrica za nivo rizika (Prilog O, tabela O.2)
  // VEROVATNOĆA (redovi) vs POSLEDICE (kolone)
  nivoRizika: [
    [1, 2, 3, 4, 5],    // Verovatnoća 1 (retko) vs Posledice 1-5
    [2, 4, 6, 8, 10],   // Verovatnoća 2 (malo verovatno)
    [3, 6, 9, 12, 15],  // Verovatnoća 3 (umereno verovatno)
    [4, 8, 12, 16, 20], // Verovatnoća 4 (verovatno)
    [5, 10, 15, 20, 25] // Verovatnoća 5 (skoro sigurno)
  ]
};

// Кво – koeficijent veličine opasnosti (Prilog B1, kol. 6; tačka 6.3.2 prema Izmeni 1):
// 0,1 ako je Svo = 1; 0,15 ako je Svo = 2; 0,2 ako je Svo = 3; 0,25 ako je Svo = 4; 0,3 ako je Svo = 5
export const KVO_PO_SVO: { [svo: number]: number } = { 1: 0.10, 2: 0.15, 3: 0.20, 4: 0.25, 5: 0.30 };

// Kriterijumi za kritičnost (Prilog Nj, tabela Nj.2)
// Stepen kritičnosti (К) izražen je od 1 do 5, određuje se na osnovu podataka
// iz kontrolne liste prema kriterijumu u Prilogu Nj, tabela Nj.2;
// Izračunava se za svaki faktor unutar grupe rizika i agregatno (prosečno) za svaku grupu rizika.
export const KRITERIJUMI_KRITICNOSTI = [
  { stepen: 1, naziv: 'Vrlo velika', opis: 'Potpuni prekid funkcionisanja organizacije' },
  { stepen: 2, naziv: 'Velika', opis: 'Ozbiljno narušavanje funkcionisanja organizacije' },
  { stepen: 3, naziv: 'Srednja', opis: 'Funkcionisanje uz povećanje napora i dopuna sredstava' },
  { stepen: 4, naziv: 'Mala', opis: 'Mogući poremećaji u procesu rada' },
  { stepen: 5, naziv: 'Minimalna', opis: 'Problemi koji se rešavaju u hodu' }
];

// NAPOMENA 2 uz tabelu N.5 (Izmena 1): dobijene vrednosti se zaokružuju na cele brojeve
function zaokruzi(vrednost: number): number {
  return Math.round(vrednost);
}

function prosek(vrednosti: number[]): number {
  return vrednosti.reduce((sum, v) => sum + v, 0) / vrednosti.length;
}

function izMatrice(matrica: number[][], red: number, kolona: number): number {
  const r = Math.min(Math.max(red - 1, 0), 4);
  const k = Math.min(Math.max(kolona - 1, 0), 4);
  return matrica[r][k];
}

// Kategorije rizika (Prilog P, tabela P.1)
export function getKategorijaRizika(nivoRizika: number): number {
  if (nivoRizika >= 1 && nivoRizika <= 2) return 5; // PETA - vrlo mali
  if (nivoRizika >= 3 && nivoRizika <= 5) return 4; // ČETVRTA - mali
  if (nivoRizika >= 6 && nivoRizika <= 9) return 3; // TREĆA - umereno veliki
  if ([10, 12, 15, 16].includes(nivoRizika)) return 2; // DRUGA - veliki
  if ([20, 25].includes(nivoRizika)) return 1; // PRVA - izrazito veliki
  return 5; // default
}

// Prihvatljivost rizika (Prilog P, tabela P.2)
export function getPrihvatljivost(nivoRizika: number): 'PRIHVATLJIV' | 'NEPRIHVATLJIV' {
  // PRIHVATLJIV: nivoi rizika 1, 2, 3, 4 i 5
  const prihvatljiviNivoi = [1, 2, 3, 4, 5];
  // NEPRIHVATLJIV: nivoi rizika 6, 8, 9, 10, 12, 15, 16, 20 i 25
  const neprihvatljiviNivoi = [6, 8, 9, 10, 12, 15, 16, 20, 25];

  if (prihvatljiviNivoi.includes(nivoRizika)) {
    return 'PRIHVATLJIV';
  } else if (neprihvatljiviNivoi.includes(nivoRizika)) {
    return 'NEPRIHVATLJIV';
  } else {
    // Fallback za neočekivane nivoe - tretiramo kao neprihvatljive
    return 'NEPRIHVATLJIV';
  }
}

// Stepen štete prema procentu (Prilog Nj, tabele Nj.1 i Nj.1a):
// ≤ 5 %, > 5 % ≤ 10 %, > 10 % ≤ 15 %, > 15 % ≤ 20 %, > 20 %
export function stepenStete(procenat: number): number {
  if (procenat <= 5) return 1;
  if (procenat <= 10) return 2;
  if (procenat <= 15) return 3;
  if (procenat <= 20) return 4;
  return 5;
}

// Stvarna šteta (SŠ) u odnosu na poslovne prihode (AOP 1001) - Prilog Nj, tabela Nj.1
export function calculateStvarnaSteta(
  stetnIznos: number,
  poslovniPrihodi: number
): number {
  if (!poslovniPrihodi) return 1;
  return stepenStete((stetnIznos / poslovniPrihodi) * 100);
}

// Verovatno maksimalna šteta (VMŠ) - tačka 6.3.2 i Prilog Nj, tabela Nj.1a:
// VMŠ = SVnpoz × Ivo, gde je Ivo = Iud × Kvo iz Priloga B1 za grupu rizika.
// Udeo VMŠ u vrednosti imovine je upravo Ivo, pa se stepen određuje iz Ivo × 100 %.
export function calculateVerovatnoMaksimalnaSteta(
  vrednostImovine: number,
  ivo: number
): { vmsh: number, stepenVMSH: number } {
  const vmsh = Math.round(vrednostImovine * ivo * 100) / 100;
  return { vmsh, stepenVMSH: stepenStete(ivo * 100) };
}

// Kolone 4-6: И = (Си + Сво)/2, Р = (Ср + Сво)/2, В = И # Р (matrica N.5)
export function izracunajVerovatnocu(
  velicinaOpasnosti: number,
  stepenIzlozenosti: number,
  stepenRanjivosti: number
): { izlozenost: number; ranjivost: number; verovatnoca: number } {
  const izlozenost = zaokruzi((stepenIzlozenosti + velicinaOpasnosti) / 2);
  const ranjivost = zaokruzi((stepenRanjivosti + velicinaOpasnosti) / 2);
  const verovatnoca = izMatrice(MATRICE.verovatnoca, izlozenost, ranjivost);
  return { izlozenost, ranjivost, verovatnoca };
}

// Kolona 9: П = Ш # К (matrica Nj.3)
export function izracunajPosledice(steta: number, kriticnost: number): number {
  return izMatrice(MATRICE.posledice, steta, kriticnost);
}

// Kolone 10-12: НР = В × П (matrica O.2), kategorija (P.1), prihvatljivost (P.2)
export function izracunajNivoRizika(
  verovatnoca: number,
  posledice: number
): { nivoRizika: number; kategorijaRizika: number; prihvatljivost: 'PRIHVATLJIV' | 'NEPRIHVATLJIV' } {
  const nivoRizika = izMatrice(MATRICE.nivoRizika, verovatnoca, posledice);
  return {
    nivoRizika,
    kategorijaRizika: getKategorijaRizika(nivoRizika),
    prihvatljivost: getPrihvatljivost(nivoRizika)
  };
}

// Broj grupe rizika (1-11) iz ID-a stavke, npr. "4.2.3" -> 4
export function getBrojGrupe(itemId: string): number {
  return parseInt(itemId.split('.')[0]);
}

// ID faktora rizika unutar grupe, npr. "4.2.3" -> "4.2"
export function getIdFaktora(itemId: string): string {
  return itemId.split('.').slice(0, 2).join('.');
}

// Svo po grupama rizika (Prilog B1, kol. 3 se unosi prema Prilogu Lj, kol. 3):
// faktor (npr. 1.1) = zaokružen prosek stavki, grupa = zaokružen prosek faktora
export function getSvoPoGrupama(items: PrilogMData[]): Map<number, number> {
  const faktori = new Map<string, number[]>();
  items.forEach(item => {
    if (item.velicinaOpasnosti && item.velicinaOpasnosti > 0) {
      const idFaktora = getIdFaktora(item.id);
      faktori.set(idFaktora, [...(faktori.get(idFaktora) || []), item.velicinaOpasnosti]);
    }
  });

  const grupe = new Map<number, number[]>();
  faktori.forEach((vrednosti, idFaktora) => {
    const brojGrupe = getBrojGrupe(idFaktora);
    grupe.set(brojGrupe, [...(grupe.get(brojGrupe) || []), zaokruzi(prosek(vrednosti))]);
  });

  const svoPoGrupama = new Map<number, number>();
  grupe.forEach((vrednosti, brojGrupe) => svoPoGrupama.set(brojGrupe, zaokruzi(prosek(vrednosti))));
  return svoPoGrupama;
}

// Prilog B1, tabela B1.1 (prema Izmeni 1)
export interface PrilogB1Red {
  groupNumber: number;
  svo: number; // Kol. 3 - Сво
  uticaj: number; // Kol. 4 - Уд = Сво/ΣСво u %
  iud: number; // Kol. 5 - Иуд, decimalni prikaz Уд
  kvo: number; // Kol. 6 - Кво
  ivo: number; // Kol. 7 - Иво = Иуд × Кво
}

export const BROJ_GRUPA_RIZIKA = 11;

export function calculatePrilogB1(svoPoGrupama: Map<number, number>): PrilogB1Red[] {
  let ukupnoSvo = 0;
  svoPoGrupama.forEach(svo => { ukupnoSvo += svo; });

  const redovi: PrilogB1Red[] = [];
  for (let groupNumber = 1; groupNumber <= BROJ_GRUPA_RIZIKA; groupNumber++) {
    const svo = svoPoGrupama.get(groupNumber) || 0;
    const iud = ukupnoSvo > 0 ? svo / ukupnoSvo : 0;
    const kvo = KVO_PO_SVO[svo] || 0;
    redovi.push({ groupNumber, svo, uticaj: iud * 100, iud, kvo, ivo: iud * kvo });
  }
  return redovi;
}

// Preračunava kolone 7-12 svih stavki: Ivo po grupi zavisi od Svo svih grupa (Prilog B1),
// pa se svaka promena Svo ili finansijskih podataka odražava na sve stavke.
// Ručno izmenjene vrednosti štete/posledica ostaju dok se SŠ ili VMŠ stavke ne promene.
export function recalculatePrilogM(
  items: PrilogMData[],
  finansijskiPodaci: FinansijskiPodaci,
  usingDefaultFinancialData = false
): PrilogMData[] {
  const ivoPoGrupi = new Map<number, number>();
  calculatePrilogB1(getSvoPoGrupama(items)).forEach(red => ivoPoGrupi.set(red.groupNumber, red.ivo));
  const stepenSS = calculateStvarnaSteta(finansijskiPodaci.stvarnaSteta, finansijskiPodaci.poslovniPrihodi);

  return items.map(item => {
    if (!item.velicinaOpasnosti || !item.verovatnoca) return item;

    const { vmsh, stepenVMSH } = calculateVerovatnoMaksimalnaSteta(
      finansijskiPodaci.vrednostImovine,
      ivoPoGrupi.get(getBrojGrupe(item.id)) || 0
    );
    const ulaziNepromenjeni = item.stepenSS === stepenSS && item.stepenVMSH === stepenVMSH;
    const steta = ulaziNepromenjeni && item.steta !== null
      ? item.steta
      : zaokruzi((stepenSS + stepenVMSH) / 2);
    const posledice = ulaziNepromenjeni && item.steta !== null && item.posledice !== null
      ? item.posledice
      : izracunajPosledice(steta, item.kriticnost || 3);

    return {
      ...item,
      stepenSS,
      stepenVMSH,
      vmshIznos: vmsh,
      steta,
      posledice,
      ...izracunajNivoRizika(item.verovatnoca, posledice),
      usingDefaultFinancialData
    };
  });
}

// Ručna izmena štete (kol. 7) ili posledica (kol. 9) - preračunavaju se zavisne kolone
export function primeniRucnuIzmenu<T extends Pick<PrilogMData, 'verovatnoca' | 'kriticnost' | 'steta' | 'posledice'>>(
  item: T,
  polje: 'steta' | 'posledice',
  vrednost: number
): T & ReturnType<typeof izracunajNivoRizika> {
  const steta = polje === 'steta' ? vrednost : item.steta;
  const posledice = polje === 'posledice'
    ? vrednost
    : izracunajPosledice(vrednost, item.kriticnost || 3);
  return {
    ...item,
    steta,
    posledice,
    ...izracunajNivoRizika(item.verovatnoca || 1, posledice)
  };
}

// Agregatne vrednosti (Prilog M, uputstvo za kol. 4-12): prosečne И, Р, В, Ш, К и П
// zaokružene na cele brojeve, a nivo rizika je proizvod agregatne В i П (matrica O.2)
export interface AgregatniRedM {
  velicinaOpasnosti: number;
  izlozenost: number;
  ranjivost: number;
  verovatnoca: number;
  steta: number;
  kriticnost: number;
  posledice: number;
  nivoRizika: number;
  kategorijaRizika: number;
  prihvatljivost: 'PRIHVATLJIV' | 'NEPRIHVATLJIV';
}

type VrednostiM = Pick<PrilogMData, 'velicinaOpasnosti' | 'izlozenost' | 'ranjivost' | 'verovatnoca' | 'steta' | 'kriticnost' | 'posledice'>;

export function aggregatePrilogM(redovi: VrednostiM[]): AgregatniRedM | null {
  const popunjeni = redovi.filter(r =>
    r.velicinaOpasnosti && r.izlozenost && r.ranjivost && r.verovatnoca && r.steta && r.kriticnost && r.posledice
  );
  if (popunjeni.length === 0) return null;

  const prosekKolone = (kolona: keyof VrednostiM) => zaokruzi(prosek(popunjeni.map(r => r[kolona] as number)));
  const verovatnoca = prosekKolone('verovatnoca');
  const posledice = prosekKolone('posledice');

  return {
    velicinaOpasnosti: prosekKolone('velicinaOpasnosti'),
    izlozenost: prosekKolone('izlozenost'),
    ranjivost: prosekKolone('ranjivost'),
    verovatnoca,
    steta: prosekKolone('steta'),
    kriticnost: prosekKolone('kriticnost'),
    posledice,
    ...izracunajNivoRizika(verovatnoca, posledice)
  };
}

// Agregacija po faktorima (npr. 1.1), grupama rizika (1-11) i za organizaciju
export function aggregatePrilogMPoNivoima(items: PrilogMData[]): {
  faktori: Map<string, AgregatniRedM>;
  grupe: Map<number, AgregatniRedM>;
  organizacija: AgregatniRedM | null;
} {
  const stavkePoFaktoru = new Map<string, PrilogMData[]>();
  items.forEach(item => {
    const idFaktora = getIdFaktora(item.id);
    stavkePoFaktoru.set(idFaktora, [...(stavkePoFaktoru.get(idFaktora) || []), item]);
  });

  const faktori = new Map<string, AgregatniRedM>();
  stavkePoFaktoru.forEach((stavke, idFaktora) => {
    const agregat = aggregatePrilogM(stavke);
    if (agregat) faktori.set(idFaktora, agregat);
  });

  const faktoriPoGrupi = new Map<number, AgregatniRedM[]>();
  faktori.forEach((agregat, idFaktora) => {
    const brojGrupe = getBrojGrupe(idFaktora);
    faktoriPoGrupi.set(brojGrupe, [...(faktoriPoGrupi.get(brojGrupe) || []), agregat]);
  });

  const grupe = new Map<number, AgregatniRedM>();
  faktoriPoGrupi.forEach((agregati, brojGrupe) => {
    const agregat = aggregatePrilogM(agregati);
    if (agregat) grupe.set(brojGrupe, agregat);
  });

  return { faktori, grupe, organizacija: aggregatePrilogM(Array.from(grupe.values())) };
}

// Redovi iz baze: PostgreSQL vraća nazive kolona malim slovima, a posledice, nivoRizika
// i kategorijaRizika su VARCHAR kolone, pa se vrednosti vraćaju u brojeve
export function normalizePrilogMRow(red: Record<string, unknown>): PrilogMData {
  const polje = (...nazivi: string[]) => {
    for (const naziv of nazivi) {
      if (red[naziv] !== undefined && red[naziv] !== null) return red[naziv];
    }
    return null;
  };
  const broj = (...nazivi: string[]) => {
    const vrednost = polje(...nazivi);
    if (vrednost === null || vrednost === '') return null;
    const n = Number(vrednost);
    return Number.isFinite(n) ? n : null;
  };

  let groupId = String(polje('groupId', 'groupid') || '');
  if (groupId && !groupId.startsWith('group')) groupId = `group${groupId}`;

  return {
    id: String(polje('itemId', 'itemid', 'id') || ''),
    groupId,
    requirement: String(polje('requirement') || ''),
    velicinaOpasnosti: broj('velicinaOpasnosti', 'velicinaopasnosti'),
    izlozenost: broj('izlozenost'),
    ranjivost: broj('ranjivost'),
    verovatnoca: broj('verovatnoca'),
    steta: broj('steta'),
    kriticnost: broj('kriticnost'),
    posledice: broj('posledice'),
    nivoRizika: broj('nivoRizika', 'nivorizika'),
    kategorijaRizika: broj('kategorijaRizika', 'kategorijarizika'),
    prihvatljivost: polje('prihvatljivost') as PrilogMData['prihvatljivost'],
    stepenSS: broj('stepenSS', 'stepenss'),
    stepenVMSH: broj('stepenVMSH', 'stepenvmsh'),
    vmshIznos: broj('vmshIznos', 'vmshiznos'),
    opisIdentifikovanihRizika: polje('opisIdentifikovanihRizika', 'opisidentifikovanihrizika') as string | null
  };
}

// Funkcija za učitavanje podataka grupe rizika
export function getRiskGroupData(groupId: string): RiskGroupData | null {
  switch (groupId) {
    case 'group1':
      return GROUP1_DATA;
    case 'group2':
      return GROUP2_DATA;
    case 'group3':
      return GROUP3_DATA;
    case 'group4':
      return GROUP4_DATA;
    case 'group5':
      return GROUP5_DATA;
    case 'group6':
      return GROUP6_DATA;
    case 'group7':
      return GROUP7_DATA;
    case 'group8':
      return GROUP8_DATA;
    case 'group9':
      return GROUP9_DATA;
    case 'group10':
      return GROUP10_DATA;
    case 'group11':
      return GROUP11_DATA;
    default:
      return null;
  }
}

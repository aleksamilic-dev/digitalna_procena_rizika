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
  id: string; // npr. "1.1", "2.1", itd.
  groupId: string; // "group1", "group2", itd.
  requirement: string;
  velicinaOpasnosti: number | null; // Kolona 3 - iz korisničkog unosa
  izlozenost: number | null; // Kolona 4 - (Si + Svo)/2
  ranjivost: number | null; // Kolona 5 - (Sr + Svo)/2
  verovatnoca: number | null; // Kolona 6 - I × R (iz matrice N.5)
  steta: number | null; // Kolona 7 - (SŠ + VMŠ)/2
  kriticnost: number | null; // Kolona 8 - prema kriterijumu
  posledice: number | null; // Kolona 9 - Š × K (iz matrice Nj.3)
  nivoRizika: number | null; // Kolona 10 - V × P (iz matrice)
  kategorijaRizika: number | null; // Kolona 11 - prema tabeli P.1
  prihvatljivost: 'PRIHVATLJIV' | 'NEPRIHVATLJIV' | null; // Kolona 12 - prema tabeli P.2
  opisIdentifikovanihRizika?: string | null; // Opis identifikovanih rizika za PrilogLj
  usingDefaultFinancialData?: boolean; // Indikator da li se koriste default finansijski podaci
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

// Prilog B1 - Indeks uticaja delatnosti (Иуд) - prema standardu
// Иуд – Indeks uticaja delatnosti je decimalni prikaz uticaja delatnosti (Уд) 
// i služi za proračun verovatno maksimalne štete (Prilog B1, tabela B1, kol. 4)
export const UTICAJ_DELATNOSTI: { [key: string]: number } = {
  // Proizvodnja
  'proizvodnja_hrane': 0.15,
  'proizvodnja_tekstila': 0.12,
  'proizvodnja_hemikalija': 0.25,
  'proizvodnja_metala': 0.20,
  'proizvodnja_masina': 0.18,
  'proizvodnja_vozila': 0.22,

  // Usluge
  'trgovina_na_malo': 0.10,
  'trgovina_na_veliko': 0.12,
  'transport': 0.18,
  'skladistenje': 0.15,
  'finansijske_usluge': 0.08,
  'osiguranje': 0.10,
  'informaticke_usluge': 0.12,
  'konsalting': 0.08,

  // Javni sektor
  'javna_uprava': 0.06,
  'obrazovanje': 0.08,
  'zdravstvo': 0.15,
  'socijalna_zastita': 0.10,

  // Ostalo
  'gradjevinarstvo': 0.22,
  'energetika': 0.25,
  'rudarstvo': 0.30,
  'poljoprivreda': 0.18,
  'turizam': 0.12,
  'default': 0.15 // Default vrednost ako delatnost nije definisana
};

// Kriterijumi za stetu (Prilog Nj, tabela Nj.1 i Nj.1a)
export const KRITERIJUMI_STETE = {
  // Stvarna šteta (SŠ) - u odnosu na poslovne prihode (AOP 1001)
  stvarnaSteta: [
    { min: 0, max: 5, stepen: 1 },      // ≤ 5% - vrlo mala
    { min: 5, max: 10, stepen: 2 },     // > 5% ≤ 10% - mala
    { min: 10, max: 15, stepen: 3 },    // > 10% ≤ 15% - srednja
    { min: 15, max: 20, stepen: 4 },    // > 15% ≤ 20% - velika
    { min: 20, max: 100, stepen: 5 }    // > 20% - vrlo velika
  ],

  // Verovatno maksimalna šteta (VMŠ) - u odnosu na vrednost imovine
  verovatnoMaksimalnaSteta: [
    { min: 0, max: 5, stepen: 1 },      // ≤ 5% - vrlo mala
    { min: 5, max: 10, stepen: 2 },     // > 5% ≤ 10% - mala
    { min: 10, max: 15, stepen: 3 },    // > 10% ≤ 15% - srednja
    { min: 15, max: 20, stepen: 4 },    // > 15% ≤ 20% - velika
    { min: 20, max: 100, stepen: 5 }    // > 20% - vrlo velika
  ]
};

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

// Funkcije za računanje štete prema standardu
export function calculateStvarnaSteta(
  stetnIznos: number,
  poslovniPrihodi: number
): number {
  if (poslovniPrihodi === 0) return 1;

  const procenat = (stetnIznos / poslovniPrihodi) * 100;

  // Prema standardu: ≤ 5%, > 5% ≤ 10%, > 10% ≤ 15%, > 15% ≤ 20%, > 20%
  if (procenat <= 5) return 1;
  if (procenat <= 10) return 2;
  if (procenat <= 15) return 3;
  if (procenat <= 20) return 4;
  return 5; // > 20%
}

export function calculateVerovatnoMaksimalnaSteta(
  vrednostImovine: number,
  velicinaOpasnosti: number,
  delatnost: string = 'default'
): { vmsh: number, stepenVMSH: number } {
  // Иуд – Indeks uticaja delatnosti je decimalni prikaz uticaja delatnosti (Уд)
  // i služi za proračun verovatno maksimalne štete (Prilog B1, tabela B1, kol. 4)
  const iud = UTICAJ_DELATNOSTI[delatnost] || UTICAJ_DELATNOSTI.default;

  // Кво – koeficijent veličine opasnosti izražen u procentima:
  // 10% ako je Svo = 1, 15% ako je Svo = 2, 20% ako je Svo = 3, 
  // 25% ako je Svo = 4 i 30% ako je Svo = 5
  // Stepen Svo se preuzima iz Priloga Lj, kol. 3, za svaku od grupa rizika
  const kvoMapping = { 1: 0.10, 2: 0.15, 3: 0.20, 4: 0.25, 5: 0.30 };
  const kvo = kvoMapping[velicinaOpasnosti as keyof typeof kvoMapping] || 0.20;

  // Ivo = Iud × Kvo
  const ivo = iud * kvo;

  // VMŠ = SVnpoz × Ivo
  const vmsh = vrednostImovine * ivo;

  // Stepen VMŠ na osnovu procenta od vrednosti imovine
  // NAPOMENA: Ivo je već procenat, tako da je vmsh = vrednostImovine * procenat
  // Procenat VMŠ od vrednosti imovine je upravo Ivo * 100
  const procenat = ivo * 100;

  // Stepen VMŠ prema istim kriterijumima kao SŠ
  let stepenVMSH = 1;
  if (procenat <= 5) stepenVMSH = 1;
  else if (procenat <= 10) stepenVMSH = 2;
  else if (procenat <= 15) stepenVMSH = 3;
  else if (procenat <= 20) stepenVMSH = 4;
  else stepenVMSH = 5;

  return { vmsh, stepenVMSH };
}

// Glavna funkcija za računanje Prilog M podataka - POTPUNO PREMA STANDARDU SRPS A.L2.003:2025
export function calculatePrilogM(
  velicinaOpasnosti: number,
  stepenIzlozenosti: number = 3,
  stepenRanjivosti: number = 3,
  stvarnaSteta: number = 0,
  poslovniPrihodi: number = 1000000, // default 1M RSD
  vrednostImovine: number = 5000000, // default 5M RSD
  delatnost: string = 'default',
  kriticnost: number = 3,
  enableLogging: boolean = false
): Partial<PrilogMData> {

  if (enableLogging) {
    console.log('🧮 POČETAK KALKULACIJE PREMA SRPS A.L2.003:2025');
    console.log('📊 Ulazni parametri:', {
      velicinaOpasnosti,
      stepenIzlozenosti,
      stepenRanjivosti,
      stvarnaSteta,
      poslovniPrihodi,
      vrednostImovine,
      delatnost,
      kriticnost
    });
  }

  // Svo - stepen veličine opasnosti (Prilog Lj, kolona 3)
  const svo = velicinaOpasnosti;

  // KOLONA 4: Izloženost = (Si + Svo)/2 - stepenovanje prema Prilogu N, tabela N.3
  const izlozenost = Math.round((stepenIzlozenosti + svo) / 2);
  if (enableLogging) {
    console.log(`📐 KOLONA 4 - Izloženost: (Si ${stepenIzlozenosti} + Svo ${svo})/2 = ${izlozenost}`);
  }

  // KOLONA 5: Ranjivost = (Sr + Svo)/2 - Prilog M, upustvo kolona 5
  // Stepenovanje ranjivosti (Sr) se vrši prema Prilogu N, tabela N.4
  const ranjivost = Math.round((stepenRanjivosti + svo) / 2);
  if (enableLogging) {
    console.log(`🛡️ KOLONA 5 - Ranjivost: (Sr ${stepenRanjivosti} + Svo ${svo})/2 = ${ranjivost}`);
  }

  // KOLONA 6: Verovatnoća = И × Р (iz matrice N.5) - Prilog N, tabela N.5
  // NAPOMENA 1: Prema upustvu В = И (kol. 4) # Р (kol. 5) - Izloženost × Ranjivost
  // NAPOMENA 2: Dobijene vrednosti se zaokružuju na cele brojeve
  const izlozenostIndex = Math.min(Math.max(izlozenost - 1, 0), 4);
  const ranjivostIndex = Math.min(Math.max(ranjivost - 1, 0), 4);
  const verovatnoca = MATRICE.verovatnoca[izlozenostIndex][ranjivostIndex];
  if (enableLogging) {
    console.log(`🎯 KOLONA 6 - Verovatnoća: Matrica[${izlozenostIndex}][${ranjivostIndex}] = ${verovatnoca}`);
    console.log(`   Izloženost ${izlozenost} × Ranjivost ${ranjivost} → Verovatnoća ${verovatnoca}`);
  }

  // KOLONA 7: Šteta = (SŠ + VMŠ)/2 - Prilog M, upustvo kolona 7
  const stepenSS = calculateStvarnaSteta(stvarnaSteta, poslovniPrihodi);
  const { vmsh, stepenVMSH } = calculateVerovatnoMaksimalnaSteta(vrednostImovine, velicinaOpasnosti, delatnost);
  const steta = Math.round((stepenSS + stepenVMSH) / 2);
  if (enableLogging) {
    console.log(`💰 KOLONA 7 - Šteta:`);
    console.log(`   SŠ (Stvarna šteta): ${stepenSS} (${stvarnaSteta} RSD od ${poslovniPrihodi} RSD)`);
    console.log(`   VMŠ (Verovatno maks. šteta): ${stepenVMSH} (${vmsh.toFixed(0)} RSD)`);
    console.log(`   Šteta: (${stepenSS} + ${stepenVMSH})/2 = ${steta}`);
  }

  // KOLONA 8: Kritičnost - unosi se direktno prema kriterijumu iz Priloga Nj, tabela Nj.2
  // Stepen kritičnosti (К) izražen je od 1 do 5, određuje se na osnovu podataka iz kontrolne liste
  // Izračunava se za svaki faktor unutar grupe rizika i agregatno (prosečno) za svaku grupu rizika
  if (enableLogging) {
    console.log(`🔥 KOLONA 8 - Kritičnost: ${kriticnost} (uneto)`);
  }

  // KOLONA 9: Posledice = Ш × К (iz matrice Nj.3) - Prilog Nj, tabela Nj.3
  // NAPOMENA: Prema upustvu П = Ш (kol. 7) # К (kol. 8) - Šteta × Kritičnost
  const stetaIndex = Math.min(Math.max(steta - 1, 0), 4);
  const kriticnostIndex = Math.min(Math.max(kriticnost - 1, 0), 4);
  const posledice = MATRICE.posledice[stetaIndex][kriticnostIndex];
  if (enableLogging) {
    console.log(`⚡ KOLONA 9 - Posledice: Matrica[${stetaIndex}][${kriticnostIndex}] = ${posledice}`);
    console.log(`   Šteta ${steta} × Kritičnost ${kriticnost} → Posledice ${posledice}`);
  }

  // KOLONA 10: Nivo rizika = V × P (iz matrice O.2) - Prilog O, tabela O.2
  const verovatnocaIndexNR = Math.min(Math.max(verovatnoca - 1, 0), 4);
  const poslediceIndexNR = Math.min(Math.max(posledice - 1, 0), 4);
  const nivoRizika = MATRICE.nivoRizika[verovatnocaIndexNR][poslediceIndexNR];
  if (enableLogging) {
    console.log(`🎲 KOLONA 10 - Nivo rizika: Matrica[${verovatnocaIndexNR}][${poslediceIndexNR}] = ${nivoRizika}`);
    console.log(`   Verovatnoća ${verovatnoca} × Posledice ${posledice} → Nivo rizika ${nivoRizika}`);
  }

  // KOLONA 11: Kategorija rizika (prema tabeli P.1) - Prilog P, tabela P.1
  const kategorijaRizika = getKategorijaRizika(nivoRizika);
  if (enableLogging) {
    console.log(`📊 KOLONA 11 - Kategorija rizika: ${kategorijaRizika} (za nivo ${nivoRizika})`);
  }

  // KOLONA 12: Prihvatljivost (prema tabeli P.2) - Prilog P, tabela P.2
  const prihvatljivost = getPrihvatljivost(nivoRizika);
  if (enableLogging) {
    console.log(`✅ KOLONA 12 - Prihvatljivost: ${prihvatljivost} (za nivo ${nivoRizika})`);
    console.log('🏁 KRAJ KALKULACIJE\n');
  }

  return {
    velicinaOpasnosti,
    izlozenost,
    ranjivost,
    verovatnoca,
    posledice,
    steta,
    kriticnost,
    nivoRizika,
    kategorijaRizika,
    prihvatljivost
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

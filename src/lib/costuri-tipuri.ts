// Tipurile costurilor aduse din pontaj (fără cod de server, ca să le poată folosi și componentele de client).

export interface CostOm {
  angajatId: string;
  nume: string;
  zile: number;
  tarifZi: number | null;
  salariuFix: number | null;
  manopera?: number;
  plus?: number;
  /** costul final pe om: salariu + adaos */
  total: number;
}

export interface CostResursa {
  cheie: string;
  nume: string;
  tip: "utilaj" | "camion";
  zile: number;
  tarifZi: number | null;
  costTarif: number;
  litri: number;
  costMotorina: number;
}

/** Alimentare cu motorină trecută direct pe șantier, în Pontaj → Alimentări. */
export interface MotorinaDirecta {
  id: string;
  vehicul: string;
  data: string;
  litri: number;
  pret: number | null;
  total: number;
  pretGeneral: boolean;
}

/** Consum fictiv pentru drumul oamenilor la șantier: litri la 100 km, la fel pentru toate mașinile. */
export const CONSUM_TRANSPORT_L_100KM = 7.5;

/** Transportul oamenilor la șantier: un drum dus-întors pe zi în care a fost cineva pontat acolo. */
export interface TransportSantier {
  /** km dus-întors până la șantier; null = nesetat (nu se calculează transport) */
  km: number | null;
  /** zile cu cel puțin un om pontat */
  zile: number;
  kmTotal: number;
  litri: number;
  /** preț motorină folosit, lei/litru */
  pret: number | null;
  total: number;
}

const rotunjeste2 = (n: number) => Math.round(n * 100) / 100;

export function calculeazaTransport(km: number | null | undefined, zile: number, pret: number | null | undefined): TransportSantier {
  const kmOk = typeof km === "number" && km > 0 ? km : null;
  const kmTotal = kmOk ? rotunjeste2(kmOk * zile) : 0;
  const litri = rotunjeste2((kmTotal * CONSUM_TRANSPORT_L_100KM) / 100);
  const p = typeof pret === "number" && pret >= 0 ? pret : null;
  return { km: kmOk, zile, kmTotal, litri, pret: p, total: rotunjeste2(litri * (p ?? 0)) };
}

export interface CosturiPontaj {
  oameni: CostOm[];
  resurse: CostResursa[];
  /** zile distincte cu cel puțin un om pontat pe șantier (baza transportului) */
  zileSantier?: number;
  transport?: TransportSantier;
  motorinaDirecta?: MotorinaDirecta[];
  totalMotorinaDirecta?: number;
  totalManopera: number;
  totalPlus?: number;
  totalOameni?: number;
  nrOameni?: number;
  zileOameni?: number;
  procentDari?: number;
  totalUtilaje: number;
  totalMotorina: number;
  totalInterne: number;
}

export interface ListaPontaj {
  santiere: string[];
  resurse: { cheie: string; nume: string; tip: "utilaj" | "camion" }[];
}

export interface RaspunsCosturi {
  configurat: boolean;
  lista?: ListaPontaj;
  legat?: string[];
  pretMotorina?: number | null;
  procentDari?: number;
  costuri?: CosturiPontaj;
}

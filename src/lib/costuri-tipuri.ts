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

export interface CosturiPontaj {
  oameni: CostOm[];
  resurse: CostResursa[];
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

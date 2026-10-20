// Tipurile costurilor aduse din pontaj (fără cod de server, ca să le poată folosi și componentele de client).

export interface CostOm {
  angajatId: string;
  nume: string;
  zile: number;
  tarifZi: number | null;
  salariuFix: number | null;
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
  costuri?: CosturiPontaj;
}

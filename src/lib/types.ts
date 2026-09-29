export type CategorieCheltuiala = "materiale" | "combustibil" | "utilaje" | "transport" | "diverse";

export const CATEGORII: { valoare: CategorieCheltuiala; eticheta: string }[] = [
  { valoare: "materiale", eticheta: "Materiale" },
  { valoare: "combustibil", eticheta: "Combustibil" },
  { valoare: "utilaje", eticheta: "Utilaje (chirii/reparații)" },
  { valoare: "transport", eticheta: "Transport" },
  { valoare: "diverse", eticheta: "Diverse" },
];

export interface Santier {
  id: string;
  nume: string;
  activ: boolean;
  creat_la: string;
}

export interface Produs {
  id: string;
  aviz_id: string;
  denumire: string;
  cantitate: number | null;
  unitate_masura: string | null;
  pret_unitar: number | null;
  valoare: number;
  categorie: CategorieCheltuiala;
}

export interface ProdusNou {
  denumire: string;
  cantitate: number | null;
  unitate_masura: string | null;
  pret_unitar: number | null;
  valoare: number;
  categorie: CategorieCheltuiala;
}

export interface Aviz {
  id: string;
  santier_id: string;
  numar_aviz: string | null;
  furnizor: string;
  data_aviz: string | null;
  poza_url: string | null;
  poza_path: string | null;
  camp_incert: string[];
  creat_la: string;
  produse?: Produs[];
  santiere?: { nume: string } | null;
}

// --- Rezultatul citirii automate (OCR) ---

export interface ProdusOcr {
  denumire: string;
  cantitate: number | null;
  unitate_masura: string | null;
  pret_unitar: number | null;
  valoare: number | null;
  categorie: CategorieCheltuiala;
}

export interface OcrResult {
  furnizor: string | null;
  numar_aviz: string | null;
  data_aviz: string | null;
  produse: ProdusOcr[];
  camp_incert: string[];
}

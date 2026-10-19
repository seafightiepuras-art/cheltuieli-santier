export type CategorieCheltuiala = "materiale" | "combustibil" | "utilaje" | "transport" | "diverse";
export type Moneda = "RON" | "EUR";

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
  moneda: Moneda;
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
  moneda: Moneda;
  produse: ProdusOcr[];
  camp_incert: string[];
}

// --- Facturi emise (de firma proprie, către clienți) ---
// Se păstrează în același tabel ca avizele (ca să rămână pe același șantier), marcate cu
// un semn în `camp_incert`. Totalul cu TVA e `valoare` din singurul rând de produs, iar
// valoarea fără TVA e în `pret_unitar` (TVA = diferența).

export const MARCAJ_FACTURA_EMISA = "__factura_emisa";

export function esteFacturaEmisa(a: { camp_incert?: string[] | null }): boolean {
  return (a.camp_incert ?? []).includes(MARCAJ_FACTURA_EMISA);
}

export interface FacturaOcr {
  client: string | null;
  numar_factura: string | null;
  data_factura: string | null;
  moneda: Moneda;
  total_fara_tva: number | null;
  tva: number | null;
  total_cu_tva: number | null;
  camp_incert: string[];
}

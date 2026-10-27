import "server-only";
import { creeazaClientAdmin } from "./supabase/admin";

// Ce avize acoperă fiecare factură primită. Un aviz acoperit de o factură „se consideră facturat”: se numără factura, nu avizul.
// Se păstrează într-un fișier JSON în Supabase Storage (bucket „setari”), fără modificări în baza de date.

const BUCKET = "setari";
const FISIER = "facturare.json";

export type Acopera = Record<string, string[]>;

export async function citesteAcopera(): Promise<Acopera> {
  const supabase = creeazaClientAdmin();
  const { data: semnat } = await supabase.storage.from(BUCKET).createSignedUrl(FISIER, 60);
  if (!semnat?.signedUrl) return {};
  try {
    const r = await fetch(`${semnat.signedUrl}&t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return {};
    const j = await r.json();
    return j.acopera && typeof j.acopera === "object" ? (j.acopera as Acopera) : {};
  } catch {
    return {};
  }
}

export async function scrieAcopera(acopera: Acopera): Promise<void> {
  const supabase = creeazaClientAdmin();
  const { error: eroareBucket } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (eroareBucket && !/already exists|duplicate/i.test(eroareBucket.message)) throw new Error(eroareBucket.message);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FISIER, new Blob([JSON.stringify({ acopera })], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
}

/** Stabilește avizele acoperite de o factură; un aviz poate fi acoperit de o singură factură. */
export function seteazaAcoperire(acopera: Acopera, facturaId: string, avizIds: string[]): Acopera {
  const nou: Acopera = {};
  const alese = new Set(avizIds);
  for (const [f, lista] of Object.entries(acopera)) {
    if (f === facturaId) continue;
    const ramase = lista.filter((a) => !alese.has(a));
    if (ramase.length > 0) nou[f] = ramase;
  }
  if (avizIds.length > 0) nou[facturaId] = Array.from(alese);
  return nou;
}

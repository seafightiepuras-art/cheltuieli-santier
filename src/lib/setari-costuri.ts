import "server-only";
import { creeazaClientAdmin } from "./supabase/admin";

// Setările pentru costurile din pontaj: legătura dintre șantierele de aici și cele din pontaj,
// tariful pe zi al fiecărui utilaj/camion și prețul motorinei. Se țin într-un fișier JSON
// într-un bucket privat din Supabase Storage (nu cere nicio modificare în baza de date).

const BUCKET = "setari";
const FISIER = "costuri.json";

export interface SetariCosturi {
  /** id șantier (cheltuieli) -> numele șantierelor din pontaj legate de el */
  legaturi: Record<string, string[]>;
  /** cheie resursă din pontaj ("u:<id>" / "m:<id>") -> tarif lei/zi */
  tarife: Record<string, number>;
  /** preț motorină, lei/litru */
  pretMotorina: number | null;
  /** dări la stat pentru cei care nu sunt pe statul de plată: % din manoperă (implicit 40) */
  procentDari: number;
}

const GOALE: SetariCosturi = { legaturi: {}, tarife: {}, pretMotorina: null, procentDari: 40 };

async function asiguraBucket() {
  const supabase = creeazaClientAdmin();
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

export async function citesteSetari(): Promise<SetariCosturi> {
  const supabase = creeazaClientAdmin();
  const { data, error } = await supabase.storage.from(BUCKET).download(FISIER);
  if (error || !data) return { ...GOALE, legaturi: {}, tarife: {} };
  try {
    const j = JSON.parse(await data.text());
    return {
      legaturi: j.legaturi && typeof j.legaturi === "object" ? j.legaturi : {},
      tarife: j.tarife && typeof j.tarife === "object" ? j.tarife : {},
      pretMotorina: typeof j.pretMotorina === "number" ? j.pretMotorina : null,
      procentDari: typeof j.procentDari === "number" ? j.procentDari : 40,
    };
  } catch {
    return { ...GOALE, legaturi: {}, tarife: {} };
  }
}

export async function scrieSetari(setari: SetariCosturi): Promise<void> {
  await asiguraBucket();
  const supabase = creeazaClientAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FISIER, new Blob([JSON.stringify(setari)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (error) throw new Error(error.message);
}

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
  /** id șantier (cheltuieli) -> km dus-întors de la sediu până la șantier (pentru transportul oamenilor) */
  km: Record<string, number>;
  /** id șantier (cheltuieli) -> preț pe litru doar pentru transportul oamenilor, dacă diferă de prețul general (ex. mașina merge pe gaz) */
  pretTransport: Record<string, number>;
}

const GOALE: SetariCosturi = { legaturi: {}, tarife: {}, pretMotorina: null, procentDari: 40, km: {}, pretTransport: {} };

async function asiguraBucket() {
  const supabase = creeazaClientAdmin();
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

export async function citesteSetari(): Promise<SetariCosturi> {
  const supabase = creeazaClientAdmin();
  // citim cu adresă semnată + fără cache, ca după o salvare să vedem imediat valoarea nouă (download() putea întoarce versiunea veche)
  const { data: semnat } = await supabase.storage.from(BUCKET).createSignedUrl(FISIER, 60);
  if (!semnat?.signedUrl) return { ...GOALE, legaturi: {}, tarife: {}, km: {}, pretTransport: {} };
  const raspuns = await fetch(`${semnat.signedUrl}&t=${Date.now()}`, { cache: "no-store" });
  if (!raspuns.ok) return { ...GOALE, legaturi: {}, tarife: {}, km: {}, pretTransport: {} };
  try {
    const j = JSON.parse(await raspuns.text());
    return {
      legaturi: j.legaturi && typeof j.legaturi === "object" ? j.legaturi : {},
      tarife: j.tarife && typeof j.tarife === "object" ? j.tarife : {},
      pretMotorina: typeof j.pretMotorina === "number" ? j.pretMotorina : null,
      procentDari: typeof j.procentDari === "number" ? j.procentDari : 40,
      km: j.km && typeof j.km === "object" ? j.km : {},
      pretTransport: j.pretTransport && typeof j.pretTransport === "object" ? j.pretTransport : {},
    };
  } catch {
    return { ...GOALE, legaturi: {}, tarife: {}, km: {}, pretTransport: {} };
  }
}

export async function scrieSetari(setari: SetariCosturi): Promise<void> {
  await asiguraBucket();
  const supabase = creeazaClientAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FISIER, new Blob([JSON.stringify(setari)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
}

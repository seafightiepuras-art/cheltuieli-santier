import "server-only";
import { creeazaClientAdmin } from "./supabase/admin";
import type { Inchidere, InchideriSantier } from "./inchideri-tipuri";

// Lunile închise, pe șantiere. Se păstrează într-un fișier JSON în Supabase Storage (bucket „setari”), fără modificări în baza de date.

const BUCKET = "setari";
const FISIER = "inchideri.json";

type Toate = Record<string, InchideriSantier>;

async function citesteToate(): Promise<Toate> {
  const supabase = creeazaClientAdmin();
  const { data: semnat } = await supabase.storage.from(BUCKET).createSignedUrl(FISIER, 60);
  if (!semnat?.signedUrl) return {};
  try {
    const r = await fetch(`${semnat.signedUrl}&t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return {};
    const j = await r.json();
    return j && typeof j === "object" ? (j as Toate) : {};
  } catch {
    return {};
  }
}

async function scrieToate(toate: Toate): Promise<void> {
  const supabase = creeazaClientAdmin();
  const { error: eroareBucket } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (eroareBucket && !/already exists|duplicate/i.test(eroareBucket.message)) throw new Error(eroareBucket.message);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FISIER, new Blob([JSON.stringify(toate)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
}

export async function citesteInchideri(santierId: string): Promise<InchideriSantier> {
  return (await citesteToate())[santierId] ?? {};
}

export async function inchideLuna(santierId: string, luna: string, inchidere: Inchidere): Promise<void> {
  const toate = await citesteToate();
  toate[santierId] = { ...(toate[santierId] ?? {}), [luna]: inchidere };
  await scrieToate(toate);
}

export async function redeschideLuna(santierId: string, luna: string): Promise<void> {
  const toate = await citesteToate();
  if (!toate[santierId]?.[luna]) return;
  delete toate[santierId][luna];
  if (Object.keys(toate[santierId]).length === 0) delete toate[santierId];
  await scrieToate(toate);
}

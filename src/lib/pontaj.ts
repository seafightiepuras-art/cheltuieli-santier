import "server-only";

// Aplicația de pontaj calculează costurile (manoperă, utilaje, motorină); aici doar o apelăm.
// Se autentifică cu cheia de service a acestui proiect, pe care pontajul o verifică la Supabase.
const URL_PONTAJ = process.env.PONTAJ_URL ?? "https://pontaj-alandia.vercel.app";

export async function apeleazaPontaj<T>(corp: Record<string, unknown>): Promise<T> {
  const cheie = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const r = await fetch(`${URL_PONTAJ}/api/costuri-santier`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cheie}` },
    body: JSON.stringify(corp),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.eroare ?? `Pontajul a răspuns cu eroare (${r.status})`);
  return j as T;
}

export type { CosturiPontaj, ListaPontaj } from "./costuri-tipuri";

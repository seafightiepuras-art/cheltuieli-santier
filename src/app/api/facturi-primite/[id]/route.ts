import { NextResponse } from "next/server";
import { citesteAcopera } from "@/lib/facturare";
import type { RaspunsFacturiPrimite } from "@/lib/facturi-tipuri";

export const dynamic = "force-dynamic";

// Facturile primite alocate unui șantier, aduse din Centralizator Facturi (se autentifică cu cheia de service a acestui proiect,
// pe care Centralizatorul o verifică la Supabase-ul nostru).
const URL_CENTRALIZATOR = process.env.CENTRALIZATOR_URL ?? "https://facturi-app-steel.vercel.app";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const luna = new URL(req.url).searchParams.get("luna");
  const lunaValida = luna && /^\d{4}-\d{2}$/.test(luna) ? `&luna=${luna}` : "";
  try {
    const [r, acopera] = await Promise.all([
      fetch(`${URL_CENTRALIZATOR}/api/pentru-cheltuieli?santier=${encodeURIComponent(params.id)}${lunaValida}`, {
        headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
        cache: "no-store",
      }),
      citesteAcopera(),
    ]);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.eroare ?? `Centralizatorul a răspuns cu eroare (${r.status})`);
    const raspuns: RaspunsFacturiPrimite = { facturi: j.facturi ?? [], nealocat: j.nealocat ?? [], acopera };
    return NextResponse.json(raspuns);
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

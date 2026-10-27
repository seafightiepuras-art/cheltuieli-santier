import { NextResponse } from "next/server";
import { citesteAcopera, scrieAcopera, seteazaAcoperire } from "@/lib/facturare";

/** Stabilește ce avize acoperă o factură primită. Avizele acoperite nu se mai numără la cost (se numără factura). */
export async function PUT(req: Request) {
  const corp = await req.json().catch(() => ({}));
  const facturaId = typeof corp.facturaId === "string" ? corp.facturaId : "";
  const avizIds = Array.isArray(corp.avizIds) ? corp.avizIds.filter((x: unknown): x is string => typeof x === "string") : null;
  if (!facturaId || !avizIds) return NextResponse.json({ eroare: "Date lipsă." }, { status: 400 });

  try {
    const acopera = seteazaAcoperire(await citesteAcopera(), facturaId, avizIds);
    await scrieAcopera(acopera);
    return NextResponse.json({ ok: true, acopera });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 500 });
  }
}

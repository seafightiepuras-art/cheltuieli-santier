import { NextResponse } from "next/server";
import { citesteSetari, scrieSetari } from "@/lib/setari-costuri";

/** Modifică setările costurilor: legătura unui șantier cu pontajul, tarife pe utilaj, prețul motorinei. */
export async function PUT(req: Request) {
  let corp: Record<string, unknown>;
  try {
    corp = await req.json();
  } catch {
    return NextResponse.json({ eroare: "Cerere invalidă." }, { status: 400 });
  }

  try {
    const setari = await citesteSetari();

    if (typeof corp.santierId === "string" && Array.isArray(corp.legatura)) {
      const nume = corp.legatura.filter((n): n is string => typeof n === "string" && n.trim() !== "");
      if (nume.length === 0) delete setari.legaturi[corp.santierId];
      else setari.legaturi[corp.santierId] = nume;
    }

    if (corp.tarife && typeof corp.tarife === "object") {
      for (const [cheie, v] of Object.entries(corp.tarife as Record<string, unknown>)) {
        if (v === null || v === "") delete setari.tarife[cheie];
        else if (typeof v === "number" && Number.isFinite(v) && v >= 0) setari.tarife[cheie] = v;
      }
    }

    if ("pretMotorina" in corp) {
      const p = corp.pretMotorina;
      setari.pretMotorina = typeof p === "number" && Number.isFinite(p) && p >= 0 ? p : null;
    }

    await scrieSetari(setari);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { citesteInchideri, inchideLuna, redeschideLuna } from "@/lib/inchideri";

export const dynamic = "force-dynamic";

const LUNA = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Lunile închise ale unui șantier. */
export async function GET(req: Request) {
  const santier = new URL(req.url).searchParams.get("santier");
  if (!santier) return NextResponse.json({ eroare: "Lipsește șantierul." }, { status: 400 });
  try {
    return NextResponse.json({ inchideri: await citesteInchideri(santier) });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

/** Închide o lună: păstrează cifrele calculate la acest moment. */
export async function PUT(req: Request) {
  const corp = await req.json().catch(() => null);
  if (!corp || typeof corp.santierId !== "string" || !LUNA.test(corp.luna) || !Array.isArray(corp.fise) || corp.fise.length === 0) {
    return NextResponse.json({ eroare: "Date incomplete." }, { status: 400 });
  }
  try {
    await inchideLuna(corp.santierId, corp.luna, { inchisLa: new Date().toISOString(), fise: corp.fise, nealocat: Array.isArray(corp.nealocat) ? corp.nealocat : [] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

/** Redeschide o lună închisă. */
export async function DELETE(req: Request) {
  const corp = await req.json().catch(() => null);
  if (!corp || typeof corp.santierId !== "string" || !LUNA.test(corp.luna)) return NextResponse.json({ eroare: "Date incomplete." }, { status: 400 });
  try {
    await redeschideLuna(corp.santierId, corp.luna);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

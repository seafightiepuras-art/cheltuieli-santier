import { NextResponse } from "next/server";
import { apeleazaPontaj, type ListaPontaj } from "@/lib/pontaj";

/** Șantierele din pontaj (pentru alegerea legăturii). */
export async function GET() {
  try {
    return NextResponse.json(await apeleazaPontaj<ListaPontaj>({ actiune: "lista" }));
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

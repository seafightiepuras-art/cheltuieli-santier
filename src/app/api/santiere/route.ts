import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";

/** Încheie sau redeschide un șantier (activ = false: lucrarea e gata). */
export async function PATCH(req: Request) {
  const { id, activ } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || typeof activ !== "boolean") return NextResponse.json({ eroare: "Date incomplete." }, { status: 400 });
  const supabase = creeazaClientAdmin();
  const { error } = await supabase.from("santiere").update({ activ }).eq("id", id);
  if (error) return NextResponse.json({ eroare: `Nu am putut modifica șantierul: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const { nume } = await req.json();
  const numeCurat = String(nume ?? "").trim();
  if (!numeCurat) {
    return NextResponse.json({ eroare: "Numele șantierului este obligatoriu" }, { status: 400 });
  }

  const supabase = creeazaClientAdmin();
  const { data, error } = await supabase.from("santiere").insert({ nume: numeCurat }).select().single();

  if (error) {
    return NextResponse.json({ eroare: `Nu am putut adăuga șantierul: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

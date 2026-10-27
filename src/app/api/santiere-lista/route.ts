import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store"; // altfel lista rămâne cea de la publicare și șantierele noi nu apar

/** Șantierele active (id + nume), pentru alocarea facturilor din Centralizator Facturi. */
export async function GET() {
  const supabase = creeazaClientAdmin();
  const { data, error } = await supabase.from("santiere").select("id, nume, activ").order("nume");
  if (error) return NextResponse.json({ eroare: error.message }, { status: 500 });
  return NextResponse.json({ santiere: (data ?? []).filter((s) => s.activ !== false).map((s) => ({ id: s.id, nume: s.nume })) });
}

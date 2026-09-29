import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";
import type { ProdusNou } from "@/lib/types";

const BUCKET = "cheltuieli-poze";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = creeazaClientAdmin();
  const { data, error } = await supabase.from("avize").select("*, produse(*)").eq("id", params.id).single();
  if (error || !data) {
    return NextResponse.json({ eroare: "Aviz inexistent." }, { status: 404 });
  }
  return NextResponse.json(data);
}

/** Editare — corectează câmpurile și înlocuiește lista de produse (se șterg cele vechi, se scriu cele noi). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const corp = await req.json();
  const furnizor = String(corp.furnizor ?? "").trim();
  const numarAviz = String(corp.numar_aviz ?? "").trim() || null;
  const dataAviz = String(corp.data_aviz ?? "").trim() || null;
  const produse = (Array.isArray(corp.produse) ? corp.produse : []) as ProdusNou[];
  const produseValide = produse.filter((p) => p.denumire?.trim());

  if (!furnizor) {
    return NextResponse.json({ eroare: "Furnizorul este obligatoriu" }, { status: 400 });
  }
  if (produseValide.length === 0) {
    return NextResponse.json({ eroare: "Adaugă cel puțin un produs" }, { status: 400 });
  }

  const supabase = creeazaClientAdmin();

  const { error: eroareAviz } = await supabase
    .from("avize")
    .update({ furnizor, numar_aviz: numarAviz, data_aviz: dataAviz })
    .eq("id", params.id);
  if (eroareAviz) {
    return NextResponse.json({ eroare: `Nu am putut actualiza avizul: ${eroareAviz.message}` }, { status: 500 });
  }

  const { error: eroareStergere } = await supabase.from("produse").delete().eq("aviz_id", params.id);
  if (eroareStergere) {
    return NextResponse.json({ eroare: `Nu am putut actualiza produsele: ${eroareStergere.message}` }, { status: 500 });
  }

  const { error: eroareProduse } = await supabase.from("produse").insert(
    produseValide.map((p) => ({
      aviz_id: params.id,
      denumire: p.denumire,
      cantitate: p.cantitate,
      unitate_masura: p.unitate_masura,
      pret_unitar: p.pret_unitar,
      valoare: p.valoare || 0,
      categorie: p.categorie,
    }))
  );
  if (eroareProduse) {
    return NextResponse.json({ eroare: `Nu am putut salva produsele: ${eroareProduse.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = creeazaClientAdmin();

  const { data: aviz } = await supabase.from("avize").select("poza_path").eq("id", params.id).maybeSingle();

  const { error } = await supabase.from("avize").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ eroare: `Nu am putut șterge avizul: ${error.message}` }, { status: 500 });
  }

  if (aviz?.poza_path) {
    await supabase.storage.from(BUCKET).remove([aviz.poza_path]);
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";
import type { ProdusNou } from "@/lib/types";

const BUCKET = "cheltuieli-poze";
const MARIME_MAXIMA = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const formData = await req.formData();
  const poza = formData.get("poza");
  const santierId = String(formData.get("santier_id") ?? "").trim();
  const furnizor = String(formData.get("furnizor") ?? "").trim();
  const numarAviz = String(formData.get("numar_aviz") ?? "").trim() || null;
  const dataAviz = String(formData.get("data_aviz") ?? "").trim() || null;
  const campIncertRaw = String(formData.get("camp_incert") ?? "[]");
  const produseRaw = String(formData.get("produse") ?? "[]");

  if (!santierId) {
    return NextResponse.json({ eroare: "Alege șantierul" }, { status: 400 });
  }
  if (!furnizor) {
    return NextResponse.json({ eroare: "Furnizorul este obligatoriu" }, { status: 400 });
  }

  let campIncert: string[] = [];
  try {
    const parsat = JSON.parse(campIncertRaw);
    if (Array.isArray(parsat)) campIncert = parsat;
  } catch {
    // ignoram, ramane lista goala
  }

  let produse: ProdusNou[] = [];
  try {
    const parsat = JSON.parse(produseRaw);
    if (Array.isArray(parsat)) produse = parsat;
  } catch {
    // ignoram
  }
  produse = produse.filter((p) => p.denumire?.trim());
  if (produse.length === 0) {
    return NextResponse.json({ eroare: "Adaugă cel puțin un produs" }, { status: 400 });
  }

  const supabase = creeazaClientAdmin();

  let pozaUrl: string | null = null;
  let pozaPath: string | null = null;

  if (poza instanceof File && poza.size > MARIME_MAXIMA) {
    return NextResponse.json({ eroare: "Fișierul e prea mare (max 4MB)" }, { status: 400 });
  }

  if (poza instanceof File && poza.size > 0) {
    const extensie = poza.type === "application/pdf" ? "pdf" : poza.type === "image/png" ? "png" : "jpg";
    const cale = `${crypto.randomUUID()}.${extensie}`;
    const buffer = Buffer.from(await poza.arrayBuffer());

    const { error: eroareUpload } = await supabase.storage.from(BUCKET).upload(cale, buffer, {
      contentType: poza.type,
      upsert: false,
    });

    if (eroareUpload) {
      return NextResponse.json({ eroare: `Nu am putut salva poza: ${eroareUpload.message}` }, { status: 500 });
    }

    pozaPath = cale;
    pozaUrl = supabase.storage.from(BUCKET).getPublicUrl(cale).data.publicUrl;
  }

  const { data: aviz, error: eroareAviz } = await supabase
    .from("avize")
    .insert({
      santier_id: santierId,
      furnizor,
      numar_aviz: numarAviz,
      data_aviz: dataAviz,
      camp_incert: campIncert,
      poza_url: pozaUrl,
      poza_path: pozaPath,
    })
    .select()
    .single();

  if (eroareAviz) {
    return NextResponse.json({ eroare: `Nu am putut salva avizul: ${eroareAviz.message}` }, { status: 500 });
  }

  const { error: eroareProduse } = await supabase.from("produse").insert(
    produse.map((p) => ({
      aviz_id: aviz.id,
      denumire: p.denumire,
      cantitate: p.cantitate,
      unitate_masura: p.unitate_masura,
      pret_unitar: p.pret_unitar,
      valoare: p.valoare || 0,
      categorie: p.categorie,
    }))
  );

  if (eroareProduse) {
    return NextResponse.json({ eroare: `Avizul s-a salvat, dar produsele nu: ${eroareProduse.message}` }, { status: 500 });
  }

  return NextResponse.json(aviz, { status: 201 });
}

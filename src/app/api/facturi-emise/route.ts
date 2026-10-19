import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";
import { MARCAJ_FACTURA_EMISA } from "@/lib/types";

const BUCKET = "cheltuieli-poze";
const MARIME_MAXIMA = 4 * 1024 * 1024;

function numar(v: FormDataEntryValue | null): number | null {
  const t = String(v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const poza = formData.get("poza");
  const santierId = String(formData.get("santier_id") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const numarFactura = String(formData.get("numar_factura") ?? "").trim() || null;
  const dataFactura = String(formData.get("data_factura") ?? "").trim() || null;
  const moneda = String(formData.get("moneda") ?? "RON") === "EUR" ? "EUR" : "RON";
  const faraTva = numar(formData.get("total_fara_tva"));
  const totalCuTva = numar(formData.get("total_cu_tva"));
  const forteaza = String(formData.get("forteaza") ?? "") === "true";

  if (!santierId) return NextResponse.json({ eroare: "Alege șantierul" }, { status: 400 });
  if (!client) return NextResponse.json({ eroare: "Clientul este obligatoriu" }, { status: 400 });
  if (totalCuTva === null || totalCuTva <= 0) {
    return NextResponse.json({ eroare: "Completează totalul facturii (cu TVA)" }, { status: 400 });
  }

  const supabase = creeazaClientAdmin();

  // Duplicat: același număr de factură emisă pe același șantier.
  if (numarFactura && !forteaza) {
    const { data: existente } = await supabase
      .from("avize")
      .select("id, numar_aviz, camp_incert")
      .eq("santier_id", santierId)
      .ilike("numar_aviz", numarFactura);
    const existent = (existente ?? []).find((e) => (e.camp_incert ?? []).includes(MARCAJ_FACTURA_EMISA));
    if (existent) {
      return NextResponse.json(
        { posibilDuplicat: true, eroare: `Ai mai adăugat factura ${existent.numar_aviz} pe acest șantier.` },
        { status: 409 }
      );
    }
  }

  let pozaUrl: string | null = null;
  let pozaPath: string | null = null;

  if (poza instanceof File && poza.size > MARIME_MAXIMA) {
    return NextResponse.json({ eroare: "Fișierul e prea mare (max 4MB)" }, { status: 400 });
  }
  if (poza instanceof File && poza.size > 0) {
    const extensie = poza.type === "application/pdf" ? "pdf" : poza.type === "image/png" ? "png" : "jpg";
    const cale = `${crypto.randomUUID()}.${extensie}`;
    const buffer = Buffer.from(await poza.arrayBuffer());
    const { error: eroareUpload } = await supabase.storage.from(BUCKET).upload(cale, buffer, { contentType: poza.type, upsert: false });
    if (eroareUpload) {
      return NextResponse.json({ eroare: `Nu am putut salva poza: ${eroareUpload.message}` }, { status: 500 });
    }
    pozaPath = cale;
    pozaUrl = supabase.storage.from(BUCKET).getPublicUrl(cale).data.publicUrl;
  }

  const { data: factura, error: eroareFactura } = await supabase
    .from("avize")
    .insert({
      santier_id: santierId,
      furnizor: client,
      numar_aviz: numarFactura,
      data_aviz: dataFactura,
      moneda,
      camp_incert: [MARCAJ_FACTURA_EMISA],
      poza_url: pozaUrl,
      poza_path: pozaPath,
    })
    .select()
    .single();
  if (eroareFactura) {
    return NextResponse.json({ eroare: `Nu am putut salva factura: ${eroareFactura.message}` }, { status: 500 });
  }

  const { error: eroareProdus } = await supabase.from("produse").insert({
    aviz_id: factura.id,
    denumire: "Factură emisă",
    cantitate: null,
    unitate_masura: null,
    pret_unitar: faraTva,
    valoare: totalCuTva,
    categorie: "diverse",
  });
  if (eroareProdus) {
    await supabase.from("avize").delete().eq("id", factura.id);
    return NextResponse.json({ eroare: `Nu am putut salva totalul: ${eroareProdus.message}` }, { status: 500 });
  }

  return NextResponse.json(factura, { status: 201 });
}

import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const corp = await req.json();
  const client = String(corp.client ?? "").trim();
  const numarFactura = String(corp.numar_factura ?? "").trim() || null;
  const dataFactura = String(corp.data_factura ?? "").trim() || null;
  const moneda = corp.moneda === "EUR" ? "EUR" : "RON";
  const faraTva = corp.total_fara_tva === null || corp.total_fara_tva === "" ? null : Number(corp.total_fara_tva);
  const totalCuTva = Number(corp.total_cu_tva);

  if (!client) return NextResponse.json({ eroare: "Clientul este obligatoriu" }, { status: 400 });
  if (!Number.isFinite(totalCuTva) || totalCuTva <= 0) {
    return NextResponse.json({ eroare: "Completează totalul facturii (cu TVA)" }, { status: 400 });
  }

  const supabase = creeazaClientAdmin();

  const { error } = await supabase
    .from("avize")
    .update({ furnizor: client, numar_aviz: numarFactura, data_aviz: dataFactura, moneda })
    .eq("id", params.id);
  if (error) return NextResponse.json({ eroare: `Nu am putut actualiza factura: ${error.message}` }, { status: 500 });

  await supabase.from("produse").delete().eq("aviz_id", params.id);
  const { error: eroareProdus } = await supabase.from("produse").insert({
    aviz_id: params.id,
    denumire: "Factură emisă",
    pret_unitar: faraTva !== null && Number.isFinite(faraTva) ? faraTva : null,
    valoare: totalCuTva,
    categorie: "diverse",
  });
  if (eroareProdus) return NextResponse.json({ eroare: `Nu am putut salva totalul: ${eroareProdus.message}` }, { status: 500 });

  return NextResponse.json({ ok: true });
}

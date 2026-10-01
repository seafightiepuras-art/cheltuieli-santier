import { NextResponse } from "next/server";
import { creeazaClientAdmin } from "@/lib/supabase/admin";
import { CATEGORII } from "@/lib/types";

function celulaCSV(v: unknown): string {
  const text = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const santierId = searchParams.get("santier_id");

  const supabase = creeazaClientAdmin();

  let interogare = supabase
    .from("avize")
    .select("numar_aviz, furnizor, data_aviz, moneda, santiere(nume), produse(denumire, cantitate, unitate_masura, pret_unitar, valoare, categorie)")
    .order("data_aviz", { ascending: true });
  if (santierId) interogare = interogare.eq("santier_id", santierId);

  const { data, error } = await interogare;
  if (error) {
    return NextResponse.json({ eroare: error.message }, { status: 500 });
  }

  const etichetaCategorie = new Map(CATEGORII.map((c) => [c.valoare, c.eticheta]));

  const randuri: string[][] = [
    ["Șantier", "Nr. aviz", "Furnizor", "Data", "Monedă", "Produs", "Cantitate", "UM", "Preț unitar", "Valoare", "Categorie"],
  ];

  for (const aviz of (data ?? []) as any[]) {
    for (const p of aviz.produse ?? []) {
      randuri.push([
        aviz.santiere?.nume ?? "—",
        aviz.numar_aviz ?? "",
        aviz.furnizor,
        aviz.data_aviz ?? "",
        aviz.moneda ?? "RON",
        p.denumire,
        p.cantitate ?? "",
        p.unitate_masura ?? "",
        p.pret_unitar ?? "",
        p.valoare ?? "",
        etichetaCategorie.get(p.categorie) ?? p.categorie,
      ]);
    }
  }

  const csv = randuri.map((r) => r.map(celulaCSV).join(",")).join("\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cheltuieli${santierId ? "-santier" : ""}.csv"`,
    },
  });
}

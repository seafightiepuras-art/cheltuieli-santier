import "server-only";
import { creeazaClientServer } from "./supabase/server";
import type { Aviz, Santier } from "./types";

export interface SantierCuTotal extends Santier {
  totalCheltuit: number;
}

/** Toate șantierele, cu totalul cheltuit (suma produselor de pe toate avizele lor). */
export async function fetchSantiere(): Promise<SantierCuTotal[]> {
  const supabase = creeazaClientServer();
  const [{ data: santiere }, { data: avizeCuProduse }] = await Promise.all([
    supabase.from("santiere").select("*").order("nume"),
    supabase.from("avize").select("santier_id, produse(valoare)"),
  ]);

  const totalPeSantier = new Map<string, number>();
  for (const a of (avizeCuProduse ?? []) as { santier_id: string; produse: { valoare: number }[] }[]) {
    const total = (a.produse ?? []).reduce((s, p) => s + Number(p.valoare ?? 0), 0);
    totalPeSantier.set(a.santier_id, (totalPeSantier.get(a.santier_id) ?? 0) + total);
  }

  return (santiere ?? []).map((s) => ({ ...s, totalCheltuit: totalPeSantier.get(s.id) ?? 0 }));
}

export async function fetchSantier(id: string): Promise<Santier | null> {
  const supabase = creeazaClientServer();
  const { data } = await supabase.from("santiere").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function fetchAviz(id: string): Promise<Aviz | null> {
  const supabase = creeazaClientServer();
  const { data } = await supabase.from("avize").select("*, produse(*)").eq("id", id).maybeSingle();
  return data as Aviz | null;
}

/** Toate avizele unui șantier, cu produsele lor — pentru dashboard-ul de șantier. */
export async function fetchAvizeSantier(santierId: string): Promise<Aviz[]> {
  const supabase = creeazaClientServer();
  const { data } = await supabase
    .from("avize")
    .select("*, produse(*)")
    .eq("santier_id", santierId)
    .order("data_aviz", { ascending: false, nullsFirst: false })
    .order("creat_la", { ascending: false });
  return (data ?? []) as Aviz[];
}

/** Nume de furnizori folosiți deja, pentru sugestii la completare (evită "Ciment SRL" vs "ciment srl"). */
export async function fetchFurnizoriCunoscuti(): Promise<string[]> {
  const supabase = creeazaClientServer();
  const { data } = await supabase.from("avize").select("furnizor");
  const unici = new Set((data ?? []).map((r) => r.furnizor).filter(Boolean));
  return Array.from(unici).sort((a, b) => a.localeCompare(b));
}


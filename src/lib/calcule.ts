// Funcții pure, fără dependințe de server — pot fi importate atât din
// componente de server, cât și din componente de client (spre deosebire de
// src/lib/date.ts, care e marcat "server-only").
import type { Aviz, CategorieCheltuiala } from "./types";

export interface TotalPeCategorie {
  categorie: CategorieCheltuiala;
  total: number;
}

export function calculeazaTotalePeCategorie(avize: Aviz[]): TotalPeCategorie[] {
  const totaluri = new Map<CategorieCheltuiala, number>();
  for (const a of avize) {
    for (const p of a.produse ?? []) {
      totaluri.set(p.categorie, (totaluri.get(p.categorie) ?? 0) + Number(p.valoare ?? 0));
    }
  }
  return Array.from(totaluri.entries())
    .map(([categorie, total]) => ({ categorie, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalAviz(a: Aviz): number {
  return (a.produse ?? []).reduce((s, p) => s + Number(p.valoare ?? 0), 0);
}

export function avizAreProduseFaraPret(a: Aviz): boolean {
  const produse = a.produse ?? [];
  return produse.length > 0 && produse.every((p) => !p.valoare);
}

// Funcții pure, fără dependințe de server — pot fi importate atât din
// componente de server, cât și din componente de client (spre deosebire de
// src/lib/date.ts, care e marcat "server-only").
import type { Aviz, CategorieCheltuiala, Moneda } from "./types";

export interface TotalPeCategorie {
  categorie: CategorieCheltuiala;
  moneda: Moneda;
  total: number;
}

export interface TotalPeMoneda {
  moneda: Moneda;
  total: number;
}

// Avizele în monede diferite NU se adună între ele (n-avem curs valutar de
// încredere) — totalurile se calculează mereu separat, pe fiecare monedă.

export function calculeazaTotalePeCategorie(avize: Aviz[]): TotalPeCategorie[] {
  const totaluri = new Map<string, number>();
  for (const a of avize) {
    for (const p of a.produse ?? []) {
      const cheie = `${a.moneda}|${p.categorie}`;
      totaluri.set(cheie, (totaluri.get(cheie) ?? 0) + Number(p.valoare ?? 0));
    }
  }
  return Array.from(totaluri.entries())
    .map(([cheie, total]) => {
      const [moneda, categorie] = cheie.split("|") as [Moneda, CategorieCheltuiala];
      return { moneda, categorie, total };
    })
    .sort((a, b) => b.total - a.total);
}

export function calculeazaTotalePeMoneda(avize: Aviz[]): TotalPeMoneda[] {
  const totaluri = new Map<Moneda, number>();
  for (const a of avize) {
    totaluri.set(a.moneda, (totaluri.get(a.moneda) ?? 0) + totalAviz(a));
  }
  return Array.from(totaluri.entries())
    .map(([moneda, total]) => ({ moneda, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalAviz(a: Aviz): number {
  return (a.produse ?? []).reduce((s, p) => s + Number(p.valoare ?? 0), 0);
}

export function avizAreProduseFaraPret(a: Aviz): boolean {
  const produse = a.produse ?? [];
  return produse.length > 0 && produse.every((p) => !p.valoare);
}

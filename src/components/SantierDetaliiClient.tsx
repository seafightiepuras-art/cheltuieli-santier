"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORII } from "@/lib/types";
import type { Aviz, Santier } from "@/lib/types";
import { formateazaData, formateazaSuma } from "@/lib/format";
import { avizAreProduseFaraPret, totalAviz } from "@/lib/calcule";

function lunaDinData(data: string | null): string | null {
  if (!data) return null;
  return data.slice(0, 7); // "YYYY-MM"
}

function etichetaLuna(luna: string): string {
  const [an, luna2] = luna.split("-");
  const nume = new Date(Number(an), Number(luna2) - 1, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
  return nume.charAt(0).toUpperCase() + nume.slice(1);
}

export function SantierDetaliiClient({ santier, avize }: { santier: Santier; avize: Aviz[] }) {
  const router = useRouter();
  const [cautare, setCautare] = useState("");
  const [lunaAleasa, setLunaAleasa] = useState("toate");
  const [seSterge, setSeSterge] = useState<string | null>(null);

  const luniDisponibile = useMemo(() => {
    const set = new Set<string>();
    for (const a of avize) {
      const l = lunaDinData(a.data_aviz);
      if (l) set.add(l);
    }
    return Array.from(set).sort().reverse();
  }, [avize]);

  const avizeFiltrate = useMemo(() => {
    const text = cautare.trim().toLowerCase();
    return avize.filter((a) => {
      if (lunaAleasa !== "toate" && lunaDinData(a.data_aviz) !== lunaAleasa) return false;
      if (!text) return true;
      return (a.numar_aviz ?? "").toLowerCase().includes(text) || a.furnizor.toLowerCase().includes(text);
    });
  }, [avize, cautare, lunaAleasa]);

  const totalFiltrat = avizeFiltrate.reduce((s, a) => s + totalAviz(a), 0);

  const totalePeCategorie = useMemo(() => {
    const totaluri = new Map<string, number>();
    for (const a of avizeFiltrate) {
      for (const p of a.produse ?? []) {
        totaluri.set(p.categorie, (totaluri.get(p.categorie) ?? 0) + Number(p.valoare ?? 0));
      }
    }
    return CATEGORII.map((c) => ({ ...c, total: totaluri.get(c.valoare) ?? 0 })).filter((c) => c.total > 0);
  }, [avizeFiltrate]);

  const avizeFaraPret = avizeFiltrate.filter(avizAreProduseFaraPret);

  async function sterge(id: string) {
    if (!confirm("Ștergi acest aviz? Nu se poate anula.")) return;
    setSeSterge(id);
    const res = await fetch(`/api/avize/${id}`, { method: "DELETE" });
    setSeSterge(null);
    if (!res.ok) {
      alert("Nu am putut șterge avizul.");
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-24">
      <header className="flex items-center justify-between pt-4">
        <div>
          <Link href="/" className="text-sm text-slate-500">
            ← Toate șantierele
          </Link>
          <h1 className="text-2xl font-bold">{santier.nume}</h1>
        </div>
        <a href={`/api/export?santier_id=${santier.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">
          Export CSV ↓
        </a>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total cheltuit{lunaAleasa !== "toate" ? ` — ${etichetaLuna(lunaAleasa)}` : ""}</p>
        <p className="text-3xl font-bold">{formateazaSuma(totalFiltrat)}</p>

        {totalePeCategorie.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {totalePeCategorie.map((c) => (
              <div key={c.valoare} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.eticheta}</span>
                <span className="font-medium">{formateazaSuma(c.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {avizeFaraPret.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ {avizeFaraPret.length} {avizeFaraPret.length === 1 ? "aviz nu are" : "avize nu au"} preț completat — cheltuiala reală e mai mare
          decât totalul de mai sus.
        </p>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 p-2 text-sm"
          placeholder="Caută după nr. aviz sau furnizor…"
          value={cautare}
          onChange={(e) => setCautare(e.target.value)}
        />
        {luniDisponibile.length > 0 && (
          <select className="rounded-lg border border-slate-300 p-2 text-sm" value={lunaAleasa} onChange={(e) => setLunaAleasa(e.target.value)}>
            <option value="toate">Toate lunile</option>
            {luniDisponibile.map((l) => (
              <option key={l} value={l}>
                {etichetaLuna(l)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {avizeFiltrate.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">Niciun aviz aici.</p>
        )}
        {avizeFiltrate.map((a) => {
          const total = totalAviz(a);
          const faraPret = avizAreProduseFaraPret(a);
          return (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{a.furnizor}</p>
                  <p className="text-xs text-slate-500">
                    {a.numar_aviz ? `Aviz ${a.numar_aviz} · ` : ""}
                    {formateazaData(a.data_aviz)}
                  </p>
                </div>
                <div className="text-right">
                  {faraPret ? <span className="text-xs font-medium text-amber-600">fără preț</span> : <span className="font-semibold">{formateazaSuma(total)}</span>}
                </div>
              </div>
              {a.produse && a.produse.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{a.produse.map((p) => p.denumire).join(", ")}</p>
              )}
              <div className="mt-2 flex gap-3 text-xs">
                {a.poza_url && (
                  <a href={a.poza_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 underline">
                    Vezi poza
                  </a>
                )}
                <Link href={`/aviz/${a.id}/editeaza`} className="text-slate-500 underline">
                  Editează
                </Link>
                <button onClick={() => sterge(a.id)} disabled={seSterge === a.id} className="text-red-500 underline disabled:opacity-50">
                  {seSterge === a.id ? "Se șterge…" : "Șterge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={`/adauga?santier=${santier.id}`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl text-white shadow-lg"
        aria-label="Adaugă aviz"
      >
        +
      </Link>
    </main>
  );
}

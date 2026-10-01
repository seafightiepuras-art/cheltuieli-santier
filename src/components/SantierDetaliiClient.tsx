"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORII } from "@/lib/types";
import type { Aviz, Santier } from "@/lib/types";
import { formateazaData, formateazaSuma } from "@/lib/format";
import { avizAreProduseFaraPret, calculeazaTotalePeCategorie, calculeazaTotalePeMoneda, totalAviz } from "@/lib/calcule";

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

  const totalePeMoneda = useMemo(() => calculeazaTotalePeMoneda(avizeFiltrate), [avizeFiltrate]);

  const totalePeCategorie = useMemo(() => {
    const etichetaCategorie = new Map(CATEGORII.map((c) => [c.valoare, c.eticheta]));
    return calculeazaTotalePeCategorie(avizeFiltrate).map((t) => ({
      ...t,
      eticheta: etichetaCategorie.get(t.categorie) ?? t.categorie,
    }));
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
      <header className="flex items-center justify-between pt-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-pink-500">
            ← Toate șantierele
          </Link>
          <h1 className="font-fancy text-3xl text-pink-600">{santier.nume}</h1>
        </div>
        <a
          href={`/api/export?santier_id=${santier.id}`}
          className="rounded-full border-2 border-pink-300 px-3 py-2 text-sm font-semibold text-pink-600"
        >
          Export CSV ↓
        </a>
      </header>

      <div className="rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm">
        <p className="text-sm font-medium text-pink-400">Total cheltuit{lunaAleasa !== "toate" ? ` — ${etichetaLuna(lunaAleasa)}` : ""}</p>
        {totalePeMoneda.length === 0 && <p className="text-3xl font-bold text-rose-700">{formateazaSuma(0)}</p>}
        <div className="flex flex-wrap items-baseline gap-x-4">
          {totalePeMoneda.map((t) => (
            <p key={t.moneda} className="text-3xl font-bold text-rose-700">
              {formateazaSuma(t.total, t.moneda)}
            </p>
          ))}
        </div>

        {totalePeCategorie.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {totalePeCategorie.map((c) => (
              <div key={`${c.moneda}-${c.categorie}`} className="flex items-center justify-between text-sm">
                <span className="text-rose-500">{c.eticheta}</span>
                <span className="font-semibold text-rose-700">{formateazaSuma(c.total, c.moneda)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {avizeFaraPret.length > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ {avizeFaraPret.length} {avizeFaraPret.length === 1 ? "aviz nu are" : "avize nu au"} preț completat — cheltuiala reală e mai mare
          decât totalul de mai sus.
        </p>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-full border border-pink-200 bg-white/85 p-2 px-4 text-sm text-rose-800 placeholder:text-pink-300 focus:outline-none"
          placeholder="🔍 Caută după nr. aviz sau furnizor…"
          value={cautare}
          onChange={(e) => setCautare(e.target.value)}
        />
        {luniDisponibile.length > 0 && (
          <select
            className="rounded-full border border-pink-200 bg-white/85 p-2 px-3 text-sm text-rose-800"
            value={lunaAleasa}
            onChange={(e) => setLunaAleasa(e.target.value)}
          >
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
          <p className="rounded-2xl border-2 border-dashed border-pink-300 bg-white/70 p-6 text-center text-sm text-pink-400 backdrop-blur-sm">
            Niciun aviz aici 🌸
          </p>
        )}
        {avizeFiltrate.map((a) => {
          const total = totalAviz(a);
          const faraPret = avizAreProduseFaraPret(a);
          return (
            <div key={a.id} className="rounded-2xl border border-pink-200 bg-white/85 p-3 shadow-sm shadow-pink-100 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-rose-800">{a.furnizor}</p>
                  <p className="text-xs text-pink-400">
                    {a.numar_aviz ? `Aviz ${a.numar_aviz} · ` : ""}
                    {formateazaData(a.data_aviz)}
                  </p>
                </div>
                <div className="text-right">
                  {faraPret ? (
                    <span className="text-xs font-semibold text-amber-600">fără preț</span>
                  ) : (
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 font-semibold text-pink-600">{formateazaSuma(total, a.moneda)}</span>
                  )}
                </div>
              </div>
              {a.produse && a.produse.length > 0 && (
                <p className="mt-1 text-xs text-pink-400">{a.produse.map((p) => p.denumire).join(", ")}</p>
              )}
              <div className="mt-2 flex gap-3 text-xs">
                {a.poza_url && (
                  <a href={a.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-pink-500 underline">
                    Vezi poza
                  </a>
                )}
                <Link href={`/aviz/${a.id}/editeaza`} className="font-medium text-pink-500 underline">
                  Editează
                </Link>
                <button onClick={() => sterge(a.id)} disabled={seSterge === a.id} className="font-medium text-red-400 underline disabled:opacity-50">
                  {seSterge === a.id ? "Se șterge…" : "Șterge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={`/adauga?santier=${santier.id}`}
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-3xl text-white shadow-lg shadow-pink-300 transition hover:scale-105"
        aria-label="Adaugă aviz"
      >
        +
      </Link>
    </main>
  );
}

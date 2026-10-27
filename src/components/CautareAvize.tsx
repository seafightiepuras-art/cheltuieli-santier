"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Aviz } from "@/lib/types";
import { totalAviz } from "@/lib/calcule";
import { formateazaData, formateazaSuma } from "@/lib/format";

const PE_PAGINA = 60;

/** Fără diacritice și fără majuscule, ca „tomsani” să găsească „Tomșani”. */
const simplu = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function textAviz(a: Aviz): string {
  const total = totalAviz(a);
  const data = a.data_aviz ? formateazaData(a.data_aviz) : "";
  return simplu(
    [
      a.furnizor,
      a.numar_aviz ?? "",
      a.santiere?.nume ?? "",
      data,
      a.data_aviz ?? "",
      (a.produse ?? []).map((p) => p.denumire).join(" "),
      total.toFixed(2),
      total.toFixed(2).replace(".", ","),
      String(Math.round(total)),
    ].join(" ")
  );
}

export function CautareAvize({ avize }: { avize: Aviz[] }) {
  const [text, setText] = useState("");
  const [santier, setSantier] = useState("");
  const [cate, setCate] = useState(PE_PAGINA);

  const indexate = useMemo(() => avize.map((a) => ({ a, t: textAviz(a) })), [avize]);
  const santiere = useMemo(() => Array.from(new Set(avize.map((a) => a.santiere?.nume).filter((n): n is string => !!n))).sort((x, y) => x.localeCompare(y)), [avize]);

  const gasite = useMemo(() => {
    const cuvinte = simplu(text).split(/\s+/).filter(Boolean);
    return indexate.filter(({ a, t }) => (!santier || a.santiere?.nume === santier) && cuvinte.every((c) => t.includes(c))).map((x) => x.a);
  }, [indexate, text, santier]);

  const totaluri = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of gasite) m.set(a.moneda, (m.get(a.moneda) ?? 0) + totalAviz(a));
    return Array.from(m.entries());
  }, [gasite]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        autoFocus
        placeholder="Furnizor, nr. aviz, produs, sumă, dată sau șantier…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setCate(PE_PAGINA);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      <select
        value={santier}
        onChange={(e) => {
          setSantier(e.target.value);
          setCate(PE_PAGINA);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
        aria-label="Filtrează după șantier"
      >
        <option value="">Toate șantierele</option>
        {santiere.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <p className="px-1 text-sm text-slate-500">
        {gasite.length} {gasite.length === 1 ? "aviz găsit" : "avize găsite"} din {avize.length}
        {totaluri.length > 0 && ` · total ${totaluri.map(([m, t]) => formateazaSuma(t, m as "RON" | "EUR")).join(" + ")}`}
      </p>

      {gasite.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Niciun aviz nu se potrivește.</p>}

      <ul className="flex flex-col gap-2">
        {gasite.slice(0, cate).map((a) => {
          const total = totalAviz(a);
          return (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{a.furnizor}</p>
                  <p className="text-sm text-slate-500">
                    {a.numar_aviz ? `Aviz ${a.numar_aviz} · ` : ""}
                    {formateazaData(a.data_aviz)}
                  </p>
                  {a.santiere?.nume && (
                    <Link href={`/santier/${a.santier_id}`} className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
                      🏗️ {a.santiere.nume}
                    </Link>
                  )}
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">{total > 0 ? formateazaSuma(total, a.moneda) : <span className="text-xs font-semibold text-amber-700">fără preț</span>}</p>
              </div>
              {a.produse && a.produse.length > 0 && <p className="mt-1 text-sm text-slate-500">{a.produse.map((p) => p.denumire).join(", ")}</p>}
              <div className="mt-2 flex gap-4 text-sm">
                {a.poza_url && (
                  <a href={a.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 underline">
                    Vezi poza
                  </a>
                )}
                <Link href={`/aviz/${a.id}/editeaza`} className="font-medium text-slate-700 underline">
                  Corectează
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {gasite.length > cate && (
        <button type="button" onClick={() => setCate((c) => c + PE_PAGINA)} className="rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm">
          Arată încă {Math.min(PE_PAGINA, gasite.length - cate)} din {gasite.length - cate}
        </button>
      )}
    </div>
  );
}

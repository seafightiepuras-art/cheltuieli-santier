"use client";

import { useMemo, useState } from "react";
import type { Aviz } from "@/lib/types";
import type { FacturaPrimita, NealocatPeMoneda } from "@/lib/facturi-tipuri";
import { formateazaData, formateazaSuma } from "@/lib/format";
import { totalAviz } from "@/lib/calcule";

const URL_CENTRALIZATOR = "https://facturi-app-steel.vercel.app";

function normalizeaza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(s\.?r\.?l\.?|s\.?a\.?|srl|sa|romania)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function CardFactura({
  f,
  avizeSantier,
  acopera,
  onSchimbat,
}: {
  f: FacturaPrimita;
  avizeSantier: Aviz[];
  acopera: Record<string, string[]>;
  onSchimbat: () => void;
}) {
  const [deschis, setDeschis] = useState(false);
  const acoperite = acopera[f.id] ?? [];
  const [alese, setAlese] = useState<string[]>(acoperite);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  // avizele acestui șantier care nu sunt acoperite de ALTĂ factură; cele ale aceluiași furnizor, primele
  const acopriteDeAlta = useMemo(() => {
    const s = new Set<string>();
    for (const [fid, lista] of Object.entries(acopera)) if (fid !== f.id) for (const a of lista) s.add(a);
    return s;
  }, [acopera, f.id]);
  const candidate = useMemo(() => {
    const nf = normalizeaza(f.furnizor);
    return avizeSantier
      .filter((a) => !acopriteDeAlta.has(a.id) && a.moneda === (f.moneda === "EUR" ? "EUR" : "RON"))
      .sort((a, b) => {
        const sa = normalizeaza(a.furnizor) === nf ? 0 : 1;
        const sb = normalizeaza(b.furnizor) === nf ? 0 : 1;
        return sa - sb || (b.data_aviz ?? "").localeCompare(a.data_aviz ?? "");
      });
  }, [avizeSantier, acopriteDeAlta, f.furnizor, f.moneda]);

  const sumaAlese = alese.reduce((s, id) => s + totalAviz(avizeSantier.find((a) => a.id === id) ?? ({ produse: [] } as unknown as Aviz)), 0);
  const diferenta = Math.round((f.sumaAlocata - sumaAlese) * 100) / 100;
  const avizeAcoperite = avizeSantier.filter((a) => acoperite.includes(a.id));

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(null);
    const res = await fetch("/api/facturare", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facturaId: f.id, avizIds: alese }) });
    const corp = await res.json().catch(() => ({}));
    setSeSalveaza(false);
    if (!res.ok) return setEroare(corp.eroare ?? "Nu am putut salva.");
    setDeschis(false);
    onSchimbat();
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{f.furnizor}</h3>
          <p className="text-sm text-slate-500">
            {f.numar ? `Factura ${f.numar} · ` : ""}
            {formateazaData(f.data)}
            {f.platit ? " · plătită" : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-slate-900">{formateazaSuma(f.sumaAlocata, f.moneda === "EUR" ? "EUR" : "RON")}</p>
          <p className="text-xs tabular-nums text-slate-500">fără TVA {formateazaSuma(f.sumaFaraTva, f.moneda === "EUR" ? "EUR" : "RON")}</p>
        </div>
      </header>

      {f.sumaAlocata < f.totalFactura - 0.01 && (
        <p className="mt-1 text-xs text-slate-500">Din totalul facturii de {formateazaSuma(f.totalFactura, f.moneda === "EUR" ? "EUR" : "RON")}; restul e alocat altor șantiere sau nealocat.</p>
      )}

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
        {avizeAcoperite.length === 0 ? (
          <p className="text-slate-500">Nu acoperă niciun aviz (serviciu, subcontractor sau marfă fără aviz).</p>
        ) : (
          <>
            <p className="font-medium text-slate-700">
              Acoperă {avizeAcoperite.length} {avizeAcoperite.length === 1 ? "aviz" : "avize"} — acestea nu se mai numără separat
            </p>
            <ul className="mt-1 text-slate-600">
              {avizeAcoperite.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {a.furnizor}
                    {a.numar_aviz ? ` · aviz ${a.numar_aviz}` : ""} · {formateazaData(a.data_aviz)}
                  </span>
                  <span className="tabular-nums">{formateazaSuma(totalAviz(a), a.moneda)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" onClick={() => { setAlese(acoperite); setDeschis((d) => !d); }} className="mt-2 text-sm font-medium text-slate-900 underline">
          {deschis ? "Închide" : avizeAcoperite.length ? "Schimbă avizele acoperite" : "Leagă avize"}
        </button>
      </div>

      {deschis && (
        <div className="mt-3 rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-sm text-slate-600">Bifează avizele pe care le acoperă factura (primele sunt ale aceluiași furnizor):</p>
          {candidate.length === 0 && <p className="text-sm text-slate-400">Nu mai sunt avize libere pe acest șantier.</p>}
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {candidate.map((a) => (
              <li key={a.id}>
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={alese.includes(a.id)}
                    onChange={(e) => setAlese((x) => (e.target.checked ? [...x, a.id] : x.filter((y) => y !== a.id)))}
                    className="accent-slate-900"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {a.furnizor}
                    {a.numar_aviz ? ` · aviz ${a.numar_aviz}` : ""} · {formateazaData(a.data_aviz)}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-700">{formateazaSuma(totalAviz(a), a.moneda)}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-sm">
            <span className="text-slate-600">
              Avize bifate: <strong className="tabular-nums">{formateazaSuma(sumaAlese, f.moneda === "EUR" ? "EUR" : "RON")}</strong> · factura alocată:{" "}
              <strong className="tabular-nums">{formateazaSuma(f.sumaAlocata, f.moneda === "EUR" ? "EUR" : "RON")}</strong>
            </span>
            {alese.length > 0 && (
              <span className={Math.abs(diferenta) < 1 ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                {Math.abs(diferenta) < 1 ? "se potrivesc" : `diferență ${formateazaSuma(diferenta, f.moneda === "EUR" ? "EUR" : "RON")}`}
              </span>
            )}
          </div>
          {eroare && <p className="mt-2 text-sm text-red-600">{eroare}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setDeschis(false)} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700">
              Renunță
            </button>
            <button type="button" onClick={salveaza} disabled={seSalveaza} className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {seSalveaza ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </div>
      )}

      {f.pozaUrl && (
        <a href={f.pozaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-slate-600 underline">
          Vezi factura
        </a>
      )}
    </article>
  );
}

export function FacturiPrimiteTab({
  facturi,
  avizeSantier,
  acopera,
  nealocat,
  incarcare,
  eroare,
  onSchimbat,
}: {
  facturi: FacturaPrimita[];
  avizeSantier: Aviz[];
  acopera: Record<string, string[]>;
  nealocat: NealocatPeMoneda[];
  incarcare: boolean;
  eroare: string | null;
  onSchimbat: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
        <p className="text-slate-600">Facturile primite alocate acestui șantier. Alocarea se face în Centralizator Facturi.</p>
        <a href={`${URL_CENTRALIZATOR}/alocare`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white">
          Alocă facturi →
        </a>
      </div>

      {eroare && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Nu am putut aduce facturile: {eroare}</p>}
      {incarcare && facturi.length === 0 && !eroare && <p className="p-4 text-center text-sm text-slate-400">Se aduc facturile din Centralizator…</p>}
      {!incarcare && !eroare && facturi.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Nicio factură primită alocată acestui șantier în perioada aleasă.
        </p>
      )}

      {facturi.map((f) => (
        <CardFactura key={f.id} f={f} avizeSantier={avizeSantier} acopera={acopera} onSchimbat={onSchimbat} />
      ))}

      {nealocat.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Cheltuieli generale (nealocate pe niciun șantier)</p>
          {nealocat.map((n) => (
            <p key={n.moneda} className="tabular-nums">
              {n.nr} {n.nr === 1 ? "factură" : "facturi"} · {formateazaSuma(n.cuTva, n.moneda === "EUR" ? "EUR" : "RON")} cu TVA · {formateazaSuma(n.faraTva, n.moneda === "EUR" ? "EUR" : "RON")} fără TVA
            </p>
          ))}
          <p className="mt-1 text-xs text-amber-800">Nu intră în costul niciunui șantier; rămân separate.</p>
        </div>
      )}
    </div>
  );
}

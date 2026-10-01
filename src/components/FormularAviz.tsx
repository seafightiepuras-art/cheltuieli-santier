"use client";

import { useState } from "react";
import { CATEGORII } from "@/lib/types";
import type { CategorieCheltuiala, Moneda, ProdusNou } from "@/lib/types";

const CAMP_LABEL: Record<string, string> = {
  furnizor: "Furnizor",
  numar_aviz: "Nr. aviz",
  data_aviz: "Data",
  moneda: "Monedă",
  produse: "Produse",
};

function randGol(): ProdusNou {
  return { denumire: "", cantitate: null, unitate_masura: null, pret_unitar: null, valoare: 0, categorie: "diverse" };
}

export interface DateSalvareAviz {
  furnizor: string;
  numar_aviz: string;
  data_aviz: string;
  moneda: Moneda;
  produse: ProdusNou[];
}

const inputClasa = "w-full rounded-xl border p-2 text-rose-800 placeholder:text-pink-300 focus:outline-none";

export function FormularAviz({
  valoriInitiale,
  campIncert = [],
  poza,
  pozaExistentaUrl,
  furnizoriCunoscuti,
  seSalveaza,
  textButonSalveaza = "Salvează avizul",
  onSalveaza,
  onRenunta,
}: {
  valoriInitiale: { furnizor: string; numar_aviz: string; data_aviz: string; moneda: Moneda; produse: ProdusNou[] };
  campIncert?: string[];
  poza: File | null;
  pozaExistentaUrl?: string | null;
  furnizoriCunoscuti: string[];
  seSalveaza: boolean;
  textButonSalveaza?: string;
  onSalveaza: (date: DateSalvareAviz) => void;
  onRenunta: () => void;
}) {
  const [furnizor, setFurnizor] = useState(valoriInitiale.furnizor);
  const [numarAviz, setNumarAviz] = useState(valoriInitiale.numar_aviz);
  const [dataAviz, setDataAviz] = useState(valoriInitiale.data_aviz);
  const [moneda, setMoneda] = useState<Moneda>(valoriInitiale.moneda);
  const [produse, setProduse] = useState<ProdusNou[]>(valoriInitiale.produse.length > 0 ? valoriInitiale.produse : [randGol()]);

  const incert = new Set(campIncert);
  const previewUrl = poza ? URL.createObjectURL(poza) : pozaExistentaUrl ?? null;
  const estePdf = poza?.type === "application/pdf";
  const totalProduse = produse.reduce((s, p) => s + (Number(p.valoare) || 0), 0);
  const areProdusFaraPret = produse.some((p) => p.denumire.trim() && !p.valoare);

  function claseCamp(nume: string) {
    return `${inputClasa} ${incert.has(nume) ? "border-amber-400 bg-amber-50" : "border-pink-200 bg-white/90"}`;
  }
  function labelCamp(nume: string) {
    return incert.has(nume) ? `${CAMP_LABEL[nume]} — verifică` : CAMP_LABEL[nume];
  }

  function actualizeazaRand(i: number, campuri: Partial<ProdusNou>) {
    setProduse((rnd) => rnd.map((r, idx) => (idx === i ? { ...r, ...campuri } : r)));
  }
  function stergeRand(i: number) {
    setProduse((rnd) => rnd.filter((_, idx) => idx !== i));
  }

  function submite(e: React.FormEvent) {
    e.preventDefault();
    if (!furnizor.trim()) return alert("Completează furnizorul.");
    const produseValide = produse.filter((p) => p.denumire.trim());
    if (produseValide.length === 0) return alert("Adaugă cel puțin un produs.");
    onSalveaza({ furnizor: furnizor.trim(), numar_aviz: numarAviz.trim(), data_aviz: dataAviz, moneda, produse: produseValide });
  }

  return (
    <form onSubmit={submite} className="flex flex-col gap-4 rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm">
      {campIncert.length > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Verifică câmpurile evidențiate — nu au putut fi citite cu certitudine de pe poză.
        </p>
      )}
      {areProdusFaraPret && (
        <p className="rounded-xl bg-pink-50 p-3 text-sm text-pink-700">
          ℹ️ Acest aviz are produse fără preț completat — cheltuiala nu se vede în total până nu îl adaugi.
        </p>
      )}

      {previewUrl &&
        (estePdf ? (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-pink-200 p-3 text-sm text-pink-600">
            📄 Deschide PDF-ul
          </a>
        ) : (
          <img src={previewUrl} alt="Poza avizului" className="max-h-48 w-full rounded-xl object-contain" />
        ))}

      <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
        {labelCamp("furnizor")}
        <input className={claseCamp("furnizor")} value={furnizor} onChange={(e) => setFurnizor(e.target.value)} list="lista-furnizori" required />
        <datalist id="lista-furnizori">
          {furnizoriCunoscuti.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {labelCamp("numar_aviz")}
          <input className={claseCamp("numar_aviz")} value={numarAviz} onChange={(e) => setNumarAviz(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {labelCamp("data_aviz")}
          <input type="date" className={claseCamp("data_aviz")} value={dataAviz} onChange={(e) => setDataAviz(e.target.value)} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
        {labelCamp("moneda")}
        <div className="flex gap-2">
          {(["RON", "EUR"] as Moneda[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMoneda(m)}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold ${
                moneda === m
                  ? "border-pink-400 bg-pink-100 text-pink-700"
                  : `${incert.has("moneda") ? "border-amber-400 bg-amber-50" : "border-pink-200 bg-white/90"} text-rose-400`
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <p className={`text-sm font-semibold ${incert.has("produse") ? "text-amber-700" : "text-rose-700"}`}>{labelCamp("produse")}</p>
          <p className="rounded-full bg-pink-100 px-3 py-0.5 text-sm font-semibold text-pink-600">Total: {totalProduse.toFixed(2)} {moneda}</p>
        </div>

        {produse.map((p, i) => (
          <div key={i} className="rounded-xl border border-pink-200 bg-white/70 p-3">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-pink-200 bg-white/90 p-2 text-sm text-rose-800 placeholder:text-pink-300"
                placeholder="Denumire produs (ex. Ciment)"
                value={p.denumire}
                onChange={(e) => actualizeazaRand(i, { denumire: e.target.value })}
              />
              <button type="button" onClick={() => stergeRand(i)} className="px-2 text-pink-400" aria-label="Șterge rândul">
                ✕
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-pink-200 bg-white/90 p-2 text-sm text-rose-800"
                placeholder="Cant."
                value={p.cantitate ?? ""}
                onChange={(e) => actualizeazaRand(i, { cantitate: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                className="rounded-lg border border-pink-200 bg-white/90 p-2 text-sm text-rose-800"
                placeholder="UM"
                value={p.unitate_masura ?? ""}
                onChange={(e) => actualizeazaRand(i, { unitate_masura: e.target.value || null })}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-pink-200 bg-white/90 p-2 text-sm text-rose-800"
                placeholder="Preț unit."
                value={p.pret_unitar ?? ""}
                onChange={(e) => actualizeazaRand(i, { pret_unitar: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-lg border border-pink-300 bg-pink-50 p-2 text-sm font-semibold text-rose-800"
                placeholder="Valoare"
                value={p.valoare ?? ""}
                onChange={(e) => actualizeazaRand(i, { valoare: Number(e.target.value) || 0 })}
              />
            </div>
            <select
              className="mt-2 w-full rounded-lg border border-pink-200 bg-white/90 p-2 text-sm text-rose-800"
              value={p.categorie}
              onChange={(e) => actualizeazaRand(i, { categorie: e.target.value as CategorieCheltuiala })}
            >
              {CATEGORII.map((c) => (
                <option key={c.valoare} value={c.valoare}>
                  {c.eticheta}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setProduse((rnd) => [...rnd, randGol()])}
          className="rounded-xl border-2 border-dashed border-pink-300 py-2 text-sm font-semibold text-pink-500"
        >
          + Adaugă rând
        </button>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onRenunta} className="flex-1 rounded-full border-2 border-pink-200 py-3 font-semibold text-pink-500">
          Renunță
        </button>
        <button
          type="submit"
          disabled={seSalveaza}
          className="flex-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 py-3 font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {seSalveaza ? "Se salvează…" : `💖 ${textButonSalveaza}`}
        </button>
      </div>
    </form>
  );
}

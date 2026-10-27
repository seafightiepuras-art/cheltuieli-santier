"use client";

import { useEffect, useState } from "react";
import { formateazaSuma } from "@/lib/format";
import { SumaAnimata } from "@/components/SumaAnimata";
import type { RaspunsCosturi } from "@/lib/costuri-tipuri";

async function salveazaSetari(corp: Record<string, unknown>) {
  const res = await fetch("/api/costuri-setari", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corp) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.eroare ?? "Nu am putut salva.");
  }
}

function CampNumar({
  valoare,
  eticheta,
  sufix,
  onSalveaza,
}: {
  valoare: number | null | undefined;
  eticheta: string;
  sufix: string;
  onSalveaza: (v: number | null) => Promise<void>;
}) {
  const [text, setText] = useState(valoare === null || valoare === undefined ? "" : String(valoare));
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function lasa() {
    const nou = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (nou !== null && !Number.isFinite(nou)) return;
    if (nou === (valoare ?? null)) return;
    setSeSalveaza(true);
    try {
      await onSalveaza(nou);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Nu am putut salva.");
    }
    setSeSalveaza(false);
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-600">
      {eticheta}
      <input
        type="number"
        step="0.01"
        inputMode="decimal"
        value={text}
        placeholder="0"
        onChange={(e) => setText(e.target.value)}
        onBlur={lasa}
        className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm text-slate-900 focus:outline-none ${seSalveaza ? "opacity-50" : ""}`}
      />
      {sufix}
    </label>
  );
}

function Legatura({ raspuns, santierId, reincarca, deschisImplicit }: { raspuns: RaspunsCosturi; santierId: string; reincarca: (reset?: boolean) => void; deschisImplicit: boolean }) {
  const [alese, setAlese] = useState<string[]>(raspuns.legat ?? []);
  const [deschis, setDeschis] = useState(deschisImplicit);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [salvat, setSalvat] = useState(false);
  const [lista, setLista] = useState<string[] | null>(raspuns.lista?.santiere ?? null);
  const [eroareLista, setEroareLista] = useState<string | null>(null);

  // Lista șantierelor din pontaj se aduce doar când e nevoie (la „Schimbă”)
  useEffect(() => {
    if (!deschis || lista) return;
    let anulat = false;
    fetch("/api/costuri-lista", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (anulat) return;
        if (!r.ok) setEroareLista(j.eroare ?? "Nu am putut aduce lista.");
        else setLista((j as { santiere: string[] }).santiere);
      })
      .catch(() => !anulat && setEroareLista("Nu am putut contacta serverul."));
    return () => {
      anulat = true;
    };
  }, [deschis, lista]);

  async function salveaza() {
    if (seSalveaza || salvat) return; // o singură apăsare e de ajuns
    setSeSalveaza(true);
    try {
      await salveazaSetari({ santierId, legatura: alese });
      setSalvat(true);
      // ne ducem sus, unde apar datele, ca să se vadă că s-a salvat
      document.querySelector("[role=tablist]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setDeschis(false);
      reincarca(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Nu am putut salva.");
      setSeSalveaza(false);
    }
  }

  if (!deschis) {
    return (
      <p className="text-xs text-slate-500">
        Legat de pontaj: <span className="font-semibold text-slate-700">{(raspuns.legat ?? alese).join(", ")}</span>{" "}
        <button onClick={() => setDeschis(true)} className="font-medium text-slate-600 underline">
          Schimbă
        </button>
      </p>
    );
  }

  const butoane = (
    <div className="flex gap-2">
      {raspuns.configurat && (
        <button onClick={() => setDeschis(false)} className="flex-1 rounded-full border-2 border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600">
          Renunță
        </button>
      )}
      <button
        onClick={salveaza}
        disabled={seSalveaza || salvat || alese.length === 0}
        className="flex-1 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 py-2 text-sm font-semibold text-white shadow-md shadow-slate-200 disabled:opacity-50"
      >
        {salvat ? "✔ Salvat" : seSalveaza ? "Se salvează…" : alese.length === 0 ? "Bifează un șantier" : "Salvează legătura"}
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
      <p className="font-semibold text-slate-900">Cu ce șantier din pontaj se leagă acesta?</p>
      <p className="mb-3 text-xs text-slate-500">Bifează unul sau mai multe, apoi apasă „Salvează legătura” (butonul de jos). Costurile lor (oameni, utilaje, motorină) se adună aici.</p>
      {!lista && !eroareLista && <p className="text-sm text-slate-500">Se aduce lista din pontaj…</p>}
      {eroareLista && <p className="text-sm text-red-600">{eroareLista}</p>}
      <div className="flex flex-col gap-1.5">
        {(lista ?? []).map((n) => (
          <label key={n} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={alese.includes(n)}
              onChange={(e) => setAlese((a) => (e.target.checked ? [...a, n] : a.filter((x) => x !== n)))}
              className="accent-slate-900"
            />
            {n}
          </label>
        ))}
      </div>
      <div className="sticky bottom-3 mt-3 rounded-full bg-white p-1 shadow-lg shadow-slate-200">{butoane}</div>
    </div>
  );
}

function Sectiune({ titlu, subtitlu, total, children }: { titlu: string; subtitlu?: string; total?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{titlu}</h3>
          {subtitlu && <p className="text-xs text-slate-500">{subtitlu}</p>}
        </div>
        {total !== undefined && (
          <span className="rounded-full bg-slate-100 px-3 py-0.5 font-semibold text-slate-700">
            <SumaAnimata suma={total} moneda="RON" />
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Linie({ eticheta, suma, subtil }: { eticheta: string; suma: number; subtil?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-0.5 ${subtil ? "text-sm text-slate-500" : ""}`}>
      <dt className={subtil ? "" : "text-slate-700"}>{eticheta}</dt>
      <dd className={subtil ? "" : "font-semibold text-slate-900"}>{formateazaSuma(suma)}</dd>
    </div>
  );
}

export function CosturiInterne({
  santierId,
  raspuns,
  incarcare,
  eroare,
  reincarca,
}: {
  santierId: string;
  raspuns: RaspunsCosturi | null;
  incarcare: boolean;
  eroare: string | null;
  reincarca: (reset?: boolean) => void;
}) {
  if (eroare) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        <p>Nu am putut aduce datele din pontaj: {eroare}</p>
        <button onClick={() => reincarca()} className="mt-2 font-semibold underline">
          Reîncearcă
        </button>
      </div>
    );
  }
  if (!raspuns) {
    return <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">{incarcare ? "Se aduc datele din pontaj…" : ""}</p>;
  }
  if (!raspuns.configurat) {
    return <Legatura raspuns={raspuns} santierId={santierId} reincarca={reincarca} deschisImplicit />;
  }
  if (!raspuns.costuri) {
    return <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">Se aduc datele din pontaj…</p>;
  }

  const c = raspuns.costuri;
  const procent = c.procentDari ?? raspuns.procentDari ?? 40;
  const zileFmt = (z: number) => (Number.isInteger(z) ? String(z) : z.toFixed(1).replace(".", ","));

  return (
    <div className="flex flex-col gap-5">
      <Legatura raspuns={raspuns} santierId={santierId} reincarca={reincarca} deschisImplicit={false} />

      {/* ---------- OAMENI: câte un rând pe fiecare, cu valoarea finală ---------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-100">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold text-xl text-slate-700">Oameni</h2>
          <p className="text-sm font-semibold text-slate-700">
            {c.nrOameni ?? c.oameni.length} {(c.nrOameni ?? c.oameni.length) === 1 ? "om" : "oameni"} · {zileFmt(c.zileOameni ?? 0)} zile
          </p>
        </div>

        {c.oameni.length === 0 && <p className="mt-3 text-center text-sm text-slate-500">Nimeni nu e pontat pe acest șantier în perioada aleasă.</p>}

        <ul className="mt-3 divide-y divide-slate-100">
          {c.oameni.map((o) => (
            <li key={o.angajatId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">{o.nume}</p>
                <p className="text-sm text-slate-600">
                  {zileFmt(o.zile)} {o.zile === 1 ? "zi" : "zile"}
                  {o.tarifZi === null && " · fără tarif în Salarii"}
                </p>
              </div>
              <p className="shrink-0 text-xl font-extrabold text-slate-900">{formateazaSuma(o.total)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Cost total oameni</span>
          <span className="text-2xl font-bold text-slate-900">
            <SumaAnimata suma={c.totalOameni ?? 0} moneda="RON" />
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Fiecare sumă = salariul (zile × tarif din Salarii) + {procent}%. Procentul se schimbă în Pontaj → Salarii.</p>
      </section>

      <Sectiune titlu="Utilaje și camioane" subtitlu="Zile pontate pe acest șantier × tariful pe zi pus de tine" total={c.totalUtilaje}>
        {c.resurse.length === 0 && <p className="text-sm text-slate-500">Niciun utilaj sau camion pontat aici în perioada aleasă.</p>}
        <div className="divide-y divide-slate-100">
          {c.resurse.map((r) => (
            <div key={r.cheie} className="py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {r.nume} <span className="text-xs font-normal text-slate-500">{r.tip === "camion" ? "camion" : "utilaj"}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.zile} {r.zile === 1 ? "zi" : "zile"}
                    {r.litri > 0 && ` · ${r.litri.toFixed(0)} L motorină alocată`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-900">{formateazaSuma(r.costTarif)}</p>
                  {r.costMotorina > 0 && <p className="text-xs text-slate-500">+ {formateazaSuma(r.costMotorina)} motorină</p>}
                </div>
              </div>
              <div className="mt-1.5">
                <CampNumar
                  valoare={r.tarifZi}
                  eticheta="Tarif:"
                  sufix="lei/zi"
                  onSalveaza={async (v) => {
                    await salveazaSetari({ tarife: { [r.cheie]: v } });
                    reincarca();
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <CampNumar
            valoare={raspuns.pretMotorina}
            eticheta="Preț motorină:"
            sufix="lei/L"
            onSalveaza={async (v) => {
              await salveazaSetari({ pretMotorina: v });
              reincarca();
            }}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Motorina fiecărui vehicul (litrii din Alimentări) se împarte pe șantiere după zilele lucrate pe fiecare.
          </p>
        </div>
      </Sectiune>

      <section className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 shadow-md shadow-slate-100">
        <h2 className="mb-2 font-semibold text-xl text-slate-700">Costuri din pontaj, în total</h2>
        <dl className="text-base">
          <Linie eticheta="Oameni" suma={c.totalOameni ?? 0} />
          <Linie eticheta="Utilaje" suma={c.totalUtilaje} />
          <Linie eticheta="Motorină" suma={c.totalMotorina} />
          <div className="mt-2 flex items-center justify-between border-t-2 border-slate-300 pt-2">
            <dt className="font-bold text-slate-900">TOTAL</dt>
            <dd className="text-2xl font-extrabold text-slate-900">{formateazaSuma(c.totalInterne)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">Avizele (materiale etc.) se adaugă sus, în „Cât am băgat vs cât scot".</p>
      </section>
    </div>
  );
}

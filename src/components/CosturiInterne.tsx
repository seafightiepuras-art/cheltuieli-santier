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
    <label className="flex items-center gap-1.5 text-xs text-pink-500">
      {eticheta}
      <input
        type="number"
        step="0.01"
        inputMode="decimal"
        value={text}
        placeholder="0"
        onChange={(e) => setText(e.target.value)}
        onBlur={lasa}
        className={`w-20 rounded-lg border border-pink-200 bg-white/90 px-2 py-1 text-right text-sm text-rose-800 focus:outline-none ${seSalveaza ? "opacity-50" : ""}`}
      />
      {sufix}
    </label>
  );
}

function Legatura({ raspuns, santierId, reincarca, deschisImplicit }: { raspuns: RaspunsCosturi; santierId: string; reincarca: (reset?: boolean) => void; deschisImplicit: boolean }) {
  const [alese, setAlese] = useState<string[]>(raspuns.legat ?? []);
  const [deschis, setDeschis] = useState(deschisImplicit);
  const [seSalveaza, setSeSalveaza] = useState(false);
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
    setSeSalveaza(true);
    try {
      await salveazaSetari({ santierId, legatura: alese });
      setDeschis(false);
      reincarca(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Nu am putut salva.");
    }
    setSeSalveaza(false);
  }

  if (!deschis) {
    return (
      <p className="text-xs text-pink-400">
        Legat de pontaj: <span className="font-semibold text-rose-600">{(raspuns.legat ?? alese).join(", ")}</span>{" "}
        <button onClick={() => setDeschis(true)} className="font-medium text-pink-500 underline">
          Schimbă
        </button>
      </p>
    );
  }

  const butoane = (
    <div className="flex gap-2">
      {raspuns.configurat && (
        <button onClick={() => setDeschis(false)} className="flex-1 rounded-full border-2 border-pink-200 bg-white py-2 text-sm font-semibold text-pink-500">
          Renunță
        </button>
      )}
      <button
        onClick={salveaza}
        disabled={seSalveaza || alese.length === 0}
        className="flex-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 py-2 text-sm font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
      >
        {seSalveaza ? "Se salvează…" : alese.length === 0 ? "Bifează un șantier" : "Salvează legătura"}
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-sm shadow-pink-100 backdrop-blur-sm">
      <p className="font-semibold text-rose-700">Cu ce șantier din pontaj se leagă acesta?</p>
      <p className="mb-3 text-xs text-pink-400">Bifează unul sau mai multe, apoi apasă „Salvează legătura”. Costurile lor (oameni, utilaje, motorină) se adună aici.</p>
      <div className="mb-3">{butoane}</div>
      {!lista && !eroareLista && <p className="text-sm text-pink-400">Se aduce lista din pontaj…</p>}
      {eroareLista && <p className="text-sm text-red-600">{eroareLista}</p>}
      <div className="flex flex-col gap-1.5">
        {(lista ?? []).map((n) => (
          <label key={n} className="flex items-center gap-2 rounded-xl border border-pink-100 bg-white/70 px-3 py-2 text-sm text-rose-800">
            <input
              type="checkbox"
              checked={alese.includes(n)}
              onChange={(e) => setAlese((a) => (e.target.checked ? [...a, n] : a.filter((x) => x !== n)))}
              className="accent-pink-500"
            />
            {n}
          </label>
        ))}
      </div>
      <div className="sticky bottom-3 mt-3 rounded-full bg-white/90 p-1 shadow-lg shadow-pink-200 backdrop-blur-sm">{butoane}</div>
    </div>
  );
}

function Sectiune({ titlu, subtitlu, total, children }: { titlu: string; subtitlu?: string; total?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-sm shadow-pink-100 backdrop-blur-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="font-semibold text-rose-700">{titlu}</h3>
          {subtitlu && <p className="text-xs text-pink-400">{subtitlu}</p>}
        </div>
        {total !== undefined && (
          <span className="rounded-full bg-pink-100 px-3 py-0.5 font-semibold text-pink-600">
            <SumaAnimata suma={total} moneda="RON" />
          </span>
        )}
      </div>
      {children}
    </section>
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
    return <p className="rounded-2xl bg-white/70 p-4 text-center text-sm text-pink-400">{incarcare ? "Se aduc datele din pontaj…" : ""}</p>;
  }
  if (!raspuns.configurat) {
    return <Legatura raspuns={raspuns} santierId={santierId} reincarca={reincarca} deschisImplicit />;
  }
  if (!raspuns.costuri) {
    return <p className="rounded-2xl bg-white/70 p-4 text-center text-sm text-pink-400">Se aduc datele din pontaj…</p>;
  }

  const c = raspuns.costuri;

  return (
    <div className="flex flex-col gap-4">
      <Legatura raspuns={raspuns} santierId={santierId} reincarca={reincarca} deschisImplicit={false} />

      <div className="grid grid-cols-2 gap-3">
        {[
          { eticheta: "Manoperă", suma: c.totalManopera },
          { eticheta: "Utilaje", suma: c.totalUtilaje },
          { eticheta: "Motorină", suma: c.totalMotorina },
          { eticheta: "Total costuri", suma: c.totalInterne, accent: true },
        ].map((p, i) => (
          <div
            key={p.eticheta}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`apare rounded-2xl border p-3 text-center shadow-sm backdrop-blur-sm ${p.accent ? "border-pink-300 bg-pink-50/90" : "border-pink-200 bg-white/85"}`}
          >
            <p className="text-xs font-medium text-pink-400">{p.eticheta}</p>
            <p className="text-lg font-bold text-rose-700">
              <SumaAnimata suma={p.suma} moneda="RON" />
            </p>
          </div>
        ))}
      </div>

      <Sectiune titlu="Manoperă" total={c.totalManopera}>
        {c.oameni.length === 0 && <p className="text-sm text-pink-400">Nimeni nu e pontat pe acest șantier în perioada aleasă.</p>}
        <div className="divide-y divide-pink-100">
          {c.oameni.map((o) => (
            <div key={o.angajatId} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="font-medium text-rose-800">{o.nume}</p>
                <p className="text-xs text-pink-400">
                  {o.zile} {o.zile === 1 ? "zi" : "zile"}
                  {o.tarifZi !== null
                    ? o.salariuFix !== null
                      ? ` × ${formateazaSuma(o.tarifZi)} (salariu fix ${formateazaSuma(o.salariuFix)} ÷ 22)`
                      : ` × ${formateazaSuma(o.tarifZi)}`
                    : " · fără tarif în Salarii"}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-rose-700">{formateazaSuma(o.total)}</span>
            </div>
          ))}
        </div>
      </Sectiune>

      <Sectiune titlu="Utilaje și camioane" subtitlu="Zile pontate pe acest șantier × tariful pe zi pus de tine" total={c.totalUtilaje}>
        {c.resurse.length === 0 && <p className="text-sm text-pink-400">Niciun utilaj sau camion pontat aici în perioada aleasă.</p>}
        <div className="divide-y divide-pink-100">
          {c.resurse.map((r) => (
            <div key={r.cheie} className="py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-rose-800">
                    {r.nume} <span className="text-xs font-normal text-pink-400">{r.tip === "camion" ? "camion" : "utilaj"}</span>
                  </p>
                  <p className="text-xs text-pink-400">
                    {r.zile} {r.zile === 1 ? "zi" : "zile"}
                    {r.litri > 0 && ` · ${r.litri.toFixed(0)} L motorină alocată`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-rose-700">{formateazaSuma(r.costTarif)}</p>
                  {r.costMotorina > 0 && <p className="text-xs text-pink-400">+ {formateazaSuma(r.costMotorina)} motorină</p>}
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

        <div className="mt-3 rounded-xl bg-pink-50/80 p-3">
          <CampNumar
            valoare={raspuns.pretMotorina}
            eticheta="Preț motorină:"
            sufix="lei/L"
            onSalveaza={async (v) => {
              await salveazaSetari({ pretMotorina: v });
              reincarca();
            }}
          />
          <p className="mt-1.5 text-xs text-pink-400">
            Motorina fiecărui vehicul (litrii din Alimentări) se împarte pe șantiere după zilele lucrate pe fiecare.
          </p>
        </div>
      </Sectiune>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORII } from "@/lib/types";
import type { Aviz, Moneda, Santier } from "@/lib/types";
import type { RaspunsCosturi } from "@/lib/costuri-tipuri";
import { formateazaData, formateazaSuma } from "@/lib/format";
import { SumaAnimata } from "@/components/SumaAnimata";
import { CosturiInterne } from "@/components/CosturiInterne";
import { avizAreProduseFaraPret, calculeazaTotalePeCategorie, calculeazaTotalePeMoneda, totalAviz } from "@/lib/calcule";

type Tab = "avize" | "facturi" | "costuri";

function lunaDinData(data: string | null): string | null {
  if (!data) return null;
  return data.slice(0, 7); // "YYYY-MM"
}

function etichetaLuna(luna: string): string {
  const [an, luna2] = luna.split("-");
  const nume = new Date(Number(an), Number(luna2) - 1, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
  return nume.charAt(0).toUpperCase() + nume.slice(1);
}

function Rand({ eticheta, suma, moneda, subtil = false, semn }: { eticheta: string; suma: number; moneda: Moneda; subtil?: boolean; semn?: "+" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={subtil ? "text-sm text-pink-400" : "text-sm text-rose-500"}>{eticheta}</span>
      <span className={subtil ? "text-sm font-medium text-rose-600" : "font-semibold text-rose-700"}>
        {semn}
        <SumaAnimata suma={suma} moneda={moneda} />
      </span>
    </div>
  );
}

function Diferenta({ eticheta, valoare, moneda }: { eticheta: string; valoare: number; moneda: Moneda }) {
  const pozitiv = valoare >= 0;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${pozitiv ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
      <span className="text-sm font-semibold">{eticheta}</span>
      <span className="text-lg font-bold">
        {pozitiv ? "+" : "−"}
        <SumaAnimata suma={Math.abs(valoare)} moneda={moneda} />
      </span>
    </div>
  );
}

export function SantierDetaliiClient({ santier, avize, emise }: { santier: Santier; avize: Aviz[]; emise: Aviz[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("avize");
  const [cautare, setCautare] = useState("");
  const [lunaAleasa, setLunaAleasa] = useState("toate");
  const [seSterge, setSeSterge] = useState<string | null>(null);
  const [seStergeFactura, setSeStergeFactura] = useState<string | null>(null);

  // Costurile din pontaj (manoperă, utilaje, motorină)
  const [costuri, setCosturi] = useState<RaspunsCosturi | null>(null);
  const [incarcareCosturi, setIncarcareCosturi] = useState(true);
  const [eroareCosturi, setEroareCosturi] = useState<string | null>(null);
  const [versiuneCosturi, setVersiuneCosturi] = useState(0);
  const reincarcaCosturi = useCallback((reset?: boolean) => {
    if (reset) setCosturi(null); // după schimbarea legăturii, nu lăsăm pe ecran răspunsul vechi
    setVersiuneCosturi((v) => v + 1);
  }, []);

  useEffect(() => {
    let anulat = false;
    setIncarcareCosturi(true);
    setEroareCosturi(null);
    const param = lunaAleasa === "toate" ? "" : `?luna=${lunaAleasa}`;
    fetch(`/api/costuri-santier/${santier.id}${param}`, { cache: "no-store" })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (anulat) return;
        if (!res.ok) setEroareCosturi(j.eroare ?? "Eroare necunoscută.");
        else setCosturi(j as RaspunsCosturi);
      })
      .catch(() => !anulat && setEroareCosturi("Nu am putut contacta serverul."))
      .finally(() => !anulat && setIncarcareCosturi(false));
    return () => {
      anulat = true;
    };
  }, [santier.id, lunaAleasa, versiuneCosturi]);

  // Lista rămâne pe ecran și se actualizează singură cu pontajul și alimentările:
  // la revenirea în aplicație și, cât timp pagina e deschisă, din minut în minut.
  useEffect(() => {
    const actualizeaza = () => {
      if (document.visibilityState === "visible") reincarcaCosturi();
    };
    const interval = setInterval(actualizeaza, 60000);
    document.addEventListener("visibilitychange", actualizeaza);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", actualizeaza);
    };
  }, [reincarcaCosturi]);

  const luniDisponibile = useMemo(() => {
    const set = new Set<string>();
    for (const a of [...avize, ...emise]) {
      const l = lunaDinData(a.data_aviz);
      if (l) set.add(l);
    }
    return Array.from(set).sort().reverse();
  }, [avize, emise]);

  const dinLuna = (a: Aviz) => lunaAleasa === "toate" || lunaDinData(a.data_aviz) === lunaAleasa;

  // Pentru totaluri se iau toate avizele lunii; căutarea filtrează doar lista de avize.
  const avizeLuna = useMemo(() => avize.filter(dinLuna), [avize, lunaAleasa]); // eslint-disable-line react-hooks/exhaustive-deps
  const emiseFiltrate = useMemo(() => emise.filter(dinLuna), [emise, lunaAleasa]); // eslint-disable-line react-hooks/exhaustive-deps

  const avizeFiltrate = useMemo(() => {
    const text = cautare.trim().toLowerCase();
    if (!text) return avizeLuna;
    return avizeLuna.filter((a) => (a.numar_aviz ?? "").toLowerCase().includes(text) || a.furnizor.toLowerCase().includes(text));
  }, [avizeLuna, cautare]);

  const totalePeCategorie = useMemo(() => {
    const etichetaCategorie = new Map(CATEGORII.map((c) => [c.valoare, c.eticheta]));
    return calculeazaTotalePeCategorie(avizeLuna).map((t) => ({ ...t, eticheta: etichetaCategorie.get(t.categorie) ?? t.categorie }));
  }, [avizeLuna]);
  const totalAvizePeMoneda = useMemo(() => calculeazaTotalePeMoneda(avizeLuna), [avizeLuna]);

  const avizeFaraPret = avizeLuna.filter(avizAreProduseFaraPret);

  // Cheltuit vs facturat, separat pe monedă (RON și EUR nu se adună); ambele cu TVA.
  // Costurile interne din pontaj sunt în RON și se adaugă doar la RON.
  const interne = costuri?.configurat && costuri.costuri ? costuri.costuri : null;
  const comparatie = useMemo(() => {
    const cheltuit = new Map(totalAvizePeMoneda.map((t) => [t.moneda, t.total]));
    const facturat = new Map(calculeazaTotalePeMoneda(emiseFiltrate).map((t) => [t.moneda, t.total]));
    const monede = Array.from(new Set<Moneda>([...Array.from(cheltuit.keys()), ...Array.from(facturat.keys()), "RON"])).sort();
    return monede.map((moneda) => {
      const avizeSuma = cheltuit.get(moneda) ?? 0;
      const interneSuma = moneda === "RON" ? interne?.totalInterne ?? 0 : 0;
      const fct = facturat.get(moneda) ?? 0;
      return { moneda, avize: avizeSuma, interne: interneSuma, totalReal: avizeSuma + interneSuma, facturat: fct };
    });
  }, [totalAvizePeMoneda, emiseFiltrate, interne]);
  const maiMulteMonede = comparatie.filter((c) => c.avize > 0 || c.facturat > 0 || c.interne > 0).length > 1;

  async function stergeAviz(id: string) {
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

  async function stergeFactura(id: string) {
    if (!confirm("Ștergi această factură emisă? Nu se poate anula.")) return;
    setSeStergeFactura(id);
    const res = await fetch(`/api/avize/${id}`, { method: "DELETE" });
    setSeStergeFactura(null);
    if (!res.ok) {
      alert("Nu am putut șterge factura.");
      return;
    }
    router.refresh();
  }

  const taburi: { id: Tab; eticheta: string; nr?: number }[] = [
    { id: "avize", eticheta: "Avize", nr: avizeLuna.length },
    { id: "facturi", eticheta: "Facturi emise", nr: emiseFiltrate.length },
    { id: "costuri", eticheta: "Manoperă și utilaje" },
  ];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-28">
      <header className="flex items-center justify-between pt-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-pink-500">
            ← Toate șantierele
          </Link>
          <h1 className="titlu-sclipitor font-fancy text-3xl">{santier.nume}</h1>
        </div>
        <a href={`/api/export?santier_id=${santier.id}`} className="rounded-full border-2 border-pink-300 px-3 py-2 text-sm font-semibold text-pink-600">
          Export CSV ↓
        </a>
      </header>

      {/* ---------- Rezumat: cât am băgat vs cât scot ---------- */}
      <div className="apare rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-pink-400">Cât am băgat vs cât scot</p>
            <p className="text-xs text-pink-300">cu TVA{lunaAleasa !== "toate" ? ` · ${etichetaLuna(lunaAleasa)}` : ""}</p>
          </div>
          {luniDisponibile.length > 0 && (
            <select
              className="rounded-full border border-pink-200 bg-white/85 p-2 px-3 text-sm text-rose-800"
              value={lunaAleasa}
              onChange={(e) => setLunaAleasa(e.target.value)}
              aria-label="Alege luna"
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

        {comparatie
          .filter((c) => c.moneda === "RON" || c.avize > 0 || c.facturat > 0)
          .map((c) => {
            const areInterne = c.interne > 0;
            return (
              <div key={c.moneda} className="mt-4 flex flex-col gap-2">
                {maiMulteMonede && <p className="text-xs font-bold uppercase tracking-wide text-pink-400">{c.moneda}</p>}
                <Rand eticheta="Băgat (avize)" suma={c.avize} moneda={c.moneda} />
                {areInterne && <Rand eticheta="Manoperă, dări, utilaje, motorină" suma={c.interne} moneda={c.moneda} semn="+" />}
                {areInterne && (
                  <div className="border-t border-pink-100 pt-2">
                    <Rand eticheta="Total băgat (cu manoperă și utilaje)" suma={c.totalReal} moneda={c.moneda} />
                  </div>
                )}
                <Rand eticheta="Scos (facturi emise)" suma={c.facturat} moneda={c.moneda} />
                <div className="mt-1 flex flex-col gap-1.5">
                  <Diferenta eticheta={areInterne ? "Diferență, doar avize" : "Diferență (scos − băgat)"} valoare={c.facturat - c.avize} moneda={c.moneda} />
                  {areInterne && <Diferenta eticheta="Diferență, cu manoperă și utilaje" valoare={c.facturat - c.totalReal} moneda={c.moneda} />}
                </div>
              </div>
            );
          })}

        {avizeFaraPret.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">
            ⚠️ {avizeFaraPret.length} {avizeFaraPret.length === 1 ? "aviz nu are" : "avize nu au"} preț completat — cheltuiala reală e mai mare.
          </p>
        )}

        {totalePeCategorie.length > 0 && (
          <details className="mt-3 border-t border-pink-100 pt-2">
            <summary className="cursor-pointer text-sm font-medium text-pink-500">Pe categorii de cheltuieli</summary>
            <div className="mt-2 flex flex-col gap-2">
              {totalePeCategorie.map((c, i) => {
                const totalMoneda = totalAvizePeMoneda.find((t) => t.moneda === c.moneda)?.total ?? 0;
                const pondere = totalMoneda > 0 ? Math.max(3, Math.min(100, (c.total / totalMoneda) * 100)) : 0;
                return (
                  <div key={`${c.moneda}-${c.categorie}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-rose-500">{c.eticheta}</span>
                      <span className="font-semibold text-rose-700">{formateazaSuma(c.total, c.moneda)}</span>
                    </div>
                    <div className="bara-roz mt-1">
                      <i style={{ "--w": `${pondere.toFixed(1)}%`, animationDelay: `${i * 90}ms` } as React.CSSProperties} />
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* ---------- File: avize / facturi emise / manoperă și utilaje ---------- */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-pink-200 bg-white/70 p-1.5 backdrop-blur-sm" role="tablist">
        {taburi.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-2 py-2 text-center text-sm font-semibold leading-tight transition-colors ${
              tab === t.id ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-200" : "text-pink-500"
            }`}
          >
            {t.eticheta}
            {t.nr !== undefined && <span className={`ml-1 text-xs ${tab === t.id ? "text-pink-100" : "text-pink-300"}`}>{t.nr}</span>}
          </button>
        ))}
      </div>

      {tab === "avize" && (
        <div className="flex flex-col gap-2">
          <input
            className="rounded-full border border-pink-200 bg-white/85 p-2 px-4 text-sm text-rose-800 placeholder:text-pink-300 focus:outline-none"
            placeholder="🔍 Caută după nr. aviz sau furnizor…"
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
          />
          {avizeFiltrate.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-pink-300 bg-white/70 p-6 text-center text-sm text-pink-400 backdrop-blur-sm">Niciun aviz aici 🌸</p>
          )}
          {avizeFiltrate.map((a, i) => {
            const total = totalAviz(a);
            const faraPret = avizAreProduseFaraPret(a);
            return (
              <div
                key={a.id}
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                className="apare card-roz rounded-2xl border border-pink-200 bg-white/85 p-3 shadow-sm shadow-pink-100 backdrop-blur-sm"
              >
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
                {a.produse && a.produse.length > 0 && <p className="mt-1 text-xs text-pink-400">{a.produse.map((p) => p.denumire).join(", ")}</p>}
                <div className="mt-2 flex gap-3 text-xs">
                  {a.poza_url && (
                    <a href={a.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-pink-500 underline">
                      Vezi poza
                    </a>
                  )}
                  <Link href={`/aviz/${a.id}/editeaza`} className="font-medium text-pink-500 underline">
                    Editează
                  </Link>
                  <button onClick={() => stergeAviz(a.id)} disabled={seSterge === a.id} className="font-medium text-red-400 underline disabled:opacity-50">
                    {seSterge === a.id ? "Se șterge…" : "Șterge"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "facturi" && (
        <div className="flex flex-col gap-2">
          <Link
            href={`/factura-emisa?santier=${santier.id}`}
            className="rounded-full bg-gradient-to-r from-pink-400 to-rose-400 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-pink-200"
          >
            🧾 Adaugă factură emisă (poză sau PDF)
          </Link>
          {emiseFiltrate.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-pink-300 bg-white/70 p-6 text-center text-sm text-pink-400 backdrop-blur-sm">
              Nicio factură emisă aici încă.
            </p>
          )}
          {emiseFiltrate.map((f, i) => {
            const cu = totalAviz(f);
            const fara = f.produse?.[0]?.pret_unitar;
            return (
              <div
                key={f.id}
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                className="apare card-roz rounded-2xl border border-pink-200 bg-white/85 p-3 shadow-sm shadow-pink-100 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-rose-800">{f.furnizor}</p>
                    <p className="text-xs text-pink-400">
                      {f.numar_aviz ? `Factura ${f.numar_aviz} · ` : ""}
                      {formateazaData(f.data_aviz)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{formateazaSuma(cu, f.moneda)}</span>
                    {fara !== null && fara !== undefined && <p className="mt-1 text-xs text-pink-400">fără TVA {formateazaSuma(Number(fara), f.moneda)}</p>}
                  </div>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  {f.poza_url && (
                    <a href={f.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-pink-500 underline">
                      Vezi poza
                    </a>
                  )}
                  <Link href={`/factura-emisa/${f.id}/editeaza`} className="font-medium text-pink-500 underline">
                    Editează
                  </Link>
                  <button onClick={() => stergeFactura(f.id)} disabled={seStergeFactura === f.id} className="font-medium text-red-400 underline disabled:opacity-50">
                    {seStergeFactura === f.id ? "Se șterge…" : "Șterge"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "costuri" && (
        <CosturiInterne santierId={santier.id} raspuns={costuri} incarcare={incarcareCosturi} eroare={eroareCosturi} reincarca={reincarcaCosturi} />
      )}

      {tab === "avize" && (
        <Link
          href={`/adauga?santier=${santier.id}`}
          className="fab fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-3xl text-white shadow-lg shadow-pink-300"
          aria-label="Adaugă aviz"
        >
          +
        </Link>
      )}
    </main>
  );
}

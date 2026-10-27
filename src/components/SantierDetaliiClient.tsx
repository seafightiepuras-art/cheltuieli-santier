"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORII } from "@/lib/types";
import type { Aviz, Santier } from "@/lib/types";
import type { RaspunsCosturi } from "@/lib/costuri-tipuri";
import type { RaspunsFacturiPrimite } from "@/lib/facturi-tipuri";
import type { InchideriSantier } from "@/lib/inchideri-tipuri";
import { calculeazaFisa, faraTvaEmisa, type FisaMoneda } from "@/lib/fisa";
import { formateazaData, formateazaSuma } from "@/lib/format";
import { CosturiInterne } from "@/components/CosturiInterne";
import { FacturiPrimiteTab } from "@/components/FacturiPrimiteTab";
import { avizAreProduseFaraPret, calculeazaTotalePeCategorie, totalAviz } from "@/lib/calcule";

type Tab = "avize" | "primite" | "emise" | "oameni";

function lunaDinData(data: string | null): string | null {
  return data ? data.slice(0, 7) : null; // "YYYY-MM"
}

function etichetaLuna(luna: string): string {
  const [an, luna2] = luna.split("-");
  const nume = new Date(Number(an), Number(luna2) - 1, 1).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
  return nume.charAt(0).toUpperCase() + nume.slice(1);
}

function Kpi({ eticheta, valoare, nota, ton }: { eticheta: string; valoare: string; nota?: string; ton?: "pozitiv" | "negativ" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{eticheta}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums sm:text-2xl ${ton === "pozitiv" ? "text-emerald-700" : ton === "negativ" ? "text-red-700" : "text-slate-900"}`}>{valoare}</p>
      {nota && <p className="mt-0.5 text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

/** Tabelul costurilor pe categorii, cu și fără TVA, urmat de facturat și marjă. */
function TabelCosturi({ fisa }: { fisa: FisaMoneda }) {
  const m = fisa.moneda;
  const total = fisa.totalFaraTva || 1;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm sm:min-w-[520px]">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 sm:px-4 py-2.5">Cheltuieli {m}</th>
              <th className="px-2 sm:px-4 py-2.5 text-right">Cu TVA</th>
              <th className="px-2 sm:px-4 py-2.5 text-right">Fără TVA</th>
              <th className="hidden w-28 px-2 sm:px-4 py-2.5 text-right sm:table-cell">% din total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fisa.linii.map((l) => {
              const pct = (l.faraTva / total) * 100;
              return (
                <tr key={l.cheie}>
                  <td className="px-2 sm:px-4 py-2.5">
                    <p className="font-medium text-slate-900">
                      {l.eticheta}
                      {l.nr !== undefined && l.nr > 0 && <span className="ml-1.5 text-xs font-normal text-slate-400">({l.nr})</span>}
                    </p>
                    {l.nota && <p className="text-xs text-slate-500">{l.nota}</p>}
                  </td>
                  <td className="px-2 sm:px-4 py-2.5 text-right tabular-nums text-slate-900">{formateazaSuma(l.cuTva, m)}</td>
                  <td className="px-2 sm:px-4 py-2.5 text-right tabular-nums text-slate-900">
                    {formateazaSuma(l.faraTva, m)}
                    {l.estimat && <span className="ml-1 text-xs text-slate-400" title="TVA-ul avizelor nu e păstrat separat: estimat cu 21%">est.</span>}
                  </td>
                  <td className="hidden px-2 sm:px-4 py-2.5 sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <span className="w-10 text-right text-xs tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-700" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 text-sm">
            <tr className="bg-slate-50 font-bold text-slate-900">
              <td className="px-2 sm:px-4 py-3">TOTAL CHELTUIT</td>
              <td className="px-2 sm:px-4 py-3 text-right tabular-nums">{formateazaSuma(fisa.totalCuTva, m)}</td>
              <td className="px-2 sm:px-4 py-3 text-right tabular-nums">{formateazaSuma(fisa.totalFaraTva, m)}</td>
              <td className="hidden sm:table-cell" />
            </tr>
            <tr className="text-slate-700">
              <td className="px-2 sm:px-4 py-2.5 font-medium">Facturat (emis)</td>
              <td className="px-2 sm:px-4 py-2.5 text-right tabular-nums">{formateazaSuma(fisa.facturatCuTva, m)}</td>
              <td className="px-2 sm:px-4 py-2.5 text-right tabular-nums">{formateazaSuma(fisa.facturatFaraTva, m)}</td>
              <td className="hidden sm:table-cell" />
            </tr>
            <tr className={`font-bold ${fisa.marja >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              <td className="px-2 sm:px-4 py-3">MARJĂ (facturat − cheltuit, fără TVA)</td>
              <td className="px-2 sm:px-4 py-3 text-right tabular-nums">{formateazaSuma(fisa.facturatCuTva - fisa.totalCuTva, m)}</td>
              <td className="px-2 sm:px-4 py-3 text-right tabular-nums">
                {fisa.marja >= 0 ? "+" : "−"}
                {formateazaSuma(Math.abs(fisa.marja), m)}
              </td>
              <td className="px-2 sm:px-4 py-3 text-right tabular-nums">{fisa.marjaProcent !== null ? `${fisa.marjaProcent.toFixed(1).replace(".", ",")}%` : "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
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

  // Costurile din pontaj (oameni, utilaje, motorină)
  const [costuri, setCosturi] = useState<RaspunsCosturi | null>(null);
  const [incarcareCosturi, setIncarcareCosturi] = useState(true);
  const [eroareCosturi, setEroareCosturi] = useState<string | null>(null);
  const [versiuneCosturi, setVersiuneCosturi] = useState(0);
  const reincarcaCosturi = useCallback((reset?: boolean) => {
    if (reset) setCosturi(null); // după schimbarea legăturii, nu lăsăm pe ecran răspunsul vechi
    setVersiuneCosturi((v) => v + 1);
  }, []);

  // Facturile primite alocate acestui șantier (din Centralizator Facturi) + ce avize acoperă
  const [fp, setFp] = useState<RaspunsFacturiPrimite | null>(null);
  const [incarcareFp, setIncarcareFp] = useState(true);
  const [eroareFp, setEroareFp] = useState<string | null>(null);
  const [versiuneFp, setVersiuneFp] = useState(0);

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

  // Lunile închise ale acestui șantier
  const [inchideri, setInchideri] = useState<InchideriSantier>({});
  const [versiuneInchideri, setVersiuneInchideri] = useState(0);
  const [seInchide, setSeInchide] = useState(false);
  useEffect(() => {
    let anulat = false;
    fetch(`/api/inchideri?santier=${santier.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => !anulat && setInchideri(j.inchideri ?? {}))
      .catch(() => {});
    return () => {
      anulat = true;
    };
  }, [santier.id, versiuneInchideri]);

  useEffect(() => {
    let anulat = false;
    setIncarcareFp(true);
    setEroareFp(null);
    const param = lunaAleasa === "toate" ? "" : `?luna=${lunaAleasa}`;
    fetch(`/api/facturi-primite/${santier.id}${param}`, { cache: "no-store" })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (anulat) return;
        if (!res.ok) setEroareFp(j.eroare ?? "Eroare necunoscută.");
        else setFp(j as RaspunsFacturiPrimite);
      })
      .catch(() => !anulat && setEroareFp("Nu am putut contacta serverul."))
      .finally(() => !anulat && setIncarcareFp(false));
    return () => {
      anulat = true;
    };
  }, [santier.id, lunaAleasa, versiuneFp]);

  // Cifrele se actualizează singure cu pontajul și facturile: la revenirea în aplicație și din minut în minut.
  useEffect(() => {
    const actualizeaza = () => {
      if (document.visibilityState === "visible") {
        reincarcaCosturi();
        setVersiuneFp((v) => v + 1);
      }
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
    for (const f of fp?.facturi ?? []) {
      const l = lunaDinData(f.data);
      if (l) set.add(l);
    }
    return Array.from(set).sort().reverse();
  }, [avize, emise, fp]);

  const dinLuna = (a: Aviz) => lunaAleasa === "toate" || lunaDinData(a.data_aviz) === lunaAleasa;

  // Avizele acoperite de o factură alocată ACESTUI șantier nu se mai numără (se numără factura).
  const acopera = fp?.acopera ?? {};
  const facturiAlocate = fp?.facturi ?? [];
  const avizeAcoperite = useMemo(() => {
    const idFacturiAlocate = new Set(facturiAlocate.map((f) => f.id));
    const s = new Map<string, string>(); // avizId -> facturaId
    for (const [fid, lista] of Object.entries(acopera)) if (idFacturiAlocate.has(fid)) for (const a of lista) s.set(a, fid);
    return s;
  }, [acopera, facturiAlocate]);

  const avizeLuna = useMemo(() => avize.filter(dinLuna), [avize, lunaAleasa]); // eslint-disable-line react-hooks/exhaustive-deps
  const avizeNefacturate = useMemo(() => avizeLuna.filter((a) => !avizeAcoperite.has(a.id)), [avizeLuna, avizeAcoperite]);
  const emiseFiltrate = useMemo(() => emise.filter(dinLuna), [emise, lunaAleasa]); // eslint-disable-line react-hooks/exhaustive-deps

  const avizeFiltrate = useMemo(() => {
    const text = cautare.trim().toLowerCase();
    if (!text) return avizeLuna;
    return avizeLuna.filter((a) => (a.numar_aviz ?? "").toLowerCase().includes(text) || a.furnizor.toLowerCase().includes(text));
  }, [avizeLuna, cautare]);

  const totalePeCategorie = useMemo(() => {
    const etichetaCategorie = new Map(CATEGORII.map((c) => [c.valoare, c.eticheta]));
    return calculeazaTotalePeCategorie(avizeNefacturate).map((t) => ({ ...t, eticheta: etichetaCategorie.get(t.categorie) ?? t.categorie }));
  }, [avizeNefacturate]);
  const avizeFaraPret = avizeNefacturate.filter(avizAreProduseFaraPret);

  const interne = costuri?.configurat && costuri.costuri ? costuri.costuri : null;
  const fiseLive = useMemo(
    () => calculeazaFisa({ avizeNefacturate, facturi: facturiAlocate, emise: emiseFiltrate, interne }),
    [avizeNefacturate, facturiAlocate, emiseFiltrate, interne]
  );

  // Luna închisă: se afișează cifrele înghețate, nu cele calculate acum.
  // („toate” = șantierul încheiat în întregime)
  const inchisa = inchideri[lunaAleasa];
  const fise = inchisa ? inchisa.fise : fiseLive;
  const ronLive = fiseLive.find((f) => f.moneda === "RON");
  const ronInghetat = inchisa?.fise.find((f) => f.moneda === "RON");
  const modificatDupaInchidere = !!(ronLive && ronInghetat && (Math.abs(ronLive.totalFaraTva - ronInghetat.totalFaraTva) > 0.5 || Math.abs(ronLive.facturatFaraTva - ronInghetat.facturatFaraTva) > 0.5));
  const dateComplete = !incarcareCosturi && !incarcareFp && !eroareCosturi && !eroareFp && !!fp;

  async function inchideLunaAleasa() {
    if (lunaAleasa === "toate" || !dateComplete) return;
    const nealocatLuna = fp?.nealocat ?? [];
    const mesaj = `Închizi luna ${etichetaLuna(lunaAleasa)} pentru ${santier.nume}? Cifrele de acum se îngheață și nu se mai schimbă, nici dacă se modifică pontajul sau facturile. O poți redeschide oricând.${
      interne ? "" : "\n\nAtenție: șantierul nu e legat de pontaj, deci oamenii, utilajele și motorina nu sunt incluse."
    }`;
    if (!confirm(mesaj)) return;
    setSeInchide(true);
    const res = await fetch("/api/inchideri", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ santierId: santier.id, luna: lunaAleasa, fise: fiseLive, nealocat: nealocatLuna }) });
    setSeInchide(false);
    if (!res.ok) return alert("Nu am putut închide luna.");
    setVersiuneInchideri((v) => v + 1);
  }

  async function redeschideLunaAleasa() {
    if (lunaAleasa === "toate") return;
    if (!confirm(`Redeschizi luna ${etichetaLuna(lunaAleasa)}? Cifrele vor reveni la cele calculate în timp real.`)) return;
    setSeInchide(true);
    const res = await fetch("/api/inchideri", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ santierId: santier.id, luna: lunaAleasa }) });
    setSeInchide(false);
    if (!res.ok) return alert("Nu am putut redeschide luna.");
    setVersiuneInchideri((v) => v + 1);
  }

  async function incheieSantier() {
    if (lunaAleasa !== "toate" || !dateComplete) return;
    const mesaj = `Închizi șantierul ${santier.nume}? Cifrele finale (pe toată perioada) se îngheață, iar șantierul trece la coada listei și nu mai apare la alocarea facturilor. Îl poți redeschide oricând.${
      interne ? "" : "\n\nAtenție: șantierul nu e legat de pontaj, deci oamenii, utilajele și motorina nu sunt incluse."
    }`;
    if (!confirm(mesaj)) return;
    setSeInchide(true);
    const salvat = await fetch("/api/inchideri", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ santierId: santier.id, luna: "toate", fise: fiseLive, nealocat: fp?.nealocat ?? [] }) });
    const marcat = salvat.ok ? await fetch("/api/santiere", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: santier.id, activ: false }) }) : null;
    setSeInchide(false);
    if (!salvat.ok || !marcat?.ok) return alert("Nu am putut închide șantierul.");
    setVersiuneInchideri((v) => v + 1);
    router.refresh();
  }

  async function redeschideSantier() {
    if (!confirm(`Redeschizi șantierul ${santier.nume}? Cifrele revin la cele calculate în timp real.`)) return;
    setSeInchide(true);
    const a = await fetch("/api/inchideri", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ santierId: santier.id, luna: "toate" }) });
    const b = await fetch("/api/santiere", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: santier.id, activ: true }) });
    setSeInchide(false);
    if (!a.ok || !b.ok) return alert("Nu am putut redeschide șantierul.");
    setVersiuneInchideri((v) => v + 1);
    router.refresh();
  }
  const fisaRon = fise.find((f) => f.moneda === "RON") ?? fise[0];
  const alteMonede = fise.filter((f) => f.moneda !== "RON" && (f.totalCuTva > 0 || f.facturatCuTva > 0));
  const nealocatRon = (fp?.nealocat ?? []).find((n) => n.moneda === "RON");

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
    { id: "primite", eticheta: "Facturi primite", nr: facturiAlocate.length },
    { id: "emise", eticheta: "Facturi emise", nr: emiseFiltrate.length },
    { id: "oameni", eticheta: "Oameni și utilaje", nr: interne?.nrOameni },
  ];

  return (
    <main className="fisa-santier mx-auto flex max-w-5xl flex-col gap-5 p-4 pb-28 md:p-6">
      {/* ---------- antet ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Toate șantierele
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{santier.nume}</h1>
          <p className="text-sm text-slate-500">Fișa șantierului{lunaAleasa !== "toate" ? ` · ${etichetaLuna(lunaAleasa)}` : " · toată perioada"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {luniDisponibile.length > 0 && (
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
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
          <a href={`/api/export?santier_id=${santier.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
            Export CSV
          </a>
        </div>
      </header>

      {/* ---------- închiderea lunii ---------- */}
      {luniDisponibile.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Închiderea lunii</h2>
          <p className="mt-0.5 text-sm text-slate-500">Când o lună e terminată, o închizi și cifrele ei rămân înghețate. Atinge o lună:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {luniDisponibile.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLunaAleasa(l)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${lunaAleasa === l ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
              >
                {inchideri[l] ? "🔒 " : ""}
                {etichetaLuna(l)}
              </button>
            ))}
          </div>
          {lunaAleasa === "toate" ? (
            <p className="mt-3 text-sm text-slate-500">Nicio lună aleasă acum (se vede toată perioada).</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-800">
                {etichetaLuna(lunaAleasa)}: {inchisa ? "închisă" : "deschisă"}
              </span>
              {inchisa ? (
                <button type="button" onClick={redeschideLunaAleasa} disabled={seInchide} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
                  Redeschide luna
                </button>
              ) : (
                <button type="button" onClick={inchideLunaAleasa} disabled={seInchide || !dateComplete} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {seInchide ? "Se salvează…" : dateComplete ? "Închide luna" : "Se calculează…"}
                </button>
              )}
              <button type="button" onClick={() => setLunaAleasa("toate")} className="text-sm text-slate-500 underline">
                Arată toată perioada
              </button>
            </div>
          )}
        </section>
      )}

      {/* ---------- închiderea șantierului ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Închiderea șantierului</h2>
        {santier.activ ? (
          <>
            <p className="mt-0.5 text-sm text-slate-500">Când lucrarea e gata, închizi șantierul: cifrele finale se îngheață, iar șantierul trece la coada listei și nu mai primește facturi la alocare.</p>
            <div className="mt-3">
              {lunaAleasa === "toate" ? (
                <button type="button" onClick={incheieSantier} disabled={seInchide || !dateComplete} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {seInchide ? "Se salvează…" : dateComplete ? "Închide șantierul" : "Se calculează…"}
                </button>
              ) : (
                <button type="button" onClick={() => setLunaAleasa("toate")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                  Arată toată perioada, ca să închizi șantierul
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-800">
              Șantier încheiat{inchideri["toate"] ? ` pe ${new Date(inchideri["toate"].inchisLa).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </span>
            <button type="button" onClick={redeschideSantier} disabled={seInchide} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
              Redeschide șantierul
            </button>
          </div>
        )}
      </section>

      {inchisa && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">
            {lunaAleasa === "toate" ? "Șantier închis" : "Luna închisă"} pe {new Date(inchisa.inchisLa).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p>Cifrele de mai jos sunt înghețate la momentul închiderii.</p>
          {modificatDupaInchidere && ronLive && ronInghetat && (
            <p className="mt-1 font-medium text-amber-800">
              Atenție: după închidere s-au schimbat datele. Acum ar rezulta cheltuit {formateazaSuma(ronLive.totalFaraTva, "RON")} și facturat {formateazaSuma(ronLive.facturatFaraTva, "RON")} (fără TVA), față de{" "}
              {formateazaSuma(ronInghetat.totalFaraTva, "RON")} și {formateazaSuma(ronInghetat.facturatFaraTva, "RON")} înghețate. Redeschide și închide din nou ca să le actualizezi.
            </p>
          )}
        </div>
      )}

      {/* ---------- cifre principale ---------- */}
      {fisaRon && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi eticheta="Cheltuit (fără TVA)" valoare={formateazaSuma(fisaRon.totalFaraTva, "RON")} nota={`${formateazaSuma(fisaRon.totalCuTva, "RON")} cu TVA`} />
          <Kpi eticheta="Facturat (fără TVA)" valoare={formateazaSuma(fisaRon.facturatFaraTva, "RON")} nota={`${formateazaSuma(fisaRon.facturatCuTva, "RON")} cu TVA`} />
          <Kpi
            eticheta="Marjă"
            valoare={`${fisaRon.marja >= 0 ? "+" : "−"}${formateazaSuma(Math.abs(fisaRon.marja), "RON")}`}
            ton={fisaRon.marja >= 0 ? "pozitiv" : "negativ"}
            nota="facturat − cheltuit, fără TVA"
          />
          <Kpi
            eticheta="Marjă %"
            valoare={fisaRon.marjaProcent !== null ? `${fisaRon.marjaProcent.toFixed(1).replace(".", ",")}%` : "—"}
            ton={fisaRon.marjaProcent !== null ? (fisaRon.marja >= 0 ? "pozitiv" : "negativ") : undefined}
            nota="din valoarea facturată"
          />
        </section>
      )}

      {/* ---------- defalcare ---------- */}
      {fisaRon && <TabelCosturi fisa={fisaRon} />}
      {alteMonede.map((f) => (
        <TabelCosturi key={f.moneda} fisa={f} />
      ))}

      {!interne && !incarcareCosturi && !eroareCosturi && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Șantierul nu e legat de pontaj, deci oamenii, utilajele și motorina nu sunt incluse. Leagă-l din fila „Oameni și utilaje”.
        </p>
      )}
      {eroareCosturi && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Nu am putut aduce costurile din pontaj: {eroareCosturi}</p>}
      {avizeFaraPret.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {avizeFaraPret.length} {avizeFaraPret.length === 1 ? "aviz nu are" : "avize nu au"} preț completat — cheltuiala reală e mai mare.
        </p>
      )}
      {nealocatRon && nealocatRon.cuTva > 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-800">Cheltuieli generale (nealocate pe șantiere):</span> {formateazaSuma(nealocatRon.cuTva, "RON")} cu TVA ·{" "}
          {formateazaSuma(nealocatRon.faraTva, "RON")} fără TVA ({nealocatRon.nr} {nealocatRon.nr === 1 ? "factură" : "facturi"}). Nu intră în costul niciunui șantier.
        </p>
      )}

      {totalePeCategorie.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Avizele nefacturate, pe categorii</summary>
          <div className="mt-3 flex flex-col gap-2">
            {totalePeCategorie.map((c) => (
              <div key={`${c.moneda}-${c.categorie}`} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.eticheta}</span>
                <span className="font-medium tabular-nums text-slate-900">{formateazaSuma(c.total, c.moneda)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ---------- file ---------- */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
        {taburi.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.eticheta}
            {t.nr !== undefined && <span className={`ml-1.5 text-xs ${tab === t.id ? "text-slate-300" : "text-slate-400"}`}>{t.nr}</span>}
          </button>
        ))}
      </div>

      {tab === "avize" && (
        <div className="flex flex-col gap-2">
          <input
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Caută după nr. aviz sau furnizor…"
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
          />
          {avizeFiltrate.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Niciun aviz aici.</p>}
          {avizeFiltrate.map((a) => {
            const total = totalAviz(a);
            const faraPret = avizAreProduseFaraPret(a);
            const facturaId = avizeAcoperite.get(a.id);
            const factura = facturaId ? facturiAlocate.find((f) => f.id === facturaId) : undefined;
            return (
              <div key={a.id} className={`rounded-xl border bg-white p-4 shadow-sm ${facturaId ? "border-slate-200 opacity-70" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{a.furnizor}</p>
                    <p className="text-sm text-slate-500">
                      {a.numar_aviz ? `Aviz ${a.numar_aviz} · ` : ""}
                      {formateazaData(a.data_aviz)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {faraPret ? (
                      <span className="text-xs font-semibold text-amber-700">fără preț</span>
                    ) : (
                      <span className="text-lg font-bold tabular-nums text-slate-900">{formateazaSuma(total, a.moneda)}</span>
                    )}
                    <p className={`text-xs font-semibold ${facturaId ? "text-emerald-700" : "text-slate-400"}`}>
                      {facturaId ? `facturat${factura?.numar ? ` · fact. ${factura.numar}` : ""}` : "nefacturat"}
                    </p>
                  </div>
                </div>
                {a.produse && a.produse.length > 0 && <p className="mt-1 text-sm text-slate-500">{a.produse.map((p) => p.denumire).join(", ")}</p>}
                <div className="mt-2 flex gap-4 text-sm">
                  {a.poza_url && (
                    <a href={a.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 underline">
                      Vezi poza
                    </a>
                  )}
                  <Link href={`/aviz/${a.id}/editeaza`} className="font-medium text-slate-700 underline">
                    Editează
                  </Link>
                  <button onClick={() => stergeAviz(a.id)} disabled={seSterge === a.id} className="font-medium text-red-600 underline disabled:opacity-50">
                    {seSterge === a.id ? "Se șterge…" : "Șterge"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "primite" && (
        <FacturiPrimiteTab
          facturi={facturiAlocate}
          avizeSantier={avize}
          acopera={acopera}
          nealocat={fp?.nealocat ?? []}
          incarcare={incarcareFp}
          eroare={eroareFp}
          onSchimbat={() => setVersiuneFp((v) => v + 1)}
        />
      )}

      {tab === "emise" && (
        <div className="flex flex-col gap-2">
          <Link href={`/factura-emisa?santier=${santier.id}`} className="rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white shadow-sm">
            Adaugă factură emisă (poză sau PDF)
          </Link>
          {emiseFiltrate.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Nicio factură emisă aici încă.</p>}
          {emiseFiltrate.map((f) => {
            const cu = totalAviz(f);
            const fara = faraTvaEmisa(f);
            return (
              <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{f.furnizor}</p>
                    <p className="text-sm text-slate-500">
                      {f.numar_aviz ? `Factura ${f.numar_aviz} · ` : ""}
                      {formateazaData(f.data_aviz)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold tabular-nums text-slate-900">{formateazaSuma(cu, f.moneda)}</p>
                    <p className="text-xs tabular-nums text-slate-500">
                      fără TVA {formateazaSuma(fara.valoare, f.moneda)}
                      {fara.estimat ? " (est.)" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  {f.poza_url && (
                    <a href={f.poza_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 underline">
                      Vezi poza
                    </a>
                  )}
                  <Link href={`/factura-emisa/${f.id}/editeaza`} className="font-medium text-slate-700 underline">
                    Editează
                  </Link>
                  <button onClick={() => stergeFactura(f.id)} disabled={seStergeFactura === f.id} className="font-medium text-red-600 underline disabled:opacity-50">
                    {seStergeFactura === f.id ? "Se șterge…" : "Șterge"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "oameni" && (
        <CosturiInterne santierId={santier.id} raspuns={costuri} incarcare={incarcareCosturi} eroare={eroareCosturi} reincarca={reincarcaCosturi} />
      )}

      {tab === "avize" && (
        <Link
          href={`/adauga?santier=${santier.id}`}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-3xl text-white shadow-lg"
          aria-label="Adaugă aviz"
        >
          +
        </Link>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CapturaAviz } from "./CapturaAviz";
import { AnalizaAnimata } from "./AnalizaAnimata";
import type { Aviz, FacturaOcr, Moneda, Santier } from "@/lib/types";

type Stare = "idle" | "analiza" | "confirmare" | "salvat";

interface DateFactura {
  client: string;
  numar_factura: string;
  data_factura: string;
  moneda: Moneda;
  total_fara_tva: string;
  tva: string;
  total_cu_tva: string;
}

const CAMP_LABEL: Record<string, string> = {
  client: "Client",
  numar_factura: "Nr. factură",
  data_factura: "Data",
  moneda: "Monedă",
  total_fara_tva: "Total fără TVA",
  tva: "TVA",
  total_cu_tva: "Total cu TVA",
};

const inputClasa = "w-full rounded-xl border p-2 text-rose-800 placeholder:text-pink-300 focus:outline-none";

function text(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n);
}

function dinOcr(o: FacturaOcr | null): DateFactura {
  return {
    client: o?.client ?? "",
    numar_factura: o?.numar_factura ?? "",
    data_factura: o?.data_factura ?? "",
    moneda: o?.moneda ?? "RON",
    total_fara_tva: text(o?.total_fara_tva),
    tva: text(o?.tva),
    total_cu_tva: text(o?.total_cu_tva),
  };
}

function dinFactura(f: Aviz): DateFactura {
  const p = f.produse?.[0];
  const cu = p ? Number(p.valoare) : null;
  const fara = p?.pret_unitar !== null && p?.pret_unitar !== undefined ? Number(p.pret_unitar) : null;
  return {
    client: f.furnizor,
    numar_factura: f.numar_aviz ?? "",
    data_factura: f.data_aviz ?? "",
    moneda: f.moneda,
    total_fara_tva: text(fara),
    tva: cu !== null && fara !== null ? String(Math.round((cu - fara) * 100) / 100) : "",
    total_cu_tva: text(cu),
  };
}

function FormularFactura({
  valoriInitiale,
  campIncert = [],
  previewUrl,
  estePdf,
  clientiCunoscuti,
  seSalveaza,
  textButon,
  onSalveaza,
  onRenunta,
}: {
  valoriInitiale: DateFactura;
  campIncert?: string[];
  previewUrl: string | null;
  estePdf: boolean;
  clientiCunoscuti: string[];
  seSalveaza: boolean;
  textButon: string;
  onSalveaza: (d: DateFactura) => void;
  onRenunta: () => void;
}) {
  const [d, setD] = useState<DateFactura>(valoriInitiale);
  const incert = new Set(campIncert);

  function clasa(nume: string) {
    return `${inputClasa} ${incert.has(nume) ? "border-amber-400 bg-amber-50" : "border-pink-200 bg-white/90"}`;
  }
  function eticheta(nume: string) {
    return incert.has(nume) ? `${CAMP_LABEL[nume]} — verifică` : CAMP_LABEL[nume];
  }

  // Când se schimbă „fără TVA” sau „TVA”, totalul cu TVA se recalculează singur (rămâne editabil).
  function seteazaSuma(camp: "total_fara_tva" | "tva", valoare: string) {
    setD((x) => {
      const nou = { ...x, [camp]: valoare };
      const fara = Number(nou.total_fara_tva.replace(",", "."));
      const tva = Number(nou.tva.replace(",", "."));
      if (nou.total_fara_tva !== "" && nou.tva !== "" && Number.isFinite(fara) && Number.isFinite(tva)) {
        nou.total_cu_tva = String(Math.round((fara + tva) * 100) / 100);
      }
      return nou;
    });
  }

  function submite(e: React.FormEvent) {
    e.preventDefault();
    if (!d.client.trim()) return alert("Completează clientul.");
    const total = Number(d.total_cu_tva.replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) return alert("Completează totalul facturii (cu TVA).");
    onSalveaza(d);
  }

  return (
    <form onSubmit={submite} className="flex flex-col gap-4 rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm">
      {campIncert.length > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Verifică câmpurile evidențiate — nu au putut fi citite cu certitudine.
        </p>
      )}

      {previewUrl &&
        (estePdf ? (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-pink-200 p-3 text-sm text-pink-600">
            📄 Deschide PDF-ul
          </a>
        ) : (
          <img src={previewUrl} alt="Poza facturii" className="max-h-48 w-full rounded-xl object-contain" />
        ))}

      <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
        {eticheta("client")}
        <input className={clasa("client")} value={d.client} onChange={(e) => setD({ ...d, client: e.target.value })} list="lista-clienti" required />
        <datalist id="lista-clienti">
          {clientiCunoscuti.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {eticheta("numar_factura")}
          <input className={clasa("numar_factura")} value={d.numar_factura} onChange={(e) => setD({ ...d, numar_factura: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {eticheta("data_factura")}
          <input type="date" className={clasa("data_factura")} value={d.data_factura} onChange={(e) => setD({ ...d, data_factura: e.target.value })} />
        </label>
      </div>

      <div className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
        {eticheta("moneda")}
        <div className="flex gap-2">
          {(["RON", "EUR"] as Moneda[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setD({ ...d, moneda: m })}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold ${
                d.moneda === m ? "border-pink-400 bg-pink-100 text-pink-700" : "border-pink-200 bg-white/90 text-rose-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {eticheta("total_fara_tva")}
          <input type="number" step="0.01" inputMode="decimal" className={clasa("total_fara_tva")} value={d.total_fara_tva} onChange={(e) => seteazaSuma("total_fara_tva", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {eticheta("tva")}
          <input type="number" step="0.01" inputMode="decimal" className={clasa("tva")} value={d.tva} onChange={(e) => seteazaSuma("tva", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-rose-700">
          {eticheta("total_cu_tva")}
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            className={`${clasa("total_cu_tva")} font-bold`}
            value={d.total_cu_tva}
            onChange={(e) => setD({ ...d, total_cu_tva: e.target.value })}
          />
        </label>
      </div>
      <p className="text-xs text-pink-400">Comparația cu avizele se face pe totalul cu TVA (avizele au TVA inclus).</p>

      <div className="flex gap-3">
        <button type="button" onClick={onRenunta} className="flex-1 rounded-full border-2 border-pink-200 py-3 font-semibold text-pink-500">
          Renunță
        </button>
        <button
          type="submit"
          disabled={seSalveaza}
          className="flex-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 py-3 font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {seSalveaza ? "Se salvează…" : `💖 ${textButon}`}
        </button>
      </div>
    </form>
  );
}

/** Adăugare factură emisă: poză/PDF → citire automată → confirmare → salvare. */
export function AdaugaFacturaEmisaClient({ santier, clientiCunoscuti }: { santier: Santier; clientiCunoscuti: string[] }) {
  const router = useRouter();
  const [stare, setStare] = useState<Stare>("idle");
  const [coada, setCoada] = useState<File[]>([]);
  const [indexCurent, setIndexCurent] = useState(0);
  const [poza, setPoza] = useState<File | null>(null);
  const [ocr, setOcr] = useState<FacturaOcr | null>(null);
  const [eroareOcr, setEroareOcr] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [salvate, setSalvate] = useState(0);

  async function ruleazaOcr(fisier: File) {
    setPoza(fisier);
    setStare("analiza");
    setEroareOcr(null);
    try {
      const fd = new FormData();
      fd.append("poza", fisier);
      const res = await fetch("/api/ocr-factura", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setEroareOcr(data.eroare ?? "Nu am putut citi factura automat.");
        setOcr(null);
      } else {
        setOcr(data as FacturaOcr);
      }
    } catch {
      setEroareOcr("Nu am putut contacta serverul. Completează manual câmpurile.");
      setOcr(null);
    } finally {
      setStare("confirmare");
    }
  }

  function porneste(fisiere: File[]) {
    setCoada(fisiere);
    setIndexCurent(0);
    setSalvate(0);
    ruleazaOcr(fisiere[0]);
  }

  function urmatoarea() {
    const urm = indexCurent + 1;
    if (urm < coada.length) {
      setIndexCurent(urm);
      ruleazaOcr(coada[urm]);
    } else {
      router.push(`/santier/${santier.id}`);
      router.refresh();
    }
  }

  async function salveaza(d: DateFactura, forteaza = false) {
    if (!poza) return;
    setSeSalveaza(true);
    try {
      const fd = new FormData();
      fd.append("poza", poza);
      fd.append("santier_id", santier.id);
      fd.append("client", d.client);
      fd.append("numar_factura", d.numar_factura);
      fd.append("data_factura", d.data_factura);
      fd.append("moneda", d.moneda);
      fd.append("total_fara_tva", d.total_fara_tva);
      fd.append("total_cu_tva", d.total_cu_tva);
      if (forteaza) fd.append("forteaza", "true");

      const res = await fetch("/api/facturi-emise", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.posibilDuplicat) {
          setSeSalveaza(false);
          if (confirm(`⚠️ ${data.eroare}\n\nO salvezi oricum?`)) return salveaza(d, true);
          return;
        }
        throw new Error(data.eroare ?? "Eroare la salvare");
      }
      setSalvate((n) => n + 1);
      setSeSalveaza(false);
      setStare("salvat");
      setTimeout(urmatoarea, 1000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Nu am putut salva factura.");
      setSeSalveaza(false);
    }
  }

  const maiMulte = coada.length > 1;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-6">
        <Link href={`/santier/${santier.id}`} className="font-semibold text-pink-500">
          ← Înapoi
        </Link>
        <h1 className="font-fancy text-2xl text-pink-600">Factură emisă — {santier.nume} 🧾</h1>
      </header>

      {maiMulte && (stare === "analiza" || stare === "confirmare") && (
        <p className="rounded-full bg-pink-100 px-4 py-1.5 text-center text-sm font-semibold text-pink-600">
          Factura {indexCurent + 1} din {coada.length} {salvate > 0 && `· ${salvate} salvate deja`}
        </p>
      )}

      {stare === "idle" && <CapturaAviz onCaptura={porneste} dezactivat={false} />}

      {stare === "analiza" && poza && <AnalizaAnimata poza={poza} />}

      {stare === "salvat" && (
        <div className="relative flex flex-col items-center gap-3 py-20 text-center">
          <div className="sare flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-4xl text-white shadow-lg shadow-pink-300">
            ✓
          </div>
          <p className="apare font-fancy text-2xl text-pink-600">Salvat!</p>
        </div>
      )}

      {stare === "confirmare" && poza && (
        <>
          {eroareOcr && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{eroareOcr}</p>}
          <FormularFactura
            valoriInitiale={dinOcr(ocr)}
            campIncert={ocr?.camp_incert ?? []}
            previewUrl={URL.createObjectURL(poza)}
            estePdf={poza.type === "application/pdf"}
            clientiCunoscuti={clientiCunoscuti}
            seSalveaza={seSalveaza}
            textButon={maiMulte ? "Salvează și treci la următoarea" : "Salvează factura"}
            onSalveaza={salveaza}
            onRenunta={
              maiMulte
                ? urmatoarea
                : () => {
                    setStare("idle");
                    setCoada([]);
                    setPoza(null);
                    setOcr(null);
                    setEroareOcr(null);
                  }
            }
          />
          {maiMulte && (
            <button onClick={urmatoarea} className="text-center text-sm font-medium text-pink-400 underline">
              Sari peste această factură (nu o salva)
            </button>
          )}
        </>
      )}
    </main>
  );
}

/** Editare factură emisă existentă. */
export function EditeazaFacturaEmisaClient({ factura, clientiCunoscuti }: { factura: Aviz; clientiCunoscuti: string[] }) {
  const router = useRouter();
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function salveaza(d: DateFactura) {
    setSeSalveaza(true);
    try {
      const res = await fetch(`/api/facturi-emise/${factura.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: d.client,
          numar_factura: d.numar_factura,
          data_factura: d.data_factura,
          moneda: d.moneda,
          total_fara_tva: d.total_fara_tva === "" ? null : Number(d.total_fara_tva.replace(",", ".")),
          total_cu_tva: Number(d.total_cu_tva.replace(",", ".")),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.eroare ?? "Eroare la salvare");
      }
      router.push(`/santier/${factura.santier_id}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Nu am putut salva modificările.");
      setSeSalveaza(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-6">
        <Link href={`/santier/${factura.santier_id}`} className="font-semibold text-pink-500">
          ← Înapoi
        </Link>
        <h1 className="font-fancy text-2xl text-pink-600">Editează factura 🧾</h1>
      </header>
      <FormularFactura
        valoriInitiale={dinFactura(factura)}
        previewUrl={factura.poza_url}
        estePdf={!!factura.poza_url && factura.poza_url.toLowerCase().endsWith(".pdf")}
        clientiCunoscuti={clientiCunoscuti}
        seSalveaza={seSalveaza}
        textButon="Salvează modificările"
        onSalveaza={salveaza}
        onRenunta={() => router.push(`/santier/${factura.santier_id}`)}
      />
    </main>
  );
}

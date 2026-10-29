"use client";

import { useState } from "react";
import { CONSUM_TRANSPORT_L_100KM } from "@/lib/costuri-tipuri";
import { formateazaSuma } from "@/lib/format";

interface SantierTransport {
  id: string;
  nume: string;
  km: number | null;
}

// Kilometrii dus-întors calculați pe șosea de la Mizil (centru) până în localitatea șantierului; se pot corecta oricând.
const KM_SUGERATI: { cuvinte: string[]; km: number }[] = [
  { cuvinte: ["autoroti"], km: 59.9 }, // Bucov
  { cuvinte: ["draganesti"], km: 69.5 }, // Drăgănești, Prahova
  { cuvinte: ["tomsani"], km: 32.6 },
  { cuvinte: ["fulga"], km: 29.3 },
  { cuvinte: ["conduratu"], km: 8.5 },
];

const simplu = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function kmSugerat(nume: string): number | null {
  const n = simplu(nume);
  return KM_SUGERATI.find((s) => s.cuvinte.some((c) => n.includes(c)))?.km ?? null;
}

async function salveazaKm(santierId: string, km: number | null) {
  const res = await fetch("/api/costuri-setari", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ santierId, km }) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.eroare ?? "Nu am putut salva.");
  }
}

function Rand({ s, pretMotorina }: { s: SantierTransport; pretMotorina: number | null }) {
  const [bifat, setBifat] = useState(s.km !== null);
  const [text, setText] = useState(s.km !== null ? String(s.km) : "");
  const [salvat, setSalvat] = useState<number | null>(s.km);
  const [stare, setStare] = useState<"" | "salveaza" | "ok" | "eroare">("");
  const sugestie = kmSugerat(s.nume);

  async function aplica(km: number | null) {
    setStare("salveaza");
    try {
      await salveazaKm(s.id, km);
      setSalvat(km);
      setStare("ok");
    } catch {
      setStare("eroare");
    }
  }

  async function comuta(v: boolean) {
    setBifat(v);
    if (!v) {
      setText("");
      if (salvat !== null) await aplica(null);
      else setStare("");
      return;
    }
    // la bifare nu se salvează nimic până nu scrii tu kilometrii (sugestia e doar un indiciu)
    setStare("");
  }

  async function lasa() {
    if (!bifat) return;
    const n = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (n === null || !Number.isFinite(n) || n <= 0) return;
    if (n === salvat) return;
    await aplica(n);
  }

  const kmNr = Number(text.replace(",", "."));
  const kmValid = bifat && Number.isFinite(kmNr) && kmNr > 0;
  const lunaTipica = kmValid ? (kmNr * 20 * CONSUM_TRANSPORT_L_100KM) / 100 : 0;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={bifat} onChange={(e) => comuta(e.target.checked)} className="h-6 w-6 shrink-0 accent-slate-900" />
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">{s.nume}</span>
        <span className="shrink-0 text-xs">
          {stare === "salveaza" && <span className="text-slate-400">se salvează…</span>}
          {stare === "ok" && <span className="font-semibold text-emerald-700">✔ salvat</span>}
          {stare === "eroare" && <span className="font-semibold text-red-700">nu s-a salvat</span>}
        </span>
      </label>

      {bifat && (
        <div className="mt-2 pl-9">
          <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            Km dus-întors pe zi:
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={text}
              placeholder="km"
              onChange={(e) => setText(e.target.value)}
              onBlur={lasa}
              className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            km
          </label>
          {sugestie !== null && !kmValid && <p className="mt-1 text-xs text-slate-500">Calculat pe șosea de la Mizil: ≈ {sugestie} km dus-întors. Scrie tu valoarea și iese din căsuță.</p>}
          {sugestie === null && !kmValid && <p className="mt-1 text-xs text-slate-500">Scrie tu câți km are drumul dus-întors într-o zi.</p>}
          {bifat && !kmValid && <p className="mt-1 text-xs text-amber-700">Până nu scrii kilometrii, nu se adaugă nimic la costuri.</p>}
          {kmValid && (
            <p className="mt-1 text-xs text-slate-500">
              O zi pe șantier ≈ {formateazaSuma(((kmNr * CONSUM_TRANSPORT_L_100KM) / 100) * (pretMotorina ?? 0))}
              {pretMotorina === null ? " (setează prețul motorinei ca să se calculeze)" : ` (${((kmNr * CONSUM_TRANSPORT_L_100KM) / 100).toFixed(2)} L × ${pretMotorina} lei)`}. La 20 de zile: ≈{" "}
              {formateazaSuma(lunaTipica * (pretMotorina ?? 0))}.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function TransportClient({ santiere, pretMotorina }: { santiere: SantierTransport[]; pretMotorina: number | null }) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {santiere.map((s) => (
          <Rand key={s.id} s={s} pretMotorina={pretMotorina} />
        ))}
      </ul>
      <p className="px-1 text-xs text-slate-500">
        Costul = km dus-întors × zilele în care a fost pontat cineva pe șantier (un drum pe zi) × {CONSUM_TRANSPORT_L_100KM} L la 100 km × prețul motorinei
        {pretMotorina !== null ? ` (${pretMotorina} lei/L)` : ""}. Apare în fișa șantierului ca linia „Transport".
      </p>
    </div>
  );
}

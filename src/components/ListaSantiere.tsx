"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Aviz } from "@/lib/types";
import type { RaspunsCosturi } from "@/lib/costuri-tipuri";
import type { RaspunsFacturiPrimite } from "@/lib/facturi-tipuri";
import { calculeazaFisa, type FisaMoneda } from "@/lib/fisa";
import { formateazaSuma } from "@/lib/format";

export interface SantierLista {
  id: string;
  nume: string;
  activ: boolean;
  avize: Aviz[];
  emise: Aviz[];
}

type Stare = { fise: FisaMoneda[] } | { eroare: true } | null;

function Rand({ s }: { s: SantierLista }) {
  const [stare, setStare] = useState<Stare>(null);

  useEffect(() => {
    let anulat = false;
    const aduce = async () => {
      try {
        const [rc, rf] = await Promise.all([
          fetch(`/api/costuri-santier/${s.id}`, { cache: "no-store" }),
          fetch(`/api/facturi-primite/${s.id}`, { cache: "no-store" }),
        ]);
        const costuri = (await rc.json().catch(() => ({}))) as RaspunsCosturi;
        const fp = (await rf.json().catch(() => ({}))) as RaspunsFacturiPrimite;
        if (!rc.ok || !rf.ok) throw new Error("raspuns");
        const facturi = fp.facturi ?? [];
        const idFacturi = new Set(facturi.map((f) => f.id));
        const acoperite = new Set<string>();
        for (const [fid, lista] of Object.entries(fp.acopera ?? {})) if (idFacturi.has(fid)) for (const a of lista) acoperite.add(a);
        const fise = calculeazaFisa({
          avizeNefacturate: s.avize.filter((a) => !acoperite.has(a.id)),
          facturi,
          emise: s.emise,
          interne: costuri.configurat && costuri.costuri ? costuri.costuri : null,
        });
        if (!anulat) setStare({ fise });
      } catch {
        if (!anulat) setStare({ eroare: true });
      }
    };
    aduce();
    return () => {
      anulat = true;
    };
  }, [s]);

  const fise = stare && "fise" in stare ? stare.fise : null;
  return (
    <Link href={`/santier/${s.id}`} className={`block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 ${!s.activ ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">{s.nume}</h2>
        <span className="shrink-0 text-slate-400">›</span>
      </div>
      {!stare && <p className="mt-2 text-sm text-slate-400">Se calculează…</p>}
      {stare && "eroare" in stare && <p className="mt-2 text-sm text-amber-700">Cifrele nu s-au putut aduce acum.</p>}
      {fise &&
        fise.map((f) => (
          <div key={f.moneda} className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cheltuit</p>
              <p className="font-semibold tabular-nums text-slate-900">{formateazaSuma(f.totalFaraTva, f.moneda)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Facturat</p>
              <p className="font-semibold tabular-nums text-slate-900">{formateazaSuma(f.facturatFaraTva, f.moneda)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Marjă</p>
              <p className={`font-semibold tabular-nums ${f.marja >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formateazaSuma(f.marja, f.moneda)}</p>
            </div>
          </div>
        ))}
    </Link>
  );
}

export function ListaSantiere({ santiere }: { santiere: SantierLista[] }) {
  const sortate = useMemo(() => [...santiere].sort((a, b) => Number(b.activ) - Number(a.activ) || a.nume.localeCompare(b.nume)), [santiere]);
  return (
    <div className="flex flex-col gap-3">
      {sortate.map((s) => (
        <Rand key={s.id} s={s} />
      ))}
      <p className="px-1 text-xs text-slate-500">Sumele sunt fără TVA. Cheltuielile generale (nealocate pe șantiere) nu sunt incluse; le vezi în fișa fiecărui șantier.</p>
    </div>
  );
}

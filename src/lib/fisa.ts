// Calculul „fișei de șantier”: cât s-a cheltuit în total (cu TVA și fără TVA), pe categorii, față de cât s-a facturat.
// Regula de bază, ca să nu se numere de două ori aceeași marfă:
//   cost = facturile primite alocate șantierului + avizele care NU sunt acoperite de o factură + oameni + utilaje + motorină.
// Fără cod de server, ca să poată fi folosit și de componentele de client.

import type { Aviz, Moneda } from "./types";
import type { FacturaPrimita } from "./facturi-tipuri";
import { COTA_TVA_ESTIMATA_AVIZE } from "./facturi-tipuri";
import type { CosturiPontaj } from "./costuri-tipuri";
import { totalAviz } from "./calcule";

const rotunjeste = (n: number) => Math.round(n * 100) / 100;
const faraTvaEstimat = (cuTva: number) => rotunjeste(cuTva / (1 + COTA_TVA_ESTIMATA_AVIZE / 100));

export interface LinieFisa {
  cheie: "avize" | "facturi" | "oameni" | "utilaje" | "motorina";
  eticheta: string;
  nota?: string;
  cuTva: number;
  faraTva: number;
  /** TRUE când „fără TVA” e doar o estimare (avizele nu păstrează TVA-ul separat) */
  estimat?: boolean;
  nr?: number;
}

export interface FisaMoneda {
  moneda: Moneda;
  linii: LinieFisa[];
  totalCuTva: number;
  totalFaraTva: number;
  facturatCuTva: number;
  facturatFaraTva: number;
  /** facturat − cheltuit, fără TVA */
  marja: number;
  /** marja ca procent din facturat (fără TVA); null dacă nu s-a facturat nimic */
  marjaProcent: number | null;
}

/** Valoarea fără TVA a unei facturi emise (păstrată în pret_unitar); dacă lipsește, se estimează. */
export function faraTvaEmisa(f: Aviz): { valoare: number; estimat: boolean } {
  const p = f.produse?.[0]?.pret_unitar;
  if (p !== null && p !== undefined && Number.isFinite(Number(p))) return { valoare: Number(p), estimat: false };
  return { valoare: faraTvaEstimat(totalAviz(f)), estimat: true };
}

export function calculeazaFisa(opt: {
  /** avizele fără cele acoperite de facturi */
  avizeNefacturate: Aviz[];
  /** facturile primite alocate acestui șantier */
  facturi: FacturaPrimita[];
  /** facturile emise */
  emise: Aviz[];
  /** costurile din pontaj (oameni, utilaje, motorină), în RON; null dacă șantierul nu e legat de pontaj */
  interne: CosturiPontaj | null;
}): FisaMoneda[] {
  const monede = new Set<Moneda>(["RON"]);
  for (const a of opt.avizeNefacturate) monede.add(a.moneda);
  for (const f of opt.facturi) monede.add((f.moneda === "EUR" ? "EUR" : "RON") as Moneda);
  for (const e of opt.emise) monede.add(e.moneda);

  return Array.from(monede)
    .sort()
    .map((moneda) => {
      const avize = opt.avizeNefacturate.filter((a) => a.moneda === moneda);
      const facturi = opt.facturi.filter((f) => (f.moneda === "EUR" ? "EUR" : "RON") === moneda);
      const emise = opt.emise.filter((e) => e.moneda === moneda);

      const avizeCu = rotunjeste(avize.reduce((s, a) => s + totalAviz(a), 0));
      const facturiCu = rotunjeste(facturi.reduce((s, f) => s + f.sumaAlocata, 0));
      const facturiFara = rotunjeste(facturi.reduce((s, f) => s + f.sumaFaraTva, 0));

      const linii: LinieFisa[] = [
        { cheie: "avize", eticheta: "Avize nefacturate", nota: "marfă primită, încă fără factură", cuTva: avizeCu, faraTva: faraTvaEstimat(avizeCu), estimat: true, nr: avize.length },
        { cheie: "facturi", eticheta: "Facturi primite", nota: "alocate acestui șantier", cuTva: facturiCu, faraTva: facturiFara, nr: facturi.length },
      ];

      if (moneda === "RON" && opt.interne) {
        const i = opt.interne;
        const oameni = i.totalOameni ?? 0;
        linii.push(
          { cheie: "oameni", eticheta: "Oameni", nota: `salariu + ${i.procentDari ?? 40}%`, cuTva: oameni, faraTva: oameni, nr: i.nrOameni },
          { cheie: "utilaje", eticheta: "Utilaje", cuTva: i.totalUtilaje, faraTva: i.totalUtilaje },
          { cheie: "motorina", eticheta: "Motorină", cuTva: i.totalMotorina, faraTva: i.totalMotorina }
        );
      }

      const totalCuTva = rotunjeste(linii.reduce((s, l) => s + l.cuTva, 0));
      const totalFaraTva = rotunjeste(linii.reduce((s, l) => s + l.faraTva, 0));
      const facturatCuTva = rotunjeste(emise.reduce((s, e) => s + totalAviz(e), 0));
      const facturatFaraTva = rotunjeste(emise.reduce((s, e) => s + faraTvaEmisa(e).valoare, 0));
      const marja = rotunjeste(facturatFaraTva - totalFaraTva);

      return {
        moneda,
        linii,
        totalCuTva,
        totalFaraTva,
        facturatCuTva,
        facturatFaraTva,
        marja,
        marjaProcent: facturatFaraTva > 0 ? rotunjeste((marja / facturatFaraTva) * 100) : null,
      };
    });
}

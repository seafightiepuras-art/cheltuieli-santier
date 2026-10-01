"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CapturaAviz } from "./CapturaAviz";
import { FormularAviz, type DateSalvareAviz } from "./FormularAviz";
import type { OcrResult, Santier } from "@/lib/types";

type Stare = "alege_santier" | "idle" | "analiza" | "confirmare";

const OCR_GOL: OcrResult = {
  furnizor: null,
  numar_aviz: null,
  data_aviz: null,
  moneda: "RON",
  produse: [],
  camp_incert: [],
};

export function AdaugaAvizClient({
  santiere,
  furnizoriCunoscuti,
  santierPreselectat,
}: {
  santiere: Santier[];
  furnizoriCunoscuti: string[];
  santierPreselectat: Santier | null;
}) {
  const router = useRouter();
  const [santierAles, setSantierAles] = useState<Santier | null>(santierPreselectat);
  const [stare, setStare] = useState<Stare>(santierPreselectat ? "idle" : "alege_santier");

  // Coada de poze de procesat, cand se aleg mai multe deodata din galerie.
  const [coada, setCoada] = useState<File[]>([]);
  const [indexCurent, setIndexCurent] = useState(0);

  const [poza, setPoza] = useState<File | null>(null);
  const [rezultatOcr, setRezultatOcr] = useState<OcrResult>(OCR_GOL);
  const [eroareOcr, setEroareOcr] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [salvateCuSucces, setSalvateCuSucces] = useState(0);

  async function ruleazaOcr(fisier: File) {
    setPoza(fisier);
    setStare("analiza");
    setEroareOcr(null);

    try {
      const formData = new FormData();
      formData.append("poza", fisier);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setEroareOcr(data.eroare ?? "Nu am putut citi avizul automat.");
        setRezultatOcr(OCR_GOL);
      } else {
        setRezultatOcr(data as OcrResult);
      }
    } catch {
      setEroareOcr("Nu am putut contacta serverul. Completează manual câmpurile.");
      setRezultatOcr(OCR_GOL);
    } finally {
      setStare("confirmare");
    }
  }

  function porneseCoada(fisiere: File[]) {
    setCoada(fisiere);
    setIndexCurent(0);
    setSalvateCuSucces(0);
    ruleazaOcr(fisiere[0]);
  }

  function treciLaUrmatoarea() {
    const urmator = indexCurent + 1;
    if (urmator < coada.length) {
      setIndexCurent(urmator);
      ruleazaOcr(coada[urmator]);
    } else {
      router.push(`/santier/${santierAles?.id}`);
      router.refresh();
    }
  }

  async function salveazaAviz(date: DateSalvareAviz, forteaza = false) {
    if (!poza || !santierAles) return;
    setSeSalveaza(true);
    try {
      const formData = new FormData();
      formData.append("poza", poza);
      formData.append("santier_id", santierAles.id);
      formData.append("furnizor", date.furnizor);
      formData.append("numar_aviz", date.numar_aviz);
      formData.append("data_aviz", date.data_aviz);
      formData.append("moneda", date.moneda);
      formData.append("produse", JSON.stringify(date.produse));
      formData.append("camp_incert", JSON.stringify(rezultatOcr.camp_incert ?? []));
      if (forteaza) formData.append("forteaza", "true");

      const res = await fetch("/api/avize", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.posibilDuplicat) {
          setSeSalveaza(false);
          const continua = confirm(`⚠️ ${data.eroare}\n\nÎl salvezi oricum?`);
          if (continua) return salveazaAviz(date, true);
          return;
        }
        throw new Error(data.eroare ?? "Eroare la salvare");
      }
      setSalvateCuSucces((n) => n + 1);
      setSeSalveaza(false);
      treciLaUrmatoarea();
    } catch (eroare) {
      alert(eroare instanceof Error ? eroare.message : "Nu am putut salva avizul.");
      setSeSalveaza(false);
    }
  }

  function sariAvizul() {
    treciLaUrmatoarea();
  }

  const areMaiMulte = coada.length > 1;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-6">
        <Link href={santierAles ? `/santier/${santierAles.id}` : "/"} className="font-semibold text-pink-500">
          ← Înapoi
        </Link>
        <h1 className="font-fancy text-2xl text-pink-600">Adaugă aviz{santierAles ? ` — ${santierAles.nume}` : ""} 🌸</h1>
      </header>

      {areMaiMulte && (stare === "analiza" || stare === "confirmare") && (
        <p className="rounded-full bg-pink-100 px-4 py-1.5 text-center text-sm font-semibold text-pink-600">
          Aviz {indexCurent + 1} din {coada.length} {salvateCuSucces > 0 && `· ${salvateCuSucces} salvate deja`}
        </p>
      )}

      {stare === "alege_santier" && (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-rose-600">Pe ce șantier ai primit marfa?</p>
          {santiere.length === 0 && <p className="text-sm text-pink-400">Nu ai încă niciun șantier — adaugă unul din pagina principală.</p>}
          {santiere.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSantierAles(s);
                setStare("idle");
              }}
              className="rounded-2xl border border-pink-200 bg-white/85 p-3 text-left font-semibold text-rose-800 shadow-sm shadow-pink-100 backdrop-blur-sm"
            >
              {s.nume}
            </button>
          ))}
        </div>
      )}

      {stare === "idle" && <CapturaAviz onCaptura={porneseCoada} dezactivat={false} />}

      {stare === "analiza" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-pink-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
          <p>Se citește avizul… 💕</p>
        </div>
      )}

      {stare === "confirmare" && poza && (
        <>
          {eroareOcr && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{eroareOcr}</p>}
          <FormularAviz
            valoriInitiale={{
              furnizor: rezultatOcr.furnizor ?? "",
              numar_aviz: rezultatOcr.numar_aviz ?? "",
              data_aviz: rezultatOcr.data_aviz ?? "",
              moneda: rezultatOcr.moneda ?? "RON",
              produse: rezultatOcr.produse.map((p) => ({
                denumire: p.denumire,
                cantitate: p.cantitate,
                unitate_masura: p.unitate_masura,
                pret_unitar: p.pret_unitar,
                valoare: p.valoare ?? 0,
                categorie: p.categorie,
              })),
            }}
            campIncert={rezultatOcr.camp_incert}
            poza={poza}
            furnizoriCunoscuti={furnizoriCunoscuti}
            seSalveaza={seSalveaza}
            textButonSalveaza={areMaiMulte ? "Salvează și treci la următorul" : "Salvează avizul"}
            onSalveaza={salveazaAviz}
            onRenunta={areMaiMulte ? sariAvizul : () => {
              setStare("idle");
              setCoada([]);
              setPoza(null);
              setRezultatOcr(OCR_GOL);
              setEroareOcr(null);
            }}
          />
          {areMaiMulte && (
            <button onClick={sariAvizul} className="text-center text-sm font-medium text-pink-400 underline">
              Sari peste acest aviz (nu-l salva)
            </button>
          )}
        </>
      )}
    </main>
  );
}

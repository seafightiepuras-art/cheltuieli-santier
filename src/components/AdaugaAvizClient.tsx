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
  const [poza, setPoza] = useState<File | null>(null);
  const [rezultatOcr, setRezultatOcr] = useState<OcrResult>(OCR_GOL);
  const [eroareOcr, setEroareOcr] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function proceseazaOcr(fisier: File) {
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

  async function salveazaAviz(date: DateSalvareAviz) {
    if (!poza || !santierAles) return;
    setSeSalveaza(true);
    try {
      const formData = new FormData();
      formData.append("poza", poza);
      formData.append("santier_id", santierAles.id);
      formData.append("furnizor", date.furnizor);
      formData.append("numar_aviz", date.numar_aviz);
      formData.append("data_aviz", date.data_aviz);
      formData.append("produse", JSON.stringify(date.produse));
      formData.append("camp_incert", JSON.stringify(rezultatOcr.camp_incert ?? []));

      const res = await fetch("/api/avize", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.eroare ?? "Eroare la salvare");
      }
      router.push(`/santier/${santierAles.id}`);
      router.refresh();
    } catch (eroare) {
      alert(eroare instanceof Error ? eroare.message : "Nu am putut salva avizul.");
      setSeSalveaza(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-4">
        <Link href={santierAles ? `/santier/${santierAles.id}` : "/"} className="text-slate-500">
          ← Înapoi
        </Link>
        <h1 className="text-xl font-bold">Adaugă aviz{santierAles ? ` — ${santierAles.nume}` : ""}</h1>
      </header>

      {stare === "alege_santier" && (
        <div className="flex flex-col gap-2">
          <p className="text-slate-500">Pe ce șantier ai primit marfa?</p>
          {santiere.length === 0 && <p className="text-sm text-slate-400">Nu ai încă niciun șantier — adaugă unul din pagina principală.</p>}
          {santiere.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSantierAles(s);
                setStare("idle");
              }}
              className="rounded-lg border border-slate-200 bg-white p-3 text-left font-medium shadow-sm"
            >
              {s.nume}
            </button>
          ))}
        </div>
      )}

      {stare === "idle" && <CapturaAviz onCaptura={proceseazaOcr} dezactivat={false} />}

      {stare === "analiza" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          <p>Se citește avizul…</p>
        </div>
      )}

      {stare === "confirmare" && poza && (
        <>
          {eroareOcr && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{eroareOcr}</p>}
          <FormularAviz
            valoriInitiale={{
              furnizor: rezultatOcr.furnizor ?? "",
              numar_aviz: rezultatOcr.numar_aviz ?? "",
              data_aviz: rezultatOcr.data_aviz ?? "",
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
            onSalveaza={salveazaAviz}
            onRenunta={() => {
              setStare("idle");
              setPoza(null);
              setRezultatOcr(OCR_GOL);
              setEroareOcr(null);
            }}
          />
        </>
      )}
    </main>
  );
}

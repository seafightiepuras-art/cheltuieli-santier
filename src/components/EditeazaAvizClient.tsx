"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormularAviz, type DateSalvareAviz } from "./FormularAviz";
import type { Aviz } from "@/lib/types";

export function EditeazaAvizClient({ aviz, furnizoriCunoscuti }: { aviz: Aviz; furnizoriCunoscuti: string[] }) {
  const router = useRouter();
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function salveaza(date: DateSalvareAviz) {
    setSeSalveaza(true);
    try {
      const res = await fetch(`/api/avize/${aviz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(date),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.eroare ?? "Eroare la salvare");
      }
      router.push(`/santier/${aviz.santier_id}`);
      router.refresh();
    } catch (eroare) {
      alert(eroare instanceof Error ? eroare.message : "Nu am putut salva modificările.");
      setSeSalveaza(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-6">
        <Link href={`/santier/${aviz.santier_id}`} className="font-semibold text-pink-500">
          ← Înapoi
        </Link>
        <h1 className="font-fancy text-2xl text-pink-600">Editează avizul 💅</h1>
      </header>

      <FormularAviz
        valoriInitiale={{
          furnizor: aviz.furnizor,
          numar_aviz: aviz.numar_aviz ?? "",
          data_aviz: aviz.data_aviz ?? "",
          produse: (aviz.produse ?? []).map((p) => ({
            denumire: p.denumire,
            cantitate: p.cantitate,
            unitate_masura: p.unitate_masura,
            pret_unitar: p.pret_unitar,
            valoare: p.valoare,
            categorie: p.categorie,
          })),
        }}
        poza={null}
        pozaExistentaUrl={aviz.poza_url}
        furnizoriCunoscuti={furnizoriCunoscuti}
        seSalveaza={seSalveaza}
        textButonSalveaza="Salvează modificările"
        onSalveaza={salveaza}
        onRenunta={() => router.push(`/santier/${aviz.santier_id}`)}
      />
    </main>
  );
}

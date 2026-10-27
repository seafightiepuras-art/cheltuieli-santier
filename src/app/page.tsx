import Link from "next/link";
import { fetchAvizePeSantiere, fetchSantiere } from "@/lib/date";
import { AdaugaSantier } from "@/components/AdaugaSantier";
import { ListaSantiere } from "@/components/ListaSantiere";

export const dynamic = "force-dynamic";

export default async function Acasa() {
  const [santiere, peSantier] = await Promise.all([fetchSantiere(), fetchAvizePeSantiere()]);

  return (
    <main className="fisa-santier mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-24">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-slate-900">Cheltuieli șantier</h1>
        <p className="mt-1 text-sm text-slate-500">Cât s-a cheltuit, cât s-a facturat și marja, pe fiecare șantier.</p>
      </header>

      {santiere.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Niciun șantier încă. Adaugă primul mai jos.</p>}
      <ListaSantiere
        santiere={santiere.map((s) => ({ id: s.id, nume: s.nume, activ: s.activ, avize: peSantier[s.id]?.avize ?? [], emise: peSantier[s.id]?.emise ?? [] }))}
      />
      <AdaugaSantier />

      <Link href="/adauga" className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-3xl text-white shadow-lg" aria-label="Adaugă aviz">
        +
      </Link>
    </main>
  );
}

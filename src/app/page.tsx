import Link from "next/link";
import { fetchSantiere } from "@/lib/date";
import { formateazaSuma } from "@/lib/format";
import { AdaugaSantier } from "@/components/AdaugaSantier";

export const dynamic = "force-dynamic";

export default async function Acasa() {
  const santiere = await fetchSantiere();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="text-2xl font-bold">Cheltuieli Șantier</h1>
        <p className="text-sm text-slate-500">Avize și cheltuieli, centralizate pe fiecare șantier.</p>
      </header>

      <div className="flex flex-col gap-2">
        {santiere.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            Niciun șantier încă — adaugă primul mai jos.
          </p>
        )}
        {santiere.map((s) => (
          <Link
            key={s.id}
            href={`/santier/${s.id}`}
            className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${!s.activ ? "opacity-50" : ""}`}
          >
            <span className="font-medium">{s.nume}</span>
            <span className="text-sm text-slate-500">{formateazaSuma(s.totalCheltuit)}</span>
          </Link>
        ))}
        <AdaugaSantier />
      </div>

      <Link
        href="/adauga"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl text-white shadow-lg"
        aria-label="Adaugă aviz"
      >
        +
      </Link>
    </main>
  );
}

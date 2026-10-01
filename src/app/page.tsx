import Link from "next/link";
import { fetchSantiere } from "@/lib/date";
import { formateazaSuma } from "@/lib/format";
import { AdaugaSantier } from "@/components/AdaugaSantier";

export const dynamic = "force-dynamic";

export default async function Acasa() {
  const santiere = await fetchSantiere();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-24">
      <header className="pt-6 text-center">
        <h1 className="font-fancy text-4xl text-pink-600 drop-shadow-sm">✨ Cheltuieli Șantier ✨</h1>
        <p className="mt-2 text-sm font-medium text-rose-500">Avize și cheltuieli, centralizate pe fiecare șantier 💕</p>
      </header>

      <div className="flex flex-col gap-3">
        {santiere.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-pink-300 bg-white/70 p-6 text-center text-sm font-medium text-pink-400 backdrop-blur-sm">
            Niciun șantier încă — adaugă primul mai jos 🌸
          </p>
        )}
        {santiere.map((s) => (
          <Link
            key={s.id}
            href={`/santier/${s.id}`}
            className={`flex items-center justify-between rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm transition hover:shadow-lg hover:shadow-pink-200 ${!s.activ ? "opacity-50" : ""}`}
          >
            <span className="font-semibold text-rose-800">{s.nume}</span>
            <span className="flex flex-col items-end gap-1">
              {s.totaluriPeMoneda.length === 0 ? (
                <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-600">{formateazaSuma(0)}</span>
              ) : (
                s.totaluriPeMoneda.map((t) => (
                  <span key={t.moneda} className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-600">
                    {formateazaSuma(t.total, t.moneda)}
                  </span>
                ))
              )}
            </span>
          </Link>
        ))}
        <AdaugaSantier />
      </div>

      <Link
        href="/adauga"
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-3xl text-white shadow-lg shadow-pink-300 transition hover:scale-105"
        aria-label="Adaugă aviz"
      >
        +
      </Link>
    </main>
  );
}

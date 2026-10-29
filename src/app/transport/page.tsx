import Link from "next/link";
import { fetchSantiere } from "@/lib/date";
import { citesteSetari } from "@/lib/setari-costuri";
import { TransportClient } from "@/components/TransportClient";

export const dynamic = "force-dynamic";

/** Alegi la ce șantiere se adaugă transportul oamenilor (drumul dus-întors de la sediu) și câți km are fiecare. */
export default async function Transport() {
  const [santiere, setari] = await Promise.all([fetchSantiere(), citesteSetari()]);

  return (
    <main className="fisa-santier mx-auto flex max-w-2xl flex-col gap-4 p-4 pb-24">
      <header className="pt-2">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          ← Toate șantierele
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Transport pe șantiere</h1>
        <p className="mt-1 text-sm text-slate-500">Bifează șantierele la care se adaugă costul drumului. La celelalte nu se adaugă nimic.</p>
      </header>

      <TransportClient santiere={santiere.map((s) => ({ id: s.id, nume: s.nume, km: setari.km[s.id] ?? null }))} pretMotorina={setari.pretMotorina} />
    </main>
  );
}

import Link from "next/link";
import { fetchToateAvizele } from "@/lib/date";
import { CautareAvize } from "@/components/CautareAvize";

export const dynamic = "force-dynamic";

/** Căutare în toate avizele, de pe toate șantierele deodată. */
export default async function Cauta() {
  const avize = await fetchToateAvizele();

  return (
    <main className="fisa-santier mx-auto flex max-w-2xl flex-col gap-4 p-4 pb-24">
      <header className="pt-2">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          ← Toate șantierele
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Caută în toate avizele</h1>
      </header>

      <CautareAvize avize={avize} />
    </main>
  );
}

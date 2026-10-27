import { fetchFurnizoriCunoscuti, fetchSantier, fetchSantiere } from "@/lib/date";
import { AdaugaAvizClient } from "@/components/AdaugaAvizClient";

export const dynamic = "force-dynamic";

export default async function AdaugaAvizPage({ searchParams }: { searchParams: { santier?: string } }) {
  const [santiere, furnizoriCunoscuti, santierPreselectat] = await Promise.all([
    fetchSantiere(),
    fetchFurnizoriCunoscuti(),
    searchParams.santier ? fetchSantier(searchParams.santier) : Promise.resolve(null),
  ]);

  // șantierele încheiate nu mai apar la alegere (decât dacă vii direct din fișa lui)
  const deAles = santiere.filter((s) => s.activ !== false || s.id === searchParams.santier);

  return <AdaugaAvizClient santiere={deAles}furnizoriCunoscuti={furnizoriCunoscuti} santierPreselectat={santierPreselectat} />;
}

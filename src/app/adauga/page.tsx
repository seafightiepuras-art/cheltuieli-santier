import { fetchFurnizoriCunoscuti, fetchSantier, fetchSantiere } from "@/lib/date";
import { AdaugaAvizClient } from "@/components/AdaugaAvizClient";

export const dynamic = "force-dynamic";

export default async function AdaugaAvizPage({ searchParams }: { searchParams: { santier?: string } }) {
  const [santiere, furnizoriCunoscuti, santierPreselectat] = await Promise.all([
    fetchSantiere(),
    fetchFurnizoriCunoscuti(),
    searchParams.santier ? fetchSantier(searchParams.santier) : Promise.resolve(null),
  ]);

  return <AdaugaAvizClient santiere={santiere} furnizoriCunoscuti={furnizoriCunoscuti} santierPreselectat={santierPreselectat} />;
}

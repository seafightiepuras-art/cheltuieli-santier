import { notFound } from "next/navigation";
import { fetchClientiCunoscuti, fetchSantier } from "@/lib/date";
import { AdaugaFacturaEmisaClient } from "@/components/FacturaEmisaClient";

export const dynamic = "force-dynamic";

export default async function FacturaEmisaPage({ searchParams }: { searchParams: { santier?: string } }) {
  if (!searchParams.santier) notFound();
  const [santier, clienti] = await Promise.all([fetchSantier(searchParams.santier), fetchClientiCunoscuti()]);
  if (!santier) notFound();
  return <AdaugaFacturaEmisaClient santier={santier} clientiCunoscuti={clienti} />;
}

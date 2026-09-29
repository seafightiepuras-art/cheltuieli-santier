import { notFound } from "next/navigation";
import { fetchAvizeSantier, fetchSantier } from "@/lib/date";
import { SantierDetaliiClient } from "@/components/SantierDetaliiClient";

export const dynamic = "force-dynamic";

export default async function SantierPage({ params }: { params: { id: string } }) {
  const santier = await fetchSantier(params.id);
  if (!santier) notFound();

  const avize = await fetchAvizeSantier(params.id);

  return <SantierDetaliiClient santier={santier} avize={avize} />;
}

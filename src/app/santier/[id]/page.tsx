import { notFound } from "next/navigation";
import { fetchAvizeSantier, fetchSantier } from "@/lib/date";
import { esteFacturaEmisa } from "@/lib/types";
import { SantierDetaliiClient } from "@/components/SantierDetaliiClient";

export const dynamic = "force-dynamic";

export default async function SantierPage({ params }: { params: { id: string } }) {
  const santier = await fetchSantier(params.id);
  if (!santier) notFound();

  const toate = await fetchAvizeSantier(params.id);
  const avize = toate.filter((a) => !esteFacturaEmisa(a));
  const emise = toate.filter(esteFacturaEmisa);

  return <SantierDetaliiClient santier={santier} avize={avize} emise={emise} />;
}

import { notFound } from "next/navigation";
import { fetchAviz, fetchClientiCunoscuti } from "@/lib/date";
import { esteFacturaEmisa } from "@/lib/types";
import { EditeazaFacturaEmisaClient } from "@/components/FacturaEmisaClient";

export const dynamic = "force-dynamic";

export default async function EditeazaFacturaEmisaPage({ params }: { params: { id: string } }) {
  const [factura, clienti] = await Promise.all([fetchAviz(params.id), fetchClientiCunoscuti()]);
  if (!factura || !esteFacturaEmisa(factura)) notFound();
  return <EditeazaFacturaEmisaClient factura={factura} clientiCunoscuti={clienti} />;
}

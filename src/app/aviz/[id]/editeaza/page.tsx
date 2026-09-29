import { notFound } from "next/navigation";
import { fetchAviz, fetchFurnizoriCunoscuti } from "@/lib/date";
import { EditeazaAvizClient } from "@/components/EditeazaAvizClient";

export const dynamic = "force-dynamic";

export default async function EditeazaAvizPage({ params }: { params: { id: string } }) {
  const [aviz, furnizoriCunoscuti] = await Promise.all([fetchAviz(params.id), fetchFurnizoriCunoscuti()]);
  if (!aviz) notFound();

  return <EditeazaAvizClient aviz={aviz} furnizoriCunoscuti={furnizoriCunoscuti} />;
}

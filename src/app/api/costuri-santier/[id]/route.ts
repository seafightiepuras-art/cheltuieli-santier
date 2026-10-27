import { NextResponse } from "next/server";
import { citesteSetari } from "@/lib/setari-costuri";
import { apeleazaPontaj, type CosturiPontaj, type ListaPontaj } from "@/lib/pontaj";

/** Costurile din pontaj ale unui șantier: manoperă, utilaje, motorină. `luna` = YYYY-MM sau „toate”. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const luna = new URL(req.url).searchParams.get("luna");
  const lunaValida = luna && /^\d{4}-\d{2}$/.test(luna) ? luna : null;

  try {
    const setari = await citesteSetari();
    const legat = setari.legaturi[params.id] ?? [];

    if (legat.length === 0) {
      const lista = await apeleazaPontaj<ListaPontaj>({ actiune: "lista" });
      return NextResponse.json({ configurat: false, lista });
    }

    const costuri = await apeleazaPontaj<CosturiPontaj>({ santiere: legat, luna: lunaValida, tarife: setari.tarife, pretMotorina: setari.pretMotorina, procentDari: setari.procentDari });
    return NextResponse.json({ configurat: true, legat, pretMotorina: setari.pretMotorina, procentDari: setari.procentDari, costuri });
  } catch (e) {
    return NextResponse.json({ eroare: (e as Error).message }, { status: 502 });
  }
}

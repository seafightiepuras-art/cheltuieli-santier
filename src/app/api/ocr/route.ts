import { NextResponse } from "next/server";
import { extrageDateAviz } from "@/lib/anthropic";

// Vercel limitează implicit corpul cererilor către Serverless Functions la ~4.5MB —
// rămânem sub acel prag ca upload-ul să nu eșueze la deploy, chiar dacă local ar merge mai mult.
const MARIME_MAXIMA = 4 * 1024 * 1024;

function esteFormatAcceptat(tip: string) {
  return tip.startsWith("image/") || tip === "application/pdf";
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const fisier = formData.get("poza");

  if (!(fisier instanceof File)) {
    return NextResponse.json({ eroare: "Lipsește poza avizului" }, { status: 400 });
  }
  if (!esteFormatAcceptat(fisier.type)) {
    return NextResponse.json({ eroare: "Fișierul trebuie să fie o poză sau un PDF" }, { status: 400 });
  }
  if (fisier.size > MARIME_MAXIMA) {
    return NextResponse.json({ eroare: "Fișierul e prea mare (max 4MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await fisier.arrayBuffer());
    const rezultat = await extrageDateAviz(buffer.toString("base64"), fisier.type);
    return NextResponse.json(rezultat);
  } catch (eroare) {
    console.error("Eroare OCR:", eroare);
    return NextResponse.json({ eroare: "Nu am putut citi avizul automat. Completează manual câmpurile." }, { status: 502 });
  }
}

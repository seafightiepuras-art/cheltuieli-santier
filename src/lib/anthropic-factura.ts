import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { FacturaOcr } from "./types";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

const PROMPT = `Ești un asistent care extrage date dintr-o FACTURĂ FISCALĂ EMISĂ de firma utilizatorului către un client (poză, scan sau PDF).
Răspunde STRICT cu un obiect JSON valid, fără text explicativ, fără markdown, fără blocuri de cod.

Format exact:
{
  "client": string | null,
  "numar_factura": string | null,
  "data_factura": string | null,
  "moneda": "RON" | "EUR",
  "total_fara_tva": number | null,
  "tva": number | null,
  "total_cu_tva": number | null,
  "camp_incert": string[]
}

Reguli:
- "client": numele firmei CUMPĂRĂTOR (cea căreia i se facturează), nu al furnizorului/emitentului.
- "numar_factura": seria și numărul, exact cum apar (ex. "ALC 1234").
- "data_factura" în format YYYY-MM-DD.
- "moneda": "EUR" dacă apare explicit "EUR" sau "€" lângă totaluri; altfel "RON" (implicit, inclusiv "LEI").
- "total_fara_tva", "tva", "total_cu_tva": TRANSCRIE din zona de totaluri a facturii (Total fără TVA / Total TVA / Total de plată), exact cum sunt tipărite. NU le calcula tu. Dacă lipsește unul, pune null.
- Dacă un câmp nu poate fi citit, pune null și adaugă numele câmpului în "camp_incert".
- Nu inventa valori.`;

function numarSauNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function extrageDateFactura(fisierBase64: string, mediaType: string): Promise<FacturaOcr> {
  const esteDocumentPdf = mediaType === "application/pdf";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          esteDocumentPdf
            ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: fisierBase64 } }
            : {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: fisierBase64,
                },
              },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const blocText = response.content.find((b) => b.type === "text");
  if (!blocText || blocText.type !== "text") {
    throw new Error("Răspuns OCR gol");
  }

  const textCurat = blocText.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsat: Record<string, unknown>;
  try {
    parsat = JSON.parse(textCurat);
  } catch {
    console.error("Răspuns OCR factură ne-JSON:", blocText.text);
    throw new Error("Răspuns OCR invalid (nu e JSON)");
  }

  const fara = numarSauNull(parsat.total_fara_tva);
  const tva = numarSauNull(parsat.tva);
  let cu = numarSauNull(parsat.total_cu_tva);
  if (cu === null && fara !== null && tva !== null) cu = Math.round((fara + tva) * 100) / 100;

  return {
    client: typeof parsat.client === "string" ? parsat.client : null,
    numar_factura: typeof parsat.numar_factura === "string" ? parsat.numar_factura : null,
    data_factura: typeof parsat.data_factura === "string" ? parsat.data_factura : null,
    moneda: parsat.moneda === "EUR" ? "EUR" : "RON",
    total_fara_tva: fara,
    tva,
    total_cu_tva: cu,
    camp_incert: Array.isArray(parsat.camp_incert) ? (parsat.camp_incert as string[]) : [],
  };
}

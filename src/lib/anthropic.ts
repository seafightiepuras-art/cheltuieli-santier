import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CategorieCheltuiala, OcrResult, ProdusOcr } from "./types";

const client = new Anthropic();

const CATEGORII_VALIDE: CategorieCheltuiala[] = ["materiale", "combustibil", "utilaje", "transport", "diverse"];

const PROMPT = `Ești un asistent care extrage date dintr-o poză a unui AVIZ DE ÎNSOȚIRE A MĂRFII, pe hârtie, dintr-un șantier de construcții.
Răspunde STRICT cu un obiect JSON valid, fără text explicativ, fără markdown, fără \`\`\`.

Format exact:
{
  "furnizor": string | null,
  "numar_aviz": string | null,
  "data_aviz": string | null,
  "produse": [
    { "denumire": string, "cantitate": number | null, "unitate_masura": string | null, "pret_unitar": number | null, "valoare": number | null, "categorie": "materiale" | "combustibil" | "utilaje" | "transport" | "diverse" }
  ],
  "camp_incert": string[]
}

Reguli:
- "numar_aviz": numărul avizului, exact cum apare pe document.
- "data_aviz" în format YYYY-MM-DD.
- "furnizor": numele firmei care a EMIS avizul (vânzătorul/transportatorul), nu al firmei care primește marfa.
- "produse": o listă cu FIECARE produs/material de pe aviz, ca rând separat, în ordinea în care apar pe document. NU le grupa și NU le rezuma într-un singur rând — dacă avizul are 5 produse, lista trebuie să aibă 5 elemente.
  - "cantitate" și "unitate_masura" (ex. "buc", "kg", "mc", "ml", "tona", "sac", "ore"), dacă apar pe document.
  - "pret_unitar", dacă apare pe document (unele avize nu au preț — atunci pune null).
  - "valoare" e suma totală a acelui rând (cantitate × preț unitar, sau cum apare direct pe document). Dacă avizul nu are deloc prețuri, pune valoarea pe null pentru toate rândurile.
  - "categorie" — clasifică fiecare produs cât mai bine, după conținutul lui:
    - "materiale" — materiale de construcții (ciment, nisip, pietriș, cărămidă, BCA, fier beton, lemn, izolații, vopsele, țiglă, pavele, țevi, cabluri etc.)
    - "combustibil" — motorină, benzină, gaz
    - "utilaje" — închirieri de utilaje/echipamente, piese și reparații de utilaje
    - "transport" — servicii de transport marfă, taxe de drum
    - "diverse" — orice nu se încadrează clar în celelalte
- Dacă un câmp nu poate fi citit sau nu apare pe document, pune valoarea pe null (sau listă goală pentru "produse") și adaugă numele câmpului în "camp_incert" (folosește "produse" ca nume dacă lista de produse nu a putut fi citită deloc).
- Nu inventa valori. Dacă nu ești sigur, mai bine null + camp_incert.`;

const MODEL = "claude-haiku-4-5-20251001";

function curataProdus(p: unknown): ProdusOcr {
  const obj = (p ?? {}) as Record<string, unknown>;
  const categorie = CATEGORII_VALIDE.includes(obj.categorie as CategorieCheltuiala)
    ? (obj.categorie as CategorieCheltuiala)
    : "diverse";
  return {
    denumire: typeof obj.denumire === "string" && obj.denumire.trim() ? obj.denumire.trim() : "Produs necunoscut",
    cantitate: typeof obj.cantitate === "number" ? obj.cantitate : null,
    unitate_masura: typeof obj.unitate_masura === "string" ? obj.unitate_masura : null,
    pret_unitar: typeof obj.pret_unitar === "number" ? obj.pret_unitar : null,
    valoare: typeof obj.valoare === "number" ? obj.valoare : null,
    categorie,
  };
}

export async function extrageDateAviz(fisierBase64: string, mediaType: string): Promise<OcrResult> {
  const esteDocumentPdf = mediaType === "application/pdf";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
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
    console.error("Răspuns OCR ne-JSON:", blocText.text);
    throw new Error("Răspuns OCR invalid (nu e JSON)");
  }

  return {
    furnizor: typeof parsat.furnizor === "string" ? parsat.furnizor : null,
    numar_aviz: typeof parsat.numar_aviz === "string" ? parsat.numar_aviz : null,
    data_aviz: typeof parsat.data_aviz === "string" ? parsat.data_aviz : null,
    produse: Array.isArray(parsat.produse) ? parsat.produse.map(curataProdus) : [],
    camp_incert: Array.isArray(parsat.camp_incert) ? (parsat.camp_incert as string[]) : [],
  };
}

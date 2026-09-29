# Cheltuieli Șantier

Centralizează avizele de însoțire a mărfii pe fiecare șantier — faci o poză, AI-ul citește automat furnizorul, numărul avizului și fiecare produs de pe el (categorisit automat: materiale, combustibil, utilaje, transport, diverse), tu confirmi. Vezi central, pe fiecare șantier, cât s-a cheltuit și pe ce.

Fără login — la fel ca la `facturi-app`, accesul e direct pe link. Scrierile în bază trec însă doar prin server (nu direct din browser), spre deosebire de `facturi-app`.

## Pornire locală

```bash
npm install
cp .env.local.example .env.local   # completează cu cheile tale
npm run dev
```

## Configurare Supabase (o singură dată)

1. Creează un proiect nou pe [supabase.com](https://supabase.com).
2. Project Settings → API → copiază `URL`, `anon public key`, `service_role key` în `.env.local`.
3. SQL Editor → rulează conținutul din `supabase/schema.sql` (creează tabelele `santiere`, `avize`, `produse`, plus bucket-ul de storage pentru poze).

## Configurare Anthropic

`ANTHROPIC_API_KEY` din [console.anthropic.com](https://console.anthropic.com/settings/keys) — folosită doar în `src/app/api/ocr/route.ts`, niciodată expusă în browser.

## Structură

- `src/app/page.tsx` — lista șantierelor, cu total cheltuit fiecare.
- `src/app/santier/[id]/page.tsx` — un șantier: total pe categorii, filtru pe lună, căutare, listă avize.
- `src/app/adauga/page.tsx` — flux de adăugare: alege șantier → poză → citire automată → confirmare.
- `src/app/aviz/[id]/editeaza/page.tsx` — corectează un aviz salvat.
- `src/app/api/ocr/route.ts` — citirea pozei cu Claude (vision).
- `src/app/api/avize/`, `src/app/api/santiere/`, `src/app/api/export/` — scriere/CSV, toate cu cheia de service.

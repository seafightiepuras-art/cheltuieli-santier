import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client pentru citire în Server Components — cheia anon e suficientă, RLS permite select.
 * Fetch-ul e forțat "no-store": în React Server Components, Next.js aplică propriul cache
 * peste fetch-urile făcute de biblioteci precum supabase-js, care altfel pot întoarce date
 * învechite chiar și cu `export const dynamic = "force-dynamic"` pe pagină.
 */
export function creeazaClientServer() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

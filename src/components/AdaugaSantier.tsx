"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdaugaSantier() {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [nume, setNume] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function adauga(e: React.FormEvent) {
    e.preventDefault();
    if (!nume.trim()) return;
    setSeTrimite(true);
    setEroare(null);
    const res = await fetch("/api/santiere", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nume }),
    });
    setSeTrimite(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEroare(data.eroare ?? "Nu am putut adăuga șantierul.");
      return;
    }
    setNume("");
    setDeschis(false);
    router.refresh();
  }

  if (!deschis) {
    return (
      <button
        onClick={() => setDeschis(true)}
        className="rounded-2xl border-2 border-dashed border-pink-300 bg-white/60 py-3 text-sm font-semibold text-pink-500 backdrop-blur-sm transition hover:bg-white/80"
      >
        🌷 Adaugă șantier nou
      </button>
    );
  }

  return (
    <form onSubmit={adauga} className="flex flex-col gap-2 rounded-2xl border border-pink-200 bg-white/85 p-4 shadow-md shadow-pink-100 backdrop-blur-sm">
      <input
        autoFocus
        className="rounded-xl border border-pink-200 bg-white/90 p-2 text-sm text-rose-800 placeholder:text-pink-300 focus:border-pink-400 focus:outline-none"
        placeholder="Numele șantierului"
        value={nume}
        onChange={(e) => setNume(e.target.value)}
      />
      {eroare && <p className="text-sm text-red-500">{eroare}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDeschis(false)}
          className="flex-1 rounded-full border-2 border-pink-200 py-2 text-sm font-semibold text-pink-500"
        >
          Renunță
        </button>
        <button
          type="submit"
          disabled={seTrimite}
          className="flex-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 py-2 text-sm font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {seTrimite ? "Se adaugă…" : "Adaugă"}
        </button>
      </div>
    </form>
  );
}

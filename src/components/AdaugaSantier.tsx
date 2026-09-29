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
      <button onClick={() => setDeschis(true)} className="rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-500">
        + Adaugă șantier nou
      </button>
    );
  }

  return (
    <form onSubmit={adauga} className="flex flex-col gap-2 rounded-lg border border-slate-300 p-3">
      <input
        autoFocus
        className="rounded border border-slate-300 p-2 text-sm"
        placeholder="Numele șantierului"
        value={nume}
        onChange={(e) => setNume(e.target.value)}
      />
      {eroare && <p className="text-sm text-red-600">{eroare}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setDeschis(false)} className="flex-1 rounded border border-slate-300 py-2 text-sm">
          Renunță
        </button>
        <button type="submit" disabled={seTrimite} className="flex-1 rounded bg-slate-900 py-2 text-sm text-white disabled:opacity-50">
          {seTrimite ? "Se adaugă…" : "Adaugă"}
        </button>
      </div>
    </form>
  );
}

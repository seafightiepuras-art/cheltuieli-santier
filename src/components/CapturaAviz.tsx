"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

export function CapturaAviz({ onCaptura, dezactivat }: { onCaptura: (fisier: File) => void; dezactivat: boolean }) {
  const inputCameraRef = useRef<HTMLInputElement>(null);
  const inputFisierRef = useRef<HTMLInputElement>(null);
  const [seComprima, setSeComprima] = useState(false);

  async function proceseazaFisier(fisier: File) {
    if (!fisier.type.startsWith("image/")) {
      // PDF sau alt format nefotografic — trimis direct, fara compresie (doar imaginile se comprima).
      onCaptura(fisier);
      return;
    }

    setSeComprima(true);
    try {
      const comprimat = await imageCompression(fisier, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });
      onCaptura(comprimat);
    } catch {
      onCaptura(fisier);
    } finally {
      setSeComprima(false);
    }
  }

  function alegeFisier(e: React.ChangeEvent<HTMLInputElement>) {
    const fisier = e.target.files?.[0];
    e.target.value = "";
    if (fisier) proceseazaFisier(fisier);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-slate-500">Fă o poză avizului sau încarcă un fișier (poză ori PDF)</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={dezactivat || seComprima}
          onClick={() => inputCameraRef.current?.click()}
          className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white disabled:opacity-50"
        >
          {seComprima ? "Se pregătește…" : "📷 Fă o poză"}
        </button>
        <button
          type="button"
          disabled={dezactivat || seComprima}
          onClick={() => inputFisierRef.current?.click()}
          className="rounded-full border border-slate-300 px-6 py-3 font-medium disabled:opacity-50"
        >
          📁 Alege din galerie / fișiere
        </button>
      </div>

      <input ref={inputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={alegeFisier} />
      <input ref={inputFisierRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={alegeFisier} />
    </div>
  );
}

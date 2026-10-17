import type { Metadata } from "next";
import "./globals.css";
import { Particule } from "@/components/Particule";
import { BaraNavigare } from "@/components/BaraNavigare";

export const metadata: Metadata = {
  title: "Cheltuieli Șantier",
  description: "Centralizează avizele și cheltuielile pe fiecare șantier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="min-h-screen">
        <div className="fundal-viu" aria-hidden="true">
          <div />
        </div>
        <Particule />
        <BaraNavigare />
        {children}
      </body>
    </html>
  );
}

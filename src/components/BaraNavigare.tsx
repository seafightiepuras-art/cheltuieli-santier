"use client";

import { usePathname } from "next/navigation";

/** O linie roz care aleargă în capul paginii la fiecare schimbare de pagină. */
export function BaraNavigare() {
  const pathname = usePathname();
  return <div key={pathname} className="bara-nav" aria-hidden="true" />;
}

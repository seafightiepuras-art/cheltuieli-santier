// La fiecare schimbare de pagină, conținutul intră cu o mică animație.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina-anim">{children}</div>;
}

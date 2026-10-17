"use client";

// Steluțe, inimioare și petale care plutesc încet în spatele paginii. Pozițiile sunt fixe (nu aleatorii),
// ca serverul și browserul să deseneze exact la fel.
const PARTICULE = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 8) % 100,
  marime: 14 + ((i * 7) % 18),
  durata: 16 + ((i * 5) % 14),
  intarziere: -((i * 3) % 16),
  dx: (i % 2 ? 1 : -1) * (20 + ((i * 11) % 50)),
  rot: (i % 2 ? 1 : -1) * (30 + ((i * 13) % 110)),
  semn: ["✨", "💕", "🌸", "🌷", "✨", "💖"][i % 6],
}));

export function Particule() {
  return (
    <div aria-hidden="true">
      {PARTICULE.map((p, i) => (
        <span
          key={i}
          className="particula"
          style={
            {
              "--x": `${p.x}%`,
              "--s": `${p.marime}px`,
              "--d": `${p.durata}s`,
              "--delay": `${p.intarziere}s`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        >
          {p.semn}
        </span>
      ))}
    </div>
  );
}

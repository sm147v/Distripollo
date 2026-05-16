"use client";

type Props = {
  nombre: string;
  categoria?: string;
  imagen?: string;
  className?: string;
};

export function ProductImage({ nombre, categoria, imagen, className = "" }: Props) {
  if (imagen) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imagen} alt={nombre} className={className} loading="lazy" />;
  }

  const cat = (categoria || "").toLowerCase();
  const nom = nombre.toLowerCase();

  let bg = "from-[#FEF2F3] via-[#FFF4D1] to-[#FBE5E7]";
  let icon = "🐔";
  let pattern = "circles";

  if (cat.includes("campesin")) {
    bg = "from-[#FFFAEB] via-[#FFF4D1] to-[#FEF2F3]";
    icon = "🐓";
    pattern = "leaves";
  } else if (cat.includes("bucanero")) {
    bg = "from-[#EEF1F9] via-[#E3E8F5] to-[#FAF6EF]";
    icon = "❄️";
    pattern = "snow";
  } else if (cat.includes("don juan") || nom.includes("filete")) {
    bg = "from-[#FBE5E7] via-[#FFF4D1] to-[#FEF2F3]";
    icon = "🥩";
    pattern = "stripes";
  } else if (cat.includes("frías") || cat.includes("frias")) {
    bg = "from-[#FFFAEB] via-[#FEF2F3] to-[#FFF4D1]";
    icon = "🌭";
    pattern = "circles";
  } else if (cat.includes("pescado")) {
    bg = "from-[#E3E8F5] via-[#EEF1F9] to-white";
    icon = "🐟";
    pattern = "waves";
  } else if (cat.includes("lácteos") || cat.includes("lacteos")) {
    bg = "from-[#FFFAEB] via-white to-[#FFF4D1]";
    icon = "🧈";
    pattern = "dots";
  } else if (cat.includes("precocido")) {
    bg = "from-[#FFF4D1] via-[#FEF2F3] to-[#FFFAEB]";
    icon = "🍗";
    pattern = "stripes";
  }

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center overflow-hidden ${className}`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`p-${pattern}-${nombre.length}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {pattern === "circles" && <circle cx="20" cy="20" r="1.5" fill="#1D3FA8" />}
              {pattern === "dots" && <circle cx="20" cy="20" r="1" fill="#0F1E3F" />}
              {pattern === "stripes" && <line x1="0" y1="20" x2="40" y2="20" stroke="#E63946" strokeWidth="0.5" />}
              {pattern === "leaves" && <path d="M 20 10 Q 25 20 20 30 Q 15 20 20 10" fill="#1D3FA8" opacity="0.3" />}
              {pattern === "snow" && <circle cx="20" cy="20" r="1" fill="#1D3FA8" />}
              {pattern === "waves" && <path d="M 0 20 Q 10 15 20 20 T 40 20" stroke="#1D3FA8" strokeWidth="0.5" fill="none" />}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-${pattern}-${nombre.length})`} />
        </svg>
      </div>

      <div className="relative text-[5.5rem] md:text-[6.5rem] drop-shadow-lg anim-float">
        {icon}
      </div>

      {/* Brand stamp */}
      <div className="absolute bottom-3 right-3 text-[0.55rem] font-mono font-bold uppercase tracking-[0.15em] text-[#0F1E3F]/30">
        Distripollo · 94
      </div>
    </div>
  );
}

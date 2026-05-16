import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 600;

export default async function HomePage() {
  const destacados = await prisma.producto.findMany({
    where: { activo: true },
    take: 8,
    orderBy: { id: "asc" },
  });

  const categorias = await prisma.producto.groupBy({
    by: ["categoria"],
    where: { activo: true },
    _count: true,
  });

  return (
    <div className="overflow-hidden">
      {/* ════════════════════════════════════════════ */}
      {/* HERO EDITORIAL - El alma de la marca         */}
      {/* ════════════════════════════════════════════ */}
      <section className="relative bg-[#FFFBF5] noise-bg pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#E63946]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#FFC72C]/10 blur-3xl" />

        <div className="container-dp relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Texto */}
            <div className="anim-fade-up">
              <div className="inline-flex items-center gap-2 bg-white border border-[#E63946]/20 px-3 py-1.5 rounded-full mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] anim-pulse-ring" />
                <span className="text-[0.72rem] font-mono font-semibold uppercase tracking-[0.15em] text-[#0F1E3F]">
                  Distribuidor · Medellín · est. 1991
                </span>
              </div>

              <h1 className="font-serif text-[2.8rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[0.95] text-[#0F1E3F] mb-6">
                El mejor pollo
                <span className="block">
                  de la <span className="italic text-[#E63946] relative">
                    ciudad
                    <svg className="absolute -bottom-2 left-0 w-full" height="14" viewBox="0 0 300 14" fill="none">
                      <path d="M2 8 Q 75 1, 150 7 T 298 6" stroke="#FFC72C" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </span>
                </span>
                <span className="block font-medium text-[#0F1E3F]/60 italic text-[1.5rem] md:text-[2rem] lg:text-[2.3rem] mt-3 tracking-tight">
                  en tu mesa.
                </span>
              </h1>

              <p className="text-[1.05rem] md:text-[1.15rem] text-[#0F1E3F]/70 max-w-xl leading-relaxed mb-8">
                Pollo campesino fresco. Congelados <strong className="text-[#0F1E3F]">Bucanero</strong>. Filetes <strong className="text-[#0F1E3F]">Don Juan</strong>. Más de 30 años abasteciendo restaurantes, asaderos, tiendas y hogares en Medellín con la mejor calidad.
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                <Link
                  href="/productos"
                  className="group inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#C72D3B] text-white font-semibold px-7 py-4 rounded-full transition-all hover:shadow-2xl hover:shadow-red-200 hover:-translate-y-0.5"
                >
                  Ver catálogo completo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>

                <a
                  href="https://wa.me/573054223600?text=Hola%2C%20quiero%20hacer%20un%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white hover:bg-[#0F1E3F] hover:text-white text-[#0F1E3F] font-semibold px-7 py-4 rounded-full transition-all border border-[#0F1E3F]/15 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                  </svg>
                  Pedir por WhatsApp
                </a>
              </div>

              {/* Stats inline editorial */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#0F1E3F]/10 max-w-md">
                {[
                  { num: "30+", label: "Años de\nexperiencia" },
                  { num: "71", label: "Productos\ndisponibles" },
                  { num: "100%", label: "Calidad\ngarantizada" },
                ].map((s, i) => (
                  <div key={s.num} className={`anim-fade delay-${(i + 1) * 100}`}>
                    <div className="font-serif font-extrabold text-3xl md:text-4xl text-[#E63946] leading-none mb-1">
                      {s.num}
                    </div>
                    <div className="text-[0.7rem] text-[#0F1E3F]/60 font-medium uppercase tracking-wider whitespace-pre-line leading-tight">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual rich */}
            <div className="relative hidden lg:block anim-scale">
              <div className="relative aspect-square">
                {/* Círculo principal con gallo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E63946] via-[#C72D3B] to-[#5A1419] shadow-[0_30px_80px_-15px_rgba(230,57,70,0.4)]">
                  <div className="absolute inset-0 rounded-full noise-bg opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[18rem] drop-shadow-2xl anim-float-slow">🐔</span>
                  </div>
                </div>

                {/* Sticker amarillo flotante */}
                <div className="absolute top-6 -right-4 bg-[#FFC72C] rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform border-4 border-white">
                  <div className="font-serif font-extrabold text-3xl text-[#0F1E3F] leading-none">24h</div>
                  <div className="text-[0.65rem] font-bold text-[#0F1E3F] uppercase tracking-wider mt-1">Domicilio</div>
                </div>

                {/* Sticker blanco flotante */}
                <div className="absolute -bottom-2 -left-6 bg-white rounded-2xl px-5 py-4 shadow-2xl -rotate-6 hover:rotate-0 transition-transform border border-gray-100 max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E63946] flex items-center justify-center text-xl">🐔</div>
                    <div>
                      <div className="font-serif font-bold text-[#0F1E3F] leading-tight">¡Fresco hoy!</div>
                      <div className="text-[0.65rem] text-[#0F1E3F]/60 font-medium">Pollo del día</div>
                    </div>
                  </div>
                </div>

                {/* Sticker mayoristas */}
                <div className="absolute top-1/2 -left-10 -translate-y-1/2 bg-[#0F1E3F] text-white rounded-2xl px-4 py-3 shadow-2xl -rotate-3 hover:rotate-0 transition-transform">
                  <div className="text-[0.6rem] text-[#FFC72C] font-bold uppercase tracking-widest">Mayoristas</div>
                  <div className="font-serif font-bold text-base text-white">−15% off</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* MARQUEE de marcas/garantías                  */}
      {/* ════════════════════════════════════════════ */}
      <section className="bg-[#0F1E3F] text-white py-5 border-y border-white/5 overflow-hidden">
        <div className="flex w-max" style={{ animation: "marquee 45s linear infinite" }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center pr-12">
              {[
                "BUCANERO",
                "DON JUAN",
                "POLLO CAMPESINO",
                "CARNES FRÍAS",
                "PRECOCIDOS",
                "LÁCTEOS",
                "PESCADO",
              ].map((b, j) => (
                <span key={b + i} className="flex items-center mr-12 font-serif font-bold text-2xl md:text-3xl tracking-tight">
                  {b}
                  <span className="ml-12 text-[#FFC72C] text-xl">★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* CATEGORÍAS - Editorial Grid                  */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#FFFBF5]">
        <div className="container-dp">
          <div className="max-w-2xl mb-12">
            <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
              <span>Catálogo</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F1E3F] leading-[0.95] mb-4">
              Todo lo que tu<br/>
              <span className="italic text-[#E63946]">cocina necesita.</span>
            </h2>
            <p className="text-[#0F1E3F]/60 text-lg max-w-lg">
              Siete categorías cuidadosamente seleccionadas para abastecer tu negocio o tu hogar.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categorias.map((c, i) => {
              const cat = c.categoria || "";
              const lower = cat.toLowerCase();
              const config = lower.includes("campesin") ? { icon: "🐓", grad: "from-[#FFFAEB] to-[#FBE5E7]", num: "01" }
                : lower.includes("bucanero") ? { icon: "❄️", grad: "from-[#EEF1F9] to-white", num: "02" }
                : lower.includes("don juan") ? { icon: "🥩", grad: "from-[#FBE5E7] to-[#FFFAEB]", num: "03" }
                : lower.includes("frías") || lower.includes("frias") ? { icon: "🌭", grad: "from-[#FFFAEB] to-[#EEF1F9]", num: "04" }
                : lower.includes("pescado") ? { icon: "🐟", grad: "from-[#EEF1F9] to-[#FAF6EF]", num: "05" }
                : lower.includes("lácteos") || lower.includes("lacteos") ? { icon: "🧈", grad: "from-[#FFFAEB] to-white", num: "06" }
                : { icon: "🍗", grad: "from-[#FBE5E7] to-[#FFFAEB]", num: "07" };

              return (
                <Link
                  key={cat}
                  href={`/productos?cat=${encodeURIComponent(cat)}`}
                  className={`group relative bg-gradient-to-br ${config.grad} rounded-3xl p-6 overflow-hidden border border-[#E8E8E4] hover:border-[#E63946]/30 hover:shadow-2xl hover:shadow-red-100/50 hover:-translate-y-1 transition-all duration-500`}
                >
                  <div className="absolute top-3 right-3 font-mono text-[0.65rem] font-bold text-[#0F1E3F]/30 tracking-wider">
                    {config.num}
                  </div>

                  <div className="text-5xl md:text-6xl mb-4 anim-float-slow">{config.icon}</div>

                  <div className="font-serif font-bold text-[1.05rem] text-[#0F1E3F] leading-tight mb-1 group-hover:text-[#E63946] transition-colors">
                    {cat}
                  </div>
                  <div className="font-mono text-[0.7rem] text-[#0F1E3F]/50 font-semibold">
                    {c._count} productos
                  </div>

                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* PRODUCTOS DESTACADOS                          */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container-dp">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div className="max-w-xl">
              <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
                <span>Los más pedidos</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F1E3F] leading-[0.95]">
                Selección<br/>
                <span className="italic text-[#E63946]">de la semana.</span>
              </h2>
            </div>
            <Link
              href="/productos"
              className="group inline-flex items-center gap-2 text-[#E63946] font-semibold hover:gap-3 transition-all"
            >
              Ver todos
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {destacados.map((p, i) => (
              <div key={p.id} className={`anim-fade-up delay-${Math.min((i + 1) * 100, 500)}`}>
                <ProductCard
                  producto={{
                    id: p.id,
                    nombre: p.nombre,
                    precio: Number(p.precio),
                    unidad: p.unidad,
                    categoria: p.categoria || undefined,
                    imagen: p.imagen || undefined,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* VALORES / VENTAJAS                            */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#FFFBF5] noise-bg">
        <div className="container-dp">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="divider-fancy mb-6 justify-center" style={{ width: "fit-content", margin: "0 auto 1.5rem" }}>
              <span>¿Por qué Distripollo?</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F1E3F] leading-[0.95]">
              Calidad que se<br/>
              <span className="italic text-[#E63946]">siente</span> al cocinar.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", icon: "🐔", titulo: "Fresco diario", desc: "Pollo seleccionado cada día con los más altos estándares de calidad." },
              { num: "02", icon: "🚚", titulo: "Entrega rápida", desc: "Domicilios en Medellín y municipios cercanos en menos de 24 horas." },
              { num: "03", icon: "💰", titulo: "Precios justos", desc: "Tarifas al detal y mayorista. Solicita acceso con CC o NIT." },
              { num: "04", icon: "🤝", titulo: "Atención humana", desc: "WhatsApp directo con asesores reales que te conocen por nombre." },
            ].map((v, i) => (
              <div
                key={v.num}
                className={`group bg-white rounded-3xl p-7 border border-[#E8E8E4] hover:border-[#E63946]/30 hover:shadow-2xl hover:shadow-red-100/30 hover:-translate-y-1 transition-all duration-500 anim-fade-up delay-${(i + 1) * 100}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FEF2F3] to-[#FFFAEB] flex items-center justify-center text-3xl">
                    {v.icon}
                  </div>
                  <span className="font-mono text-[0.7rem] font-bold text-[#0F1E3F]/30 tracking-widest mt-2">
                    {v.num}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-[1.3rem] text-[#0F1E3F] mb-2 group-hover:text-[#E63946] transition-colors">
                  {v.titulo}
                </h3>
                <p className="text-[#0F1E3F]/60 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* CTA MAYORISTAS - Cinematográfico              */}
      {/* ════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 bg-[#0F1E3F] text-white overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 noise-bg opacity-50" />
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-[#E63946]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-[#FFC72C]/15 blur-3xl" />

        <div className="container-dp relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFC72C] text-[#0F1E3F] px-4 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.15em] mb-6">
                <span>🏢</span> Para tu negocio
              </div>

              <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl text-white leading-[0.95] mb-6">
                ¿Tienes un<br/>
                <span className="italic text-[#FFC72C]">restaurante</span> o<br/>
                <span className="italic text-[#E63946]">asadero</span>?
              </h2>

              <p className="text-lg opacity-80 mb-8 max-w-xl leading-relaxed">
                Accede a <strong className="text-white">precios mayoristas</strong> con tu CC o NIT. Hasta un 15% de descuento en todos nuestros productos. Atención dedicada y entregas programadas.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/573054223600?text=Hola%2C%20quiero%20registrarme%20como%20mayorista"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 bg-[#FFC72C] hover:bg-white text-[#0F1E3F] font-semibold px-7 py-4 rounded-full transition-all hover:scale-105 shadow-2xl"
                >
                  Solicitar acceso
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform group-hover:translate-x-1">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-[#FFC72C] hover:text-[#FFC72C] text-white font-semibold px-7 py-4 rounded-full transition-all"
                >
                  Ver precios
                </Link>
              </div>
            </div>

            {/* Visual stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "−15%", label: "En todos los productos", color: "from-[#E63946] to-[#A82531]" },
                { num: "24h", label: "Entrega programada", color: "from-[#FFC72C] to-[#E0A912]", dark: true },
                { num: "100+", label: "Restaurantes nos confían", color: "from-[#1D3FA8] to-[#15307D]" },
                { num: "30+", label: "Años de experiencia", color: "from-[#0F1E3F] to-[#06102A]" },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`relative bg-gradient-to-br ${s.color} rounded-3xl p-6 overflow-hidden`}
                >
                  <div className="absolute inset-0 noise-bg opacity-30" />
                  <div className={`font-serif font-extrabold text-4xl md:text-5xl ${s.dark ? "text-[#0F1E3F]" : "text-white"} mb-1 leading-none`}>
                    {s.num}
                  </div>
                  <div className={`text-xs ${s.dark ? "text-[#0F1E3F]/70" : "text-white/80"} font-medium`}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* TESTIMONIAL Final                             */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#FFFBF5]">
        <div className="container-dp">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl md:text-8xl mb-6 opacity-20 font-serif leading-none">"</div>
            <p className="font-serif italic text-2xl md:text-4xl lg:text-5xl text-[#0F1E3F] leading-tight mb-8">
              La calidad del pollo de Distripollo es lo que mantiene a nuestros clientes volviendo. <span className="text-[#E63946]">Es nuestro proveedor de confianza hace 12 años.</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E63946] to-[#A82531] flex items-center justify-center text-2xl">
                🧑‍🍳
              </div>
              <div className="text-left">
                <div className="font-serif font-bold text-[#0F1E3F]">Carlos Mejía</div>
                <div className="text-sm text-[#0F1E3F]/60">Asadero La Tradición · Medellín</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

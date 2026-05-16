export const metadata = {
  title: "Sobre nosotros · Distripollo La 94",
};

export default function NosotrosPage() {
  return (
    <div className="bg-[#FFFBF5]">
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container-dp max-w-4xl text-center">
          <div className="divider-fancy mb-6 justify-center" style={{ width: "fit-content", margin: "0 auto 1.5rem" }}>
            <span>Nuestra historia</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-[#0F1E3F] leading-[0.95] mb-6">
            Más de <span className="italic text-[#E63946]">30 años</span><br/>
            llevando calidad a tu mesa.
          </h1>
          <p className="text-xl text-[#0F1E3F]/60 max-w-2xl mx-auto leading-relaxed">
            Distripollo La 94 nació en Medellín con un propósito simple: distribuir el mejor pollo de Antioquia.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container-dp max-w-3xl">
          <div className="space-y-12">
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="font-mono text-6xl md:text-7xl font-extrabold text-[#E63946]/20 leading-none">01</div>
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-[#0F1E3F] mb-3">Una historia familiar</h2>
                <p className="text-[#0F1E3F]/70 leading-relaxed text-lg">
                  Lo que empezó como un pequeño negocio familiar hoy es uno de los distribuidores de pollo más reconocidos de Medellín. Hemos crecido junto a los restaurantes, asaderos y hogares que nos confían su mesa cada día.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="font-mono text-6xl md:text-7xl font-extrabold text-[#E63946]/20 leading-none">02</div>
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-[#0F1E3F] mb-3">Calidad sin compromiso</h2>
                <p className="text-[#0F1E3F]/70 leading-relaxed text-lg">
                  Trabajamos solo con las mejores marcas: <strong className="text-[#0F1E3F]">Bucanero</strong> para congelados, <strong className="text-[#0F1E3F]">Don Juan</strong> para filetes premium, y nuestros propios productos campesinos seleccionados a mano.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="font-mono text-6xl md:text-7xl font-extrabold text-[#E63946]/20 leading-none">03</div>
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-[#0F1E3F] mb-3">Atención cercana</h2>
                <p className="text-[#0F1E3F]/70 leading-relaxed text-lg">
                  Cada pedido lo atendemos personalmente. Conocemos a nuestros clientes por nombre, sabemos qué necesita cada restaurante y entregamos puntualmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-[#0F1E3F] text-white">
        <div className="container-dp">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "30+", label: "Años" },
              { num: "100+", label: "Restaurantes" },
              { num: "71", label: "Productos" },
              { num: "24h", label: "Domicilio" },
            ].map(s => (
              <div key={s.num}>
                <div className="font-serif font-extrabold text-5xl md:text-7xl text-[#FFC72C] leading-none mb-2">
                  {s.num}
                </div>
                <div className="text-sm text-white/70 font-medium uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión/Visión */}
      <section className="py-20 md:py-28">
        <div className="container-dp max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#E63946] to-[#A82531] text-white rounded-[2rem] p-10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="text-5xl mb-6">🎯</div>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Misión</h3>
                <p className="opacity-95 leading-relaxed text-lg">
                  Brindar productos de calidad superior con un servicio cercano y confiable. Trabajamos para que cada cliente tenga acceso al mejor pollo de Medellín.
                </p>
              </div>
            </div>

            <div className="bg-[#0F1E3F] text-white rounded-[2rem] p-10 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#FFC72C]/20 blur-2xl" />
              <div className="relative">
                <div className="text-5xl mb-6">⭐</div>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Visión</h3>
                <p className="opacity-95 leading-relaxed text-lg">
                  Ser el distribuidor de pollo líder en Antioquia, reconocido por la calidad, el servicio y el compromiso con cada cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata = { title: "Contacto · Distripollo La 94" };

export default function ContactoPage() {
  return (
    <div className="py-16 bg-[#FFFBF5] min-h-screen">
      <div className="container-dp max-w-4xl">
        <div className="text-center mb-12">
          <div className="divider-fancy mb-6 justify-center" style={{ width: "fit-content", margin: "0 auto 1.5rem" }}>
            <span>Contáctanos</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-[#0F1E3F] leading-[0.95] mb-4">
            Hablemos del<br/>
            <span className="italic text-[#E63946]">próximo pedido.</span>
          </h1>
          <p className="text-lg text-[#0F1E3F]/60">
            Estamos a un mensaje de distancia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <a
            href="https://wa.me/573054223600"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-3xl border border-[#E8E8E4] p-8 hover:border-[#25D366]/40 hover:shadow-2xl hover:shadow-green-100/30 transition-all hover:-translate-y-1"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center text-2xl shrink-0">💬</div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#25D366] mb-1">Recomendado</div>
                <h3 className="font-serif text-2xl text-[#0F1E3F] mb-1">WhatsApp</h3>
                <p className="font-mono text-sm text-[#0F1E3F]/70 mb-2">+57 305 422 3600</p>
                <p className="text-sm text-[#0F1E3F]/60">Atención inmediata · Lun-Sáb</p>
              </div>
            </div>
          </a>

          <a
            href="https://instagram.com/distripollo94"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-3xl border border-[#E8E8E4] p-8 hover:border-[#E63946]/40 hover:shadow-2xl hover:shadow-red-100/30 transition-all hover:-translate-y-1"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E63946] via-[#FFC72C] to-[#1D3FA8] flex items-center justify-center text-2xl shrink-0">📷</div>
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#E63946] mb-1">Síguenos</div>
                <h3 className="font-serif text-2xl text-[#0F1E3F] mb-1">Instagram</h3>
                <p className="font-mono text-sm text-[#0F1E3F]/70 mb-2">@distripollo94</p>
                <p className="text-sm text-[#0F1E3F]/60">Promociones · Recetas · Detrás de escena</p>
              </div>
            </div>
          </a>
        </div>

        <div className="bg-[#0F1E3F] text-white rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-[#FFC72C]/10 blur-3xl" />
          <div className="relative">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="font-serif text-3xl md:text-4xl text-white mb-3">
              Medellín, <span className="italic text-[#FFC72C]">Colombia</span>
            </h3>
            <p className="opacity-80 mb-6">Atendemos toda el área metropolitana del Valle de Aburrá</p>
            <div className="font-mono text-sm text-[#FFC72C]">
              Distripollo La 94 S.A.S. · NIT 901213966-2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

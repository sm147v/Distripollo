import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-[#0F1E3F] text-white overflow-hidden mt-24">
      {/* Background decorative */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#E63946] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#FFC72C] blur-3xl" />
      </div>

      <div className="relative container-dp pt-20 pb-8">
        {/* CTA banner top */}
        <div className="border border-white/10 rounded-3xl p-8 md:p-12 mb-16 bg-white/[0.02] backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-[#FFC72C] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                ¿Listo para pedir?
              </div>
              <h3 className="font-serif font-bold text-3xl md:text-4xl text-white leading-tight">
                Llevamos calidad <span className="italic text-[#FFC72C]">directo a tu negocio</span>
              </h3>
            </div>
            <a
              href="https://wa.me/573054223600"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#C72D3B] text-white font-semibold px-7 py-4 rounded-full transition-all hover:scale-105 shadow-2xl shadow-red-900/20 whitespace-nowrap"
            >
              💬 Escribir por WhatsApp
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E63946] to-[#A82531] flex items-center justify-center shadow-xl">
                <span className="text-2xl">🐔</span>
              </div>
              <div className="leading-[1.05]">
                <div className="font-serif italic font-medium text-base text-white/80">Distripollo</div>
                <div className="font-serif font-extrabold text-2xl text-[#FFC72C]">La 94 S.A.S.</div>
              </div>
            </div>
            <p className="text-sm opacity-70 leading-relaxed mb-6 max-w-xs">
              Distribuidor especializado en pollo crudo y congelados de calidad superior. Atendemos restaurantes, asaderos, tiendas y hogares en Medellín.
            </p>
            <div className="flex gap-2">
              <a href="https://wa.me/573054223600" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#25D366] flex items-center justify-center transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                </svg>
              </a>
              <a href="https://instagram.com/distripollo94" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-[#E63946] hover:to-[#FFC72C] flex items-center justify-center transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Productos */}
          <div className="lg:col-span-3">
            <h4 className="text-[#FFC72C] font-sans font-bold text-[0.7rem] uppercase tracking-[0.2em] mb-5">
              Catálogo
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/productos?cat=Campesinos" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">→ Pollo Campesino</Link></li>
              <li><Link href="/productos?cat=Congelados%20Bucanero" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">→ Congelados Bucanero</Link></li>
              <li><Link href="/productos?cat=Filetes%20Don%20Juan" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">→ Filetes Don Juan</Link></li>
              <li><Link href="/productos?cat=Carnes%20Fr%C3%ADas" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">→ Carnes Frías</Link></li>
              <li><Link href="/productos?cat=Precocidos" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">→ Precocidos</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="lg:col-span-2">
            <h4 className="text-[#FFC72C] font-sans font-bold text-[0.7rem] uppercase tracking-[0.2em] mb-5">
              Empresa
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/sobre-nosotros" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">Nosotros</Link></li>
              <li><Link href="/contacto" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">Contacto</Link></li>
              <li><Link href="/carrito" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">Mi carrito</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="lg:col-span-3">
            <h4 className="text-[#FFC72C] font-sans font-bold text-[0.7rem] uppercase tracking-[0.2em] mb-5">
              Contáctanos
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="opacity-70 leading-relaxed">
                Medellín, Antioquia<br/>
                Colombia
              </li>
              <li>
                <a href="tel:+573054223600" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition font-mono">
                  +57 305 422 3600
                </a>
              </li>
              <li>
                <a href="mailto:info@distripollo94.com" className="opacity-70 hover:opacity-100 hover:text-[#FFC72C] transition">
                  info@distripollo94.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <div>
            © {new Date().getFullYear()} Distripollo La 94 S.A.S. · NIT 901213966-2
          </div>
          <div className="font-mono">
            Hecho con 🐔 en Medellín, Colombia
          </div>
        </div>
      </div>
    </footer>
  );
}

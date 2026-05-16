"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "./CartContext";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useCart();
  const pathname = usePathname() || "";
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (p: string) => p === "/" ? pathname === "/" : pathname.startsWith(p);

  return (
    <>
      {/* Top bar — Profesional con números */}
      <div className="bg-[#0F1E3F] text-white text-[0.78rem] overflow-hidden border-b border-white/5">
        <div className="container-dp py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 overflow-hidden">
            <span className="flex items-center gap-1.5 opacity-90">
              <span className="text-[#FFC72C]">●</span> Abierto · Lun a Sáb 6am — 4pm
            </span>
            <span className="hidden md:flex items-center gap-1.5 opacity-90">
              <span className="text-[#FFC72C]">📞</span> +57 305 422 3600
            </span>
          </div>
          <a href="https://wa.me/573054223600" target="_blank" rel="noopener noreferrer" className="font-mono font-bold text-[#FFC72C] hover:text-white transition flex items-center gap-1">
            Pide ya →
          </a>
        </div>
      </div>

      {/* Header principal */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-[#FFFBF5]"
      }`}>
        <div className="container-dp">
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E63946] to-[#A82531] flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
                  <span className="text-2xl">🐔</span>
                </div>
                <div className="absolute -inset-1 rounded-full bg-[#E63946]/20 -z-10 group-hover:bg-[#E63946]/30 transition" />
              </div>
              <div className="leading-[1.05]">
                <div className="font-serif italic font-medium text-[0.95rem] text-[#1D3FA8] tracking-tight">
                  Distripollo
                </div>
                <div className="font-serif font-extrabold text-[1.35rem] text-[#E63946] tracking-tight">
                  La 94<span className="text-[0.5rem] align-top ml-0.5 text-[#0F1E3F]/40 font-normal">S.A.S</span>
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                ["/", "Inicio"],
                ["/productos", "Catálogo"],
                ["/sobre-nosotros", "Nosotros"],
                ["/contacto", "Contacto"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 text-[0.92rem] font-medium transition-colors rounded-full ${
                    isActive(href)
                      ? "text-[#E63946] bg-[#FEF2F3]"
                      : "text-[#0F1E3F]/80 hover:text-[#E63946] hover:bg-[#FEF2F3]/50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/573054223600"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1FAE52] text-white rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-green-200 hover:scale-[1.02]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                </svg>
                WhatsApp
              </a>

              <Link
                href="/carrito"
                className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F1E3F] hover:bg-[#06102A] text-white rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span className="hidden md:inline">Carrito</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FFC72C] text-[#0F1E3F] rounded-full min-w-[1.4rem] h-[1.4rem] px-1.5 flex items-center justify-center text-[0.7rem] font-extrabold font-mono border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </Link>

              <button
                className="lg:hidden p-2 text-[#0F1E3F] hover:bg-[#FEF2F3] rounded-full transition"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                {menuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
            {[
              ["/", "Inicio"],
              ["/productos", "Catálogo"],
              ["/sobre-nosotros", "Nosotros"],
              ["/contacto", "Contacto"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3.5 rounded-xl font-medium transition ${
                  isActive(href)
                    ? "bg-[#FEF2F3] text-[#E63946]"
                    : "text-[#0F1E3F] hover:bg-[#FAFAF9]"
                }`}
              >
                {label}
              </Link>
            ))}
            <a
              href="https://wa.me/573054223600"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3.5 bg-[#25D366] text-white rounded-xl font-semibold text-center mt-3"
            >
              💬 Pedir por WhatsApp
            </a>
          </div>
        )}
      </header>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { fmt } from "@/lib/format";

type Producto = {
  id: number; nombre: string; descripcion?: string;
  precio: number; precioMayor?: number; unidad: string;
  categoria?: string; imagen?: string;
};

export function ProductDetail({ producto, relacionados }: { producto: Producto; relacionados: any[] }) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const { addItem } = useCart();

  function handleAdd() {
    addItem(producto, cantidad);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2500);
  }

  return (
    <div className="py-10 md:py-14 bg-[#FFFBF5] min-h-screen">
      <div className="container-dp">
        <nav className="text-xs text-[#0F1E3F]/50 mb-8 font-medium">
          <Link href="/" className="hover:text-[#E63946]">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/productos" className="hover:text-[#E63946]">Productos</Link>
          {producto.categoria && <>
            <span className="mx-2">/</span>
            <Link href={`/productos?cat=${encodeURIComponent(producto.categoria)}`} className="hover:text-[#E63946]">{producto.categoria}</Link>
          </>}
          <span className="mx-2">/</span>
          <span className="text-[#0F1E3F] font-semibold">{producto.nombre}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-[#E8E8E4] shadow-xl">
            <ProductImage
              nombre={producto.nombre}
              categoria={producto.categoria}
              imagen={producto.imagen}
              className="w-full h-full"
            />
          </div>

          <div>
            {producto.categoria && (
              <div className="inline-block bg-[#0F1E3F] text-[#FFC72C] px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-[0.15em] mb-5">
                {producto.categoria}
              </div>
            )}

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F1E3F] leading-[0.95] mb-6">
              {producto.nombre}
            </h1>

            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-[#E8E8E4]">
              <span className="font-serif font-extrabold text-5xl md:text-6xl text-[#E63946] leading-none">
                {fmt(producto.precio)}
              </span>
              <span className="text-sm text-[#0F1E3F]/50 font-mono font-semibold uppercase">
                /{producto.unidad}
              </span>
            </div>

            {producto.precioMayor && (
              <div className="bg-[#0F1E3F] text-white p-5 rounded-2xl mb-6 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-[#FFC72C]/20 blur-2xl" />
                <div className="relative flex items-start gap-4">
                  <div className="text-3xl">🏢</div>
                  <div className="flex-1">
                    <div className="text-[#FFC72C] text-[0.65rem] font-bold uppercase tracking-[0.15em] mb-1">
                      Precio mayorista
                    </div>
                    <div className="font-serif font-extrabold text-3xl mb-1">
                      {fmt(producto.precioMayor)}
                      <span className="text-sm font-mono font-medium opacity-70 ml-1">/{producto.unidad}</span>
                    </div>
                    <a
                      href="https://wa.me/573054223600?text=Hola%2C%20quiero%20registrarme%20como%20mayorista"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#FFC72C] text-sm font-semibold hover:gap-2 transition-all"
                    >
                      Solicitar acceso mayorista
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {producto.descripcion && (
              <p className="text-[#0F1E3F]/70 leading-relaxed mb-6">
                {producto.descripcion}
              </p>
            )}

            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center bg-white border-2 border-[#E8E8E4] rounded-full p-1">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-11 h-11 rounded-full hover:bg-gray-100 font-extrabold text-xl flex items-center justify-center">−</button>
                <span className="min-w-[3rem] text-center font-extrabold text-lg font-mono">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)} className="w-11 h-11 rounded-full hover:bg-gray-100 font-extrabold text-xl flex items-center justify-center">+</button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 min-w-[200px] font-semibold text-white py-4 rounded-full transition-all shadow-lg ${
                  agregado
                    ? "bg-[#25D366]"
                    : "bg-[#E63946] hover:bg-[#C72D3B] hover:scale-[1.02] hover:shadow-red-200"
                }`}
              >
                {agregado ? "✓ Agregado al carrito" : `Agregar al carrito · ${fmt(producto.precio * cantidad)}`}
              </button>
            </div>

            <a
              href={`https://wa.me/573054223600?text=Hola%2C%20me%20interesa%20${encodeURIComponent(producto.nombre)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white hover:bg-[#0F1E3F] hover:text-white text-[#0F1E3F] text-center font-semibold py-4 rounded-full transition-all border border-[#0F1E3F]/15"
            >
              💬 Consultar por WhatsApp
            </a>

            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { icon: "🐔", t: "Fresco", d: "Calidad garantizada" },
                { icon: "🚚", t: "Domicilio", d: "En Medellín" },
                { icon: "✓", t: "100%", d: "Original" },
              ].map(g => (
                <div key={g.t} className="bg-white border border-[#E8E8E4] rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{g.icon}</div>
                  <div className="font-serif font-bold text-sm text-[#0F1E3F]">{g.t}</div>
                  <div className="text-[0.65rem] text-[#0F1E3F]/50 font-medium">{g.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {relacionados.length > 0 && (
          <div>
            <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
              <span>También te puede interesar</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#0F1E3F] mb-8">
              Más de <span className="italic text-[#E63946]">{producto.categoria}</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relacionados.map(r => <ProductCard key={r.id} producto={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

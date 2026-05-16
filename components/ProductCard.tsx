"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { fmt } from "@/lib/format";
import { ProductImage } from "./ProductImage";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  unidad: string;
  categoria?: string;
  imagen?: string;
};

export function ProductCard({ producto }: { producto: Producto }) {
  const { addItem, items, updateCantidad } = useCart();
  const enCarrito = items.find(i => i.id === producto.id);
  const cantidad = enCarrito?.cantidad ?? 0;

  return (
    <article className="group relative bg-white rounded-3xl border border-[#E8E8E4] overflow-hidden transition-all duration-500 hover:border-[#E63946]/30 hover:shadow-2xl hover:shadow-red-100/40 hover:-translate-y-1 flex flex-col">
      {/* Imagen + badge */}
      <Link href={`/productos/${producto.id}`} className="block relative">
        <div className="aspect-[5/4] overflow-hidden">
          <ProductImage
            nombre={producto.nombre}
            categoria={producto.categoria}
            imagen={producto.imagen}
            className="w-full h-full group-hover:scale-110 transition-transform duration-700"
          />
        </div>

        {producto.categoria && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F1E3F] text-[0.62rem] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full shadow-sm border border-white">
            {producto.categoria}
          </div>
        )}

        {/* Quick view on hover */}
        <div className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F1E3F" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow gap-3">
        <Link href={`/productos/${producto.id}`} className="block">
          <h3 className="font-serif font-semibold text-[#0F1E3F] text-[1.05rem] leading-[1.2] line-clamp-2 min-h-[2.5rem] group-hover:text-[#E63946] transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-serif font-extrabold text-[1.7rem] text-[#E63946] leading-none">
            {fmt(producto.precio)}
          </span>
          <span className="text-[0.72rem] text-[#6B6B66] font-mono font-semibold uppercase">
            /{producto.unidad}
          </span>
        </div>

        <div className="mt-auto pt-1">
          {cantidad === 0 ? (
            <button
              onClick={() => addItem(producto)}
              className="w-full bg-[#0F1E3F] hover:bg-[#E63946] text-white font-semibold text-[0.85rem] py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-200 flex items-center justify-center gap-2 group/btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform group-hover/btn:rotate-90">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar
            </button>
          ) : (
            <div className="flex items-center justify-between bg-[#E63946] rounded-full p-1 shadow-md shadow-red-200">
              <button
                onClick={() => updateCantidad(producto.id, cantidad - 1)}
                className="w-10 h-10 rounded-full bg-white text-[#E63946] font-extrabold text-xl flex items-center justify-center hover:scale-110 transition"
                aria-label="Quitar"
              >
                −
              </button>
              <span className="text-white font-extrabold text-base font-mono">{cantidad}</span>
              <button
                onClick={() => updateCantidad(producto.id, cantidad + 1)}
                className="w-10 h-10 rounded-full bg-white text-[#E63946] font-extrabold text-xl flex items-center justify-center hover:scale-110 transition"
                aria-label="Agregar más"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

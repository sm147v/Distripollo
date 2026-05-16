"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { ProductImage } from "@/components/ProductImage";
import { fmt } from "@/lib/format";

export default function CarritoPage() {
  const { items, updateCantidad, removeItem, total, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-dp py-24 text-center min-h-[60vh]">
        <div className="text-7xl mb-6 opacity-50">🛒</div>
        <h1 className="font-serif text-4xl md:text-5xl mb-3 text-[#0F1E3F]">Tu carrito está vacío</h1>
        <p className="text-[#0F1E3F]/60 mb-8">Agrega productos para empezar tu pedido</p>
        <Link href="/productos" className="inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#C72D3B] text-white font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
          Explorar productos →
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-14 bg-[#FFFBF5] min-h-screen">
      <div className="container-dp">
        <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
          <span>Tu pedido</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-[#0F1E3F] mb-10">
          Mi <span className="italic text-[#E63946]">carrito</span>
        </h1>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-3xl border border-[#E8E8E4] p-4 flex gap-4 hover:shadow-md transition">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex-shrink-0">
                  <ProductImage nombre={item.nombre} categoria={item.categoria} imagen={item.imagen} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/productos/${item.id}`} className="font-serif font-bold text-[#0F1E3F] hover:text-[#E63946] line-clamp-2 leading-tight">
                    {item.nombre}
                  </Link>
                  <div className="text-sm text-[#0F1E3F]/50 font-mono mt-1">{fmt(item.precio)}/{item.unidad}</div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center bg-[#FAFAF9] rounded-full p-1">
                      <button onClick={() => updateCantidad(item.id, item.cantidad - 1)} className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 font-extrabold flex items-center justify-center">−</button>
                      <span className="min-w-[2rem] text-center font-bold text-sm font-mono">{item.cantidad}</span>
                      <button onClick={() => updateCantidad(item.id, item.cantidad + 1)} className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 font-extrabold flex items-center justify-center">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-[#E63946] text-xs font-semibold hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <div className="font-serif font-extrabold text-xl md:text-2xl text-[#E63946]">
                    {fmt(item.precio * item.cantidad)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-white rounded-3xl border border-[#E8E8E4] p-6 sticky top-24 shadow-sm">
              <h3 className="font-serif font-bold text-2xl text-[#0F1E3F] mb-5">Resumen</h3>
              <div className="space-y-2 mb-4">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-[#0F1E3F]/70 line-clamp-1 flex-1 pr-2">{i.cantidad}× {i.nombre}</span>
                    <span className="font-mono font-semibold text-[#0F1E3F]">{fmt(i.precio * i.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8E8E4] my-4 pt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-serif font-bold text-2xl text-[#0F1E3F]">Total</span>
                  <span className="font-serif font-extrabold text-3xl text-[#E63946]">{fmt(total)}</span>
                </div>
                <p className="text-xs text-[#0F1E3F]/50">Domicilio se coordina por WhatsApp</p>
              </div>
              <Link href="/checkout" className="block bg-[#E63946] hover:bg-[#C72D3B] text-white font-semibold text-center py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg mb-3">
                Continuar al pago
              </Link>
              <button onClick={() => clear()} className="w-full text-[#0F1E3F]/50 text-sm hover:text-[#E63946] py-2">
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

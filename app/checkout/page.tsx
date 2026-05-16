"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { fmt } from "@/lib/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState({
    nombre: "", telefono: "", email: "",
    direccion: "", barrio: "", fechaEntrega: "", notas: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { alert("Tu carrito está vacío"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: datos,
          items: items.map(i => ({
            productoId: i.id, cantidad: i.cantidad, unidad: i.unidad,
            precioUnit: i.precio, subtotal: i.precio * i.cantidad,
          })),
          total,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        clear();
        router.push(`/checkout/exito?numero=${data.numero}`);
      } else { alert("Error al guardar"); }
    } catch { alert("Error de conexión"); }
    setLoading(false);
  }

  if (items.length === 0) {
    return (
      <div className="container-dp py-20 text-center">
        <p className="text-[#0F1E3F]/60 mb-4">Tu carrito está vacío</p>
        <Link href="/productos" className="bg-[#E63946] text-white font-semibold px-6 py-3 rounded-full">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-14 bg-[#FFFBF5] min-h-screen">
      <div className="container-dp">
        <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
          <span>Finalizar pedido</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-[#0F1E3F] mb-10">
          Tu <span className="italic text-[#E63946]">información</span>
        </h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <div className="bg-white rounded-3xl border border-[#E8E8E4] p-6 md:p-8 shadow-sm">
            <h3 className="font-serif font-bold text-2xl text-[#0F1E3F] mb-6">Datos de contacto</h3>
            <div className="grid gap-5">
              <Input label="Nombre completo *" v={datos.nombre} on={v => setDatos({ ...datos, nombre: v })} req />
              <div className="grid md:grid-cols-2 gap-5">
                <Input label="Teléfono / WhatsApp *" v={datos.telefono} on={v => setDatos({ ...datos, telefono: v })} req type="tel" />
                <Input label="Email" v={datos.email} on={v => setDatos({ ...datos, email: v })} type="email" />
              </div>
              <Input label="Dirección completa *" v={datos.direccion} on={v => setDatos({ ...datos, direccion: v })} req />
              <div className="grid md:grid-cols-2 gap-5">
                <Input label="Barrio" v={datos.barrio} on={v => setDatos({ ...datos, barrio: v })} />
                <Input label="Fecha de entrega" v={datos.fechaEntrega} on={v => setDatos({ ...datos, fechaEntrega: v })} ph="Ej: Mañana en la mañana" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2 text-[#0F1E3F]">Notas adicionales</label>
                <textarea
                  value={datos.notas}
                  onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E4] focus:border-[#E63946] focus:outline-none focus:ring-4 focus:ring-[#E63946]/10"
                  placeholder="Indicaciones especiales, alergias, preferencias..."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[#0F1E3F] text-white rounded-3xl p-6 md:p-8 sticky top-24 shadow-xl">
              <h3 className="font-serif font-bold text-2xl mb-5 text-[#FFC72C]">Tu pedido</h3>
              <div className="space-y-2 mb-5 max-h-60 overflow-y-auto pr-2">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-sm gap-2">
                    <span className="opacity-80 line-clamp-1 flex-1">{i.cantidad}× {i.nombre}</span>
                    <strong className="font-mono whitespace-nowrap">{fmt(i.precio * i.cantidad)}</strong>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-5">
                <div className="flex justify-between items-baseline mb-5">
                  <span className="font-serif font-bold text-2xl">Total</span>
                  <span className="font-serif font-extrabold text-4xl text-[#FFC72C]">{fmt(total)}</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E63946] hover:bg-[#C72D3B] disabled:opacity-50 text-white font-semibold py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg"
                >
                  {loading ? "Procesando..." : "Confirmar pedido →"}
                </button>
                <p className="text-[0.7rem] text-white/60 text-center mt-3">
                  Te contactaremos por WhatsApp para coordinar entrega y pago.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, v, on, req, type = "text", ph }: any) {
  return (
    <div>
      <label className="block font-semibold text-sm mb-2 text-[#0F1E3F]">{label}</label>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        required={req}
        placeholder={ph}
        className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E4] focus:border-[#E63946] focus:outline-none focus:ring-4 focus:ring-[#E63946]/10"
      />
    </div>
  );
}

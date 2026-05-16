import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtMoney, fmtFecha, fmtNum, badgeEstado } from "@/lib/format";
import EstadoSelector from "./EstadoSelector";

export default async function PedidoDetalle({ params }) {
  const { id } = await params;
  const sesion = await getSession();

  const pedido = await prisma.pedido.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: { include: { mayorista: true } },
      items: { include: { producto: true } },
    },
  });

  if (!pedido || pedido.empresaId !== sesion.empresaId) {
    notFound();
  }

  const badge = badgeEstado(pedido.estado);
  const cantItems = pedido.items.length;
  const cantUnidades = pedido.items.reduce((s, i) => s + Number(i.cantidad), 0);

  // WhatsApp link (con texto pre-armado)
  const waNum = pedido.cliente?.whatsapp?.replace(/\D/g, "") || "";
  const mensajeWA = encodeURIComponent(
    `Hola ${pedido.cliente?.nombre || ""}, te escribo de Distripollo La 94 sobre tu pedido ${pedido.numero}.`
  );
  const waUrl = waNum ? `https://wa.me/${waNum}?text=${mensajeWA}` : null;

  return (
    <div className="px-10 py-10 max-w-6xl">
      {/* Breadcrumb / back */}
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 hover:text-[#1D3FA8] mb-6"
      >
        ← Pedidos
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <div className="font-mono text-sm text-stone-400 mb-2">
            Pedido {pedido.numero}
          </div>
          <h1 className="font-serif text-4xl text-[#1D3FA8] leading-tight">
            {pedido.cliente?.nombre || "Cliente sin nombre"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span
              className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border rounded ${badge.bg}`}
            >
              {badge.label}
            </span>
            {pedido.esMayorista && (
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 bg-[#1D3FA8]/10 text-[#1D3FA8] rounded">
                Mayorista
              </span>
            )}
            <span className="text-sm text-stone-500">
              {fmtFecha(pedido.createdAt, true)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
            Total
          </div>
          <div className="font-serif text-4xl text-[#E63946] font-medium">
            {fmtMoney(pedido.total)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {cantItems} producto{cantItems !== 1 ? "s" : ""} · {fmtNum(cantUnidades)} en total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items + cambio de estado */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="font-serif text-lg text-[#1D3FA8]">Productos</h2>
            </div>
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                  <th className="px-6 py-2.5 font-medium">Producto</th>
                  <th className="px-6 py-2.5 font-medium text-right">Cantidad</th>
                  <th className="px-6 py-2.5 font-medium text-right">Precio</th>
                  <th className="px-6 py-2.5 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pedido.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium">
                        {it.producto?.nombre || "Producto eliminado"}
                      </div>
                      {it.producto?.categoria && (
                        <div className="text-xs text-stone-500">
                          {it.producto.categoria}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-sm">
                      {fmtNum(it.cantidad)} {it.unidad}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-sm text-stone-600">
                      {fmtMoney(it.precioUnit)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-sm font-semibold">
                      {fmtMoney(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50">
                  <td colSpan={3} className="px-6 py-3 text-right font-medium text-sm">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-base font-bold text-[#1D3FA8]">
                    {fmtMoney(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cambio de estado */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg text-[#1D3FA8] mb-1">
              Estado del pedido
            </h2>
            <p className="text-sm text-stone-500 mb-4">
              Cambia el estado a medida que avanza la entrega.
            </p>
            <EstadoSelector pedidoId={pedido.id} estadoActual={pedido.estado} />
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
              <h2 className="font-serif text-lg text-amber-900 mb-2">Notas</h2>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">
                {pedido.notas}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: cliente */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-3">
              Cliente
            </div>
            <div className="font-serif text-xl text-[#1D3FA8] mb-1">
              {pedido.cliente?.nombre || "—"}
            </div>
            {pedido.cliente?.whatsapp && (
              <div className="text-sm text-stone-600 font-mono">
                +{pedido.cliente.whatsapp}
              </div>
            )}
            {pedido.cliente?.direccion && (
              <div className="text-sm text-stone-700 mt-3 leading-relaxed">
                📍 {pedido.cliente.direccion}
              </div>
            )}
            {pedido.cliente?.mayorista && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
                  Mayorista registrado
                </div>
                <div className="text-sm font-medium">
                  {pedido.cliente.mayorista.razonSocial}
                </div>
                <div className="text-xs text-stone-500 font-mono">
                  {pedido.cliente.mayorista.documento}
                </div>
              </div>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mt-5 px-4 py-2.5 bg-emerald-500 text-white text-center text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                💬 Escribir por WhatsApp
              </a>
            )}
            {pedido.cliente?.id && (
              <Link
                href={`/admin/clientes/${pedido.cliente.id}`}
                className="block w-full mt-2 px-4 py-2.5 border border-stone-200 text-stone-700 text-center text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
              >
                Ver historial del cliente →
              </Link>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-3">
              Detalles
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Creado</dt>
                <dd className="text-stone-900 font-medium">
                  {fmtFecha(pedido.createdAt, true)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tipo</dt>
                <dd className="text-stone-900 font-medium">
                  {pedido.esMayorista ? "Mayorista" : "Al detal"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Productos</dt>
                <dd className="text-stone-900 font-medium">{cantItems}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

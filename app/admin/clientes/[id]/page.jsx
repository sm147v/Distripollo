import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fmtMoney, fmtFecha, fmtRelativo, badgeEstado } from "@/lib/format";

export default async function ClienteDetalle({ params }) {
  const { id } = await params;
  const sesion = await getSession();

  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
    include: {
      mayorista: true,
      pedidos: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!cliente || cliente.empresaId !== sesion.empresaId) {
    notFound();
  }

  const totalGastado = cliente.pedidos.reduce(
    (s, p) => s + Number(p.total),
    0
  );
  const ticketPromedio = cliente.pedidos.length
    ? totalGastado / cliente.pedidos.length
    : 0;

  const waUrl = cliente.whatsapp ? `https://wa.me/${cliente.whatsapp}` : null;

  return (
    <div className="px-10 py-10 max-w-6xl">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 hover:text-[#1D3FA8] mb-6"
      >
        ← Clientes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-[#E63946] mb-2 font-medium">
            Cliente
          </div>
          <h1 className="font-serif text-4xl text-[#1D3FA8] leading-tight">
            {cliente.nombre || "—"}
          </h1>
          {cliente.esMayorista && cliente.mayorista && (
            <div className="mt-2 inline-block text-[11px] uppercase tracking-wider px-2.5 py-1 bg-[#1D3FA8]/10 text-[#1D3FA8] rounded">
              Mayorista: {cliente.mayorista.razonSocial}
            </div>
          )}
        </div>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600"
          >
            💬 Escribir por WhatsApp
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Stat label="Total gastado" value={fmtMoney(totalGastado)} color="#1D3FA8" />
        <Stat label="Pedidos totales" value={cliente.pedidos.length} color="#E63946" />
        <Stat label="Ticket promedio" value={fmtMoney(ticketPromedio)} color="#0F1E3F" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info de contacto */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-3">
              Contacto
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-stone-500 mb-0.5">WhatsApp</div>
                <div className="font-mono">+{cliente.whatsapp}</div>
              </div>
              {cliente.direccion && (
                <div>
                  <div className="text-xs text-stone-500 mb-0.5">Dirección</div>
                  <div>{cliente.direccion}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-stone-500 mb-0.5">Cliente desde</div>
                <div>{fmtFecha(cliente.createdAt)}</div>
              </div>
              {cliente.ultimoPedido && (
                <div>
                  <div className="text-xs text-stone-500 mb-0.5">Último pedido</div>
                  <div>{fmtRelativo(cliente.ultimoPedido)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="font-serif text-xl text-[#1D3FA8]">
                Historial de pedidos
              </h2>
            </div>
            {cliente.pedidos.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-400 text-sm">
                Este cliente aún no tiene pedidos
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {cliente.pedidos.map((p) => {
                  const badge = badgeEstado(p.estado);
                  return (
                    <Link
                      key={p.id}
                      href={`/admin/pedidos/${p.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-stone-500">
                            {p.numero}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1">
                          {p.items.length} productos · {fmtFecha(p.createdAt)}
                        </div>
                      </div>
                      <div className="font-mono text-sm font-semibold text-[#1D3FA8]">
                        {fmtMoney(p.total)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">
        {label}
      </div>
      <div className="font-serif text-3xl tracking-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import { fmtMoney, fmtRelativo, fmtFecha, ESTADOS_PEDIDO, badgeEstado } from "@/lib/format";

export default async function PedidosPage({ searchParams }) {
  const sp = await searchParams;
  const estadoFiltro = sp?.estado || "TODOS";
  const sesion = await getSession();

  const where = { empresaId: sesion.empresaId };
  if (estadoFiltro !== "TODOS") where.estado = estadoFiltro;

  const [pedidos, conteos] = await Promise.all([
    prisma.pedido.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        cliente: true,
        items: true,
      },
    }),
    prisma.pedido.groupBy({
      by: ["estado"],
      where: { empresaId: sesion.empresaId },
      _count: true,
    }),
  ]);

  const totalsByEstado = Object.fromEntries(
    conteos.map((c) => [c.estado, c._count])
  );
  const totalGeneral = conteos.reduce((s, c) => s + c._count, 0);

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader titulo="Pedidos" subtitulo="Gestión" />

      {/* Tabs de filtros */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-stone-200">
        <FilterTab
          label="Todos"
          count={totalGeneral}
          active={estadoFiltro === "TODOS"}
          href="/admin/pedidos"
        />
        {Object.entries(ESTADOS_PEDIDO).map(([key, info]) => (
          <FilterTab
            key={key}
            label={info.label}
            count={totalsByEstado[key] || 0}
            active={estadoFiltro === key}
            href={`/admin/pedidos?estado=${key}`}
          />
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {pedidos.length === 0 ? (
          <div className="px-6 py-16 text-center text-stone-400">
            No hay pedidos {estadoFiltro !== "TODOS" ? "en este estado" : ""}.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3 font-medium">Número</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Cuándo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pedidos.map((p) => {
                const badge = badgeEstado(p.estado);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/pedidos/${p.id}`}
                        className="font-mono text-xs text-[#1D3FA8] font-semibold hover:underline"
                      >
                        {p.numero}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/pedidos/${p.id}`} className="block">
                        <div className="text-sm font-medium text-stone-900">
                          {p.cliente?.nombre || "—"}
                        </div>
                        <div className="text-xs text-stone-500">
                          {p.cliente?.whatsapp || ""}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      {p.esMayorista ? (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#1D3FA8]/10 text-[#1D3FA8] rounded">
                          Mayorista
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">Detal</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-stone-600">
                      {p.items.length}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                        {fmtMoney(p.total)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-xs text-stone-600">
                        {fmtRelativo(p.createdAt)}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {fmtFecha(p.createdAt)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pedidos.length === 100 && (
        <p className="text-center text-xs text-stone-400 mt-4">
          Mostrando los 100 más recientes
        </p>
      )}
    </div>
  );
}

function FilterTab({ label, count, active, href }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#E63946] text-[#E63946]"
          : "border-transparent text-stone-500 hover:text-stone-800"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs text-stone-400">({count})</span>
    </Link>
  );
}

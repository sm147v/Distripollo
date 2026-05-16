import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "./_components/PageHeader";
import { fmtMoney, fmtRelativo, badgeEstado } from "@/lib/format";

export default async function AdminHome() {
  const sesion = await getSession();
  const empresaId = sesion.empresaId;

  // Métricas
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const semanaInicio = new Date();
  semanaInicio.setDate(semanaInicio.getDate() - 7);
  semanaInicio.setHours(0, 0, 0, 0);
  const mesInicio = new Date();
  mesInicio.setDate(1);
  mesInicio.setHours(0, 0, 0, 0);

  const [
    pedidosHoy,
    pedidosSemana,
    pedidosMes,
    totalClientes,
    totalMayoristas,
    pedidosPendientes,
    pedidosRecientes,
    topProductos,
  ] = await Promise.all([
    prisma.pedido.aggregate({
      where: { empresaId, createdAt: { gte: hoyInicio } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.pedido.aggregate({
      where: { empresaId, createdAt: { gte: semanaInicio } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.pedido.aggregate({
      where: { empresaId, createdAt: { gte: mesInicio } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.cliente.count({ where: { empresaId } }),
    prisma.mayorista.count({ where: { empresaId, activo: true } }),
    prisma.pedido.count({
      where: { empresaId, estado: "PENDIENTE" },
    }),
    prisma.pedido.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { cliente: true },
    }),
    prisma.itemPedido.groupBy({
      by: ["productoId"],
      where: { pedido: { empresaId, createdAt: { gte: mesInicio } } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
  ]);

  // Hidratar topProductos con nombres
  const productIds = topProductos.map((p) => p.productoId);
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds } },
  });
  const productosMap = Object.fromEntries(productos.map((p) => [p.id, p]));

  const kpis = [
    {
      label: "Ventas hoy",
      valor: fmtMoney(pedidosHoy._sum.total),
      sub: `${pedidosHoy._count} pedidos`,
      color: "#1D3FA8",
    },
    {
      label: "Esta semana",
      valor: fmtMoney(pedidosSemana._sum.total),
      sub: `${pedidosSemana._count} pedidos`,
      color: "#E63946",
    },
    {
      label: "Este mes",
      valor: fmtMoney(pedidosMes._sum.total),
      sub: `${pedidosMes._count} pedidos`,
      color: "#0F1E3F",
    },
    {
      label: "Pendientes",
      valor: pedidosPendientes.toString(),
      sub: "por confirmar",
      color: "#FFC72C",
      destacado: pedidosPendientes > 0,
    },
  ];

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader
        titulo={`Hola, ${sesion.nombre.split(" ")[0]}.`}
        subtitulo="Panel general"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`p-6 rounded-2xl border bg-white ${
              k.destacado ? "border-[#FFC72C] shadow-[0_0_0_4px_rgba(255,199,44,0.15)]" : "border-stone-200"
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-3 font-medium">
              {k.label}
            </div>
            <div
              className="font-serif text-3xl tracking-tight"
              style={{ color: k.color }}
            >
              {k.valor}
            </div>
            <div className="text-sm text-stone-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <div>
              <h2 className="font-serif text-xl text-[#1D3FA8]">Pedidos recientes</h2>
              <p className="text-xs text-stone-500 mt-0.5">Los últimos 8 entrantes</p>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-xs uppercase tracking-wider text-[#E63946] hover:text-[#E63946]/70 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          {pedidosRecientes.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">
              Aún no hay pedidos.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {pedidosRecientes.map((p) => {
                const badge = badgeEstado(p.estado);
                return (
                  <Link
                    key={p.id}
                    href={`/admin/pedidos/${p.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-stone-400">
                          {p.numero}
                        </span>
                        {p.esMayorista && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#1D3FA8]/10 text-[#1D3FA8] rounded">
                            Mayor
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-sm truncate">
                        {p.cliente?.nombre || "Cliente sin nombre"}
                      </div>
                      <div className="text-xs text-stone-500">
                        {fmtRelativo(p.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-[#1D3FA8]">
                        {fmtMoney(p.total)}
                      </div>
                      <div
                        className={`inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${badge.bg}`}
                      >
                        {badge.label}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100">
            <h2 className="font-serif text-xl text-[#1D3FA8]">Top productos</h2>
            <p className="text-xs text-stone-500 mt-0.5">Más vendidos este mes</p>
          </div>

          {topProductos.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">
              Sin datos aún
            </div>
          ) : (
            <ol className="divide-y divide-stone-100">
              {topProductos.map((tp, i) => {
                const prod = productosMap[tp.productoId];
                if (!prod) return null;
                return (
                  <li key={tp.productoId} className="flex items-start gap-3 px-6 py-3">
                    <span className="font-serif text-xl text-[#E63946] tabular-nums w-6">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {prod.nombre}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {Number(tp._sum.cantidad).toFixed(0)} {prod.unidad} ·{" "}
                        {fmtMoney(tp._sum.subtotal)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Stats laterales */}
          <div className="border-t border-stone-100 px-6 py-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-500">Clientes</div>
              <div className="font-mono text-lg font-semibold text-[#1D3FA8] mt-1">
                {totalClientes}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-500">Mayoristas</div>
              <div className="font-mono text-lg font-semibold text-[#1D3FA8] mt-1">
                {totalMayoristas}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

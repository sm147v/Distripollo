import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import { fmtMoney, fmtNum, fmtFecha } from "@/lib/format";

export default async function ReportesPage({ searchParams }) {
  const sp = await searchParams;
  const periodo = sp?.p || "30"; // 7, 30, 90 días
  const dias = parseInt(periodo, 10);

  const sesion = await getSession();
  const empresaId = sesion.empresaId;

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const [resumen, ventasPorDia, topProductos, topClientes, ventasPorCategoria, conteoEstado] =
    await Promise.all([
      // Resumen general
      prisma.pedido.aggregate({
        where: { empresaId, createdAt: { gte: desde } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      // Ventas por día (raw query)
      prisma.$queryRaw`
        SELECT DATE("createdAt") AS dia, SUM("total")::numeric AS total, COUNT(*) AS pedidos
        FROM "Pedido"
        WHERE "empresaId" = ${empresaId} AND "createdAt" >= ${desde}
        GROUP BY DATE("createdAt")
        ORDER BY dia ASC
      `,
      // Top productos por ingresos
      prisma.itemPedido.groupBy({
        by: ["productoId"],
        where: { pedido: { empresaId, createdAt: { gte: desde } } },
        _sum: { cantidad: true, subtotal: true },
        _count: true,
        orderBy: { _sum: { subtotal: "desc" } },
        take: 10,
      }),
      // Top clientes
      prisma.pedido.groupBy({
        by: ["clienteId"],
        where: { empresaId, createdAt: { gte: desde } },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
      // Por categoría (raw porque categoría está en Producto)
      prisma.$queryRaw`
        SELECT p."categoria" AS cat,
               SUM(i."subtotal")::numeric AS total,
               COUNT(DISTINCT i."pedidoId") AS pedidos
        FROM "ItemPedido" i
        JOIN "Producto" p ON p."id" = i."productoId"
        JOIN "Pedido" pe ON pe."id" = i."pedidoId"
        WHERE pe."empresaId" = ${empresaId} AND pe."createdAt" >= ${desde}
        GROUP BY p."categoria"
        ORDER BY total DESC
      `,
      // Conteo por estado
      prisma.pedido.groupBy({
        by: ["estado"],
        where: { empresaId, createdAt: { gte: desde } },
        _count: true,
        _sum: { total: true },
      }),
    ]);

  // Hidratar productos y clientes
  const prodIds = topProductos.map((p) => p.productoId);
  const cliIds = topClientes.map((c) => c.clienteId);
  const [productos, clientes] = await Promise.all([
    prisma.producto.findMany({ where: { id: { in: prodIds } } }),
    prisma.cliente.findMany({ where: { id: { in: cliIds } } }),
  ]);
  const productosMap = Object.fromEntries(productos.map((p) => [p.id, p]));
  const clientesMap = Object.fromEntries(clientes.map((c) => [c.id, c]));

  // Mayor venta del periodo
  const maxVentaDia = ventasPorDia.reduce(
    (max, d) => (Number(d.total) > Number(max.total || 0) ? d : max),
    { total: 0 }
  );

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader titulo="Reportes" subtitulo="Análisis de ventas" />

      {/* Selector de periodo */}
      <div className="flex gap-2 mb-8">
        <PeriodoBtn dias="7" actual={periodo} label="7 días" />
        <PeriodoBtn dias="30" actual={periodo} label="30 días" />
        <PeriodoBtn dias="90" actual={periodo} label="90 días" />
        <PeriodoBtn dias="365" actual={periodo} label="1 año" />
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <KPI label="Ingresos" value={fmtMoney(resumen._sum.total)} color="#1D3FA8" />
        <KPI label="Pedidos" value={resumen._count} color="#E63946" />
        <KPI
          label="Ticket promedio"
          value={fmtMoney(resumen._avg.total)}
          color="#0F1E3F"
        />
        <KPI
          label="Mejor día"
          value={maxVentaDia.total > 0 ? fmtMoney(maxVentaDia.total) : "—"}
          sub={maxVentaDia.dia ? fmtFecha(maxVentaDia.dia) : ""}
          color="#FFC72C"
        />
      </div>

      {/* Gráfico de ventas por día (SVG simple) */}
      {ventasPorDia.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8">
          <h2 className="font-serif text-xl text-[#1D3FA8] mb-1">
            Ventas por día
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            Últimos {dias} días — barra por día con el total vendido
          </p>
          <ChartBarras data={ventasPorDia} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top productos */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-xl text-[#1D3FA8]">Top 10 productos</h2>
            <p className="text-xs text-stone-500 mt-0.5">Por ingresos</p>
          </div>
          {topProductos.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ol className="divide-y divide-stone-100">
              {topProductos.map((tp, i) => {
                const prod = productosMap[tp.productoId];
                if (!prod) return null;
                const maxIngreso = Number(topProductos[0]._sum.subtotal);
                const pct = (Number(tp._sum.subtotal) / maxIngreso) * 100;
                return (
                  <li key={tp.productoId} className="px-6 py-3 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#FFC72C]/10"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center gap-3">
                      <span className="font-serif text-lg text-[#E63946] tabular-nums w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {prod.nombre}
                        </div>
                        <div className="text-xs text-stone-500">
                          {fmtNum(tp._sum.cantidad)} {prod.unidad} ·{" "}
                          {tp._count} pedidos
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                        {fmtMoney(tp._sum.subtotal)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Top clientes */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-xl text-[#1D3FA8]">Top 10 clientes</h2>
            <p className="text-xs text-stone-500 mt-0.5">Por monto gastado</p>
          </div>
          {topClientes.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ol className="divide-y divide-stone-100">
              {topClientes.map((tc, i) => {
                const cli = clientesMap[tc.clienteId];
                if (!cli) return null;
                return (
                  <li
                    key={tc.clienteId}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <span className="font-serif text-lg text-[#E63946] tabular-nums w-6">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {cli.nombre || "Sin nombre"}
                      </div>
                      <div className="text-xs text-stone-500">
                        {tc._count} pedidos
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                      {fmtMoney(tc._sum.total)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Ventas por categoría + estados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-xl text-[#1D3FA8]">Por categoría</h2>
          </div>
          {ventasPorCategoria.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {ventasPorCategoria.map((c) => (
                <li
                  key={c.cat || "sin"}
                  className="flex items-center justify-between gap-3 px-6 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {c.cat || "Sin categoría"}
                    </div>
                    <div className="text-xs text-stone-500">
                      {Number(c.pedidos)} pedidos
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                    {fmtMoney(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-xl text-[#1D3FA8]">
              Distribución por estado
            </h2>
          </div>
          <ul className="divide-y divide-stone-100">
            {conteoEstado.map((e) => (
              <li
                key={e.estado}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div>
                  <div className="text-sm font-medium">{e.estado}</div>
                  <div className="text-xs text-stone-500">
                    {e._count} pedidos
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                  {fmtMoney(e._sum.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="text-xs uppercase tracking-wider text-stone-500 mb-2 font-medium">
        {label}
      </div>
      <div className="font-serif text-3xl tracking-tight" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}

function PeriodoBtn({ dias, actual, label }) {
  const isActive = actual === dias;
  return (
    <a
      href={`/admin/reportes?p=${dias}`}
      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
        isActive
          ? "bg-[#1D3FA8] text-white border-[#1D3FA8]"
          : "bg-white text-stone-600 border-stone-200 hover:border-[#1D3FA8]"
      }`}
    >
      {label}
    </a>
  );
}

function ChartBarras({ data }) {
  if (!data || data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => Number(d.total)));
  const W = 800;
  const H = 200;
  const padL = 20;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = Math.max(2, chartW / data.length - 3);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 480 }}
        preserveAspectRatio="none"
      >
        {/* Líneas de referencia */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padL}
            x2={W - padR}
            y1={padT + chartH * (1 - p)}
            y2={padT + chartH * (1 - p)}
            stroke="#e7e5e4"
            strokeDasharray="2,3"
          />
        ))}
        {/* Barras */}
        {data.map((d, i) => {
          const v = Number(d.total);
          const h = maxTotal > 0 ? (v / maxTotal) * chartH : 0;
          const x = padL + (chartW / data.length) * i + 1.5;
          const y = padT + chartH - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill="#1D3FA8"
                opacity={0.85}
              />
              <title>
                {new Date(d.dia).toLocaleDateString("es-CO")}: ${" "}
                {Number(d.total).toLocaleString("es-CO")}
              </title>
            </g>
          );
        })}
        {/* Eje X (labels primero, último y medio) */}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => {
          if (!data[i]) return null;
          const x = padL + (chartW / data.length) * i + barW / 2;
          return (
            <text
              key={i}
              x={x}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#78716c"
            >
              {new Date(data[i].dia).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
              })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

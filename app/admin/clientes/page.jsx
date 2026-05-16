import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import { fmtMoney, fmtRelativo } from "@/lib/format";

export default async function ClientesPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q || "").trim();
  const sesion = await getSession();

  const where = { empresaId: sesion.empresaId };
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q } },
      { direccion: { contains: q, mode: "insensitive" } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { ultimoPedido: { sort: "desc", nulls: "last" } },
    take: 200,
    include: {
      _count: { select: { pedidos: true } },
      mayorista: true,
    },
  });

  // Calcular total gastado por cada cliente
  const ids = clientes.map((c) => c.id);
  const totales = ids.length
    ? await prisma.pedido.groupBy({
        by: ["clienteId"],
        where: { clienteId: { in: ids } },
        _sum: { total: true },
      })
    : [];
  const totalesMap = Object.fromEntries(
    totales.map((t) => [t.clienteId, Number(t._sum.total || 0)])
  );

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader titulo="Clientes" subtitulo="Histórico" />

      {/* Búsqueda */}
      <form className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, WhatsApp o dirección..."
          className="w-full max-w-md px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#1D3FA8]"
        />
      </form>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {clientes.length === 0 ? (
          <div className="px-6 py-16 text-center text-stone-400">
            {q ? `No se encontraron clientes para "${q}"` : "Aún no hay clientes registrados."}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">WhatsApp</th>
                <th className="px-6 py-3 font-medium">Pedidos</th>
                <th className="px-6 py-3 font-medium text-right">Total gastado</th>
                <th className="px-6 py-3 font-medium">Último pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-stone-900 hover:text-[#1D3FA8]">
                          {c.nombre || "—"}
                        </span>
                        {c.esMayorista && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#1D3FA8]/10 text-[#1D3FA8] rounded">
                            Mayorista
                          </span>
                        )}
                      </div>
                      {c.direccion && (
                        <div className="text-xs text-stone-500 truncate max-w-md">
                          📍 {c.direccion}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <a
                      href={`https://wa.me/${c.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-emerald-600 hover:underline"
                    >
                      +{c.whatsapp}
                    </a>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-sm">{c._count.pedidos}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
                      {fmtMoney(totalesMap[c.id])}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-stone-600">
                      {fmtRelativo(c.ultimoPedido)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {clientes.length === 200 && (
        <p className="text-center text-xs text-stone-400 mt-4">
          Mostrando los 200 primeros. Usá el buscador para encontrar más.
        </p>
      )}
    </div>
  );
}

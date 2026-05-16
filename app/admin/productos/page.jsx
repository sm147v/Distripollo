import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import FilaProducto from "./FilaProducto";

export default async function ProductosPage() {
  const sesion = await getSession();
  const productos = await prisma.producto.findMany({
    where: { empresaId: sesion.empresaId },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });

  // Agrupar por categoría
  const porCategoria = {};
  for (const p of productos) {
    const cat = p.categoria || "Sin categoría";
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(p);
  }

  const categorias = Object.keys(porCategoria).sort();
  const activos = productos.filter((p) => p.activo).length;
  const inactivos = productos.length - activos;

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader titulo="Productos" subtitulo="Catálogo y precios" />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">Total</div>
          <div className="font-mono text-2xl font-semibold text-[#1D3FA8] mt-1">
            {productos.length}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">Activos</div>
          <div className="font-mono text-2xl font-semibold text-emerald-600 mt-1">
            {activos}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">
            Inactivos
          </div>
          <div className="font-mono text-2xl font-semibold text-stone-500 mt-1">
            {inactivos}
          </div>
        </div>
      </div>

      <p className="text-sm text-stone-500 mb-6">
        Editá precios al detal y mayoristas directamente desde la tabla.
        Desactivá productos que ya no manejes (no aparecerán en el bot).
      </p>

      {categorias.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="font-serif text-xl text-[#1D3FA8] mb-3">{cat}</h2>
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                  <th className="px-6 py-2.5 font-medium">Producto</th>
                  <th className="px-6 py-2.5 font-medium">Categoría</th>
                  <th className="px-6 py-2.5 font-medium">Precio detal</th>
                  <th className="px-6 py-2.5 font-medium">Precio mayor</th>
                  <th className="px-6 py-2.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {porCategoria[cat].map((p) => (
                  <FilaProducto key={p.id} producto={JSON.parse(JSON.stringify(p))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

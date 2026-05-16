import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import { NuevoMayoristaForm, ToggleMayoristaBtn } from "./Form";
import { fmtFecha } from "@/lib/format";

export default async function MayoristasPage() {
  const sesion = await getSession();
  const mayoristas = await prisma.mayorista.findMany({
    where: { empresaId: sesion.empresaId },
    orderBy: { razonSocial: "asc" },
    include: { _count: { select: { clientes: true } } },
  });

  const activos = mayoristas.filter((m) => m.activo).length;

  return (
    <div className="px-10 py-10 max-w-7xl">
      <PageHeader
        titulo="Mayoristas"
        subtitulo="Clientes con precios especiales"
        accion={<NuevoMayoristaForm />}
      />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">Activos</div>
          <div className="font-mono text-2xl font-semibold text-emerald-600 mt-1">
            {activos}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">Inactivos</div>
          <div className="font-mono text-2xl font-semibold text-stone-500 mt-1">
            {mayoristas.length - activos}
          </div>
        </div>
      </div>

      {mayoristas.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl px-6 py-16 text-center">
          <p className="text-stone-500 mb-3">Aún no tienes mayoristas registrados.</p>
          <p className="text-xs text-stone-400">
            Registrá uno para que pueda pedir con precios especiales por WhatsApp.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3 font-medium">Razón social</th>
                <th className="px-6 py-3 font-medium">Documento</th>
                <th className="px-6 py-3 font-medium">WhatsApp</th>
                <th className="px-6 py-3 font-medium">Clientes</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Creado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {mayoristas.map((m) => (
                <tr key={m.id} className={m.activo ? "" : "opacity-60"}>
                  <td className="px-6 py-3.5">
                    <div className="text-sm font-medium">{m.razonSocial}</div>
                    {m.direccion && (
                      <div className="text-xs text-stone-500 truncate max-w-[200px]">
                        {m.direccion}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-xs uppercase tracking-wider text-stone-500">
                      {m.tipoDocumento}
                    </div>
                    <div className="font-mono text-sm">{m.documento}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    {m.whatsapp ? (
                      <a
                        href={`https://wa.me/57${m.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-emerald-600 hover:underline"
                      >
                        +57 {m.whatsapp}
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-sm">{m._count.clientes}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    {m.activo ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                        Activo
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 rounded">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-stone-500">
                      {fmtFecha(m.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <ToggleMayoristaBtn id={m.id} activo={m.activo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

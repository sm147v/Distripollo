import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductosClient } from "@/components/ProductosClient";

export const revalidate = 600;

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))] as string[];

  return (
    <div className="py-12 md:py-16 bg-[#FFFBF5] min-h-screen">
      <div className="container-dp">
        <div className="max-w-2xl mb-12">
          <div className="divider-fancy mb-6" style={{ width: "fit-content" }}>
            <span>Catálogo completo</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#0F1E3F] leading-[0.95]">
            Nuestros<br/>
            <span className="italic text-[#E63946]">productos.</span>
          </h1>
        </div>

        <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
          <ProductosClient
            productos={productos.map(p => ({
              id: p.id,
              nombre: p.nombre,
              precio: Number(p.precio),
              unidad: p.unidad,
              categoria: p.categoria || undefined,
              imagen: p.imagen || undefined,
            }))}
            categorias={categorias}
          />
        </Suspense>
      </div>
    </div>
  );
}

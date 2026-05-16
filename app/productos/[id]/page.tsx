import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";

export const revalidate = 600;

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({ where: { id: parseInt(id) } });
  if (!producto || !producto.activo) notFound();

  const relacionados = await prisma.producto.findMany({
    where: { activo: true, categoria: producto.categoria, id: { not: producto.id } },
    take: 4,
  });

  return (
    <ProductDetail
      producto={{
        id: producto.id, nombre: producto.nombre,
        descripcion: producto.descripcion || undefined,
        precio: Number(producto.precio),
        precioMayor: producto.precioMayor ? Number(producto.precioMayor) : undefined,
        unidad: producto.unidad,
        categoria: producto.categoria || undefined,
        imagen: producto.imagen || undefined,
      }}
      relacionados={relacionados.map(r => ({
        id: r.id, nombre: r.nombre, precio: Number(r.precio),
        unidad: r.unidad, categoria: r.categoria || undefined, imagen: r.imagen || undefined,
      }))}
    />
  );
}

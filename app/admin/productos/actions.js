"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");
  return sesion;
}

export async function actualizarPrecio(productoId, precio, precioMayor) {
  const sesion = await requireAuth();
  const prod = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!prod || prod.empresaId !== sesion.empresaId) {
    throw new Error("Producto no encontrado");
  }

  const data = {};
  if (precio !== undefined && precio !== null) {
    const p = Number(precio);
    if (isNaN(p) || p < 0) throw new Error("Precio inválido");
    data.precio = p;
  }
  if (precioMayor !== undefined && precioMayor !== null) {
    const p = Number(precioMayor);
    if (isNaN(p) || p < 0) throw new Error("Precio mayorista inválido");
    data.precioMayor = p;
  }

  await prisma.producto.update({
    where: { id: productoId },
    data,
  });

  revalidatePath("/admin/productos");
}

export async function toggleProductoActivo(productoId) {
  const sesion = await requireAuth();
  const prod = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!prod || prod.empresaId !== sesion.empresaId) {
    throw new Error("Producto no encontrado");
  }
  await prisma.producto.update({
    where: { id: productoId },
    data: { activo: !prod.activo },
  });
  revalidatePath("/admin/productos");
}

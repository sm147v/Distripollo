"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ESTADOS_VALIDOS = ["PENDIENTE", "CONFIRMADO", "EN_RUTA", "ENTREGADO", "CANCELADO"];

async function requireAuth() {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");
  return sesion;
}

export async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
  const sesion = await requireAuth();
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    throw new Error("Estado inválido");
  }

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido || pedido.empresaId !== sesion.empresaId) {
    throw new Error("Pedido no encontrado");
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: nuevoEstado },
  });

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

export async function actualizarNotasPedido(pedidoId, notas) {
  const sesion = await requireAuth();
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido || pedido.empresaId !== sesion.empresaId) {
    throw new Error("Pedido no encontrado");
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { notas },
  });

  revalidatePath(`/admin/pedidos/${pedidoId}`);
}

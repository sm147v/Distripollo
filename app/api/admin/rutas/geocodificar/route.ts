import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodificar } from "@/lib/maps";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const sesion = await getSession();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: "Falta pedidoId" }, { status: 400 });

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { cliente: true },
    });

    if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    if (pedido.empresaId !== sesion.empresaId) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    if (!pedido.cliente.direccion) return NextResponse.json({ error: "Sin dirección" }, { status: 400 });

    const coords = await geocodificar(pedido.cliente.direccion);
    if (!coords) return NextResponse.json({ error: "No se pudo geocodificar" }, { status: 400 });

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { latitud: coords.lat, longitud: coords.lng },
    });

    return NextResponse.json({ success: true, ...coords });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

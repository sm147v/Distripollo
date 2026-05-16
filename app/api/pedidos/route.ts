import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cliente, items, total } = body;

    if (!cliente?.nombre || !cliente?.telefono || !items || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { slug: "distripollo" } });
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 500 });

    const whatsapp = cliente.telefono.replace(/\D/g, "");
    const direccion = `${cliente.direccion}${cliente.barrio ? ", " + cliente.barrio : ""}`;

    let clienteDb = await prisma.cliente.findUnique({
      where: { empresaId_whatsapp: { empresaId: empresa.id, whatsapp } },
    });
    if (!clienteDb) {
      clienteDb = await prisma.cliente.create({
        data: { empresaId: empresa.id, whatsapp, nombre: cliente.nombre, direccion, ultimoPedido: new Date() },
      });
    } else {
      clienteDb = await prisma.cliente.update({
        where: { id: clienteDb.id },
        data: { nombre: cliente.nombre, direccion, ultimoPedido: new Date() },
      });
    }

    const numero = "DP-" + Date.now().toString().slice(-8);
    await prisma.pedido.create({
      data: {
        numero, empresaId: empresa.id, clienteId: clienteDb.id, total,
        notas: [
          cliente.email && `Email: ${cliente.email}`,
          cliente.fechaEntrega && `Fecha: ${cliente.fechaEntrega}`,
          cliente.notas && `Notas: ${cliente.notas}`,
        ].filter(Boolean).join(" | "),
        items: { create: items.map((i: any) => ({
          productoId: i.productoId, cantidad: i.cantidad, unidad: i.unidad,
          precioUnit: i.precioUnit, subtotal: i.subtotal,
        })) },
      },
    });

    return NextResponse.json({ success: true, numero });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

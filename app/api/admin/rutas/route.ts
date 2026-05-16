import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizarRuta, urlGoogleMaps, totalKmRuta } from "@/lib/maps";
import { getSession } from "@/lib/auth";

const ORIGEN = { lat: 6.281, lng: -75.567 };

export async function POST(req: Request) {
  const sesion = await getSession();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { nombre, fecha, zonaId, pedidoIds, motorizado } = await req.json();
    if (!nombre || !fecha || !pedidoIds || pedidoIds.length === 0) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const pedidos = await prisma.pedido.findMany({
      where: { id: { in: pedidoIds }, empresaId: sesion.empresaId, latitud: { not: null }, longitud: { not: null } },
    });

    if (pedidos.length === 0) return NextResponse.json({ error: "Sin coordenadas" }, { status: 400 });

    const conCoords = pedidos.map(p => ({ id: p.id, lat: Number(p.latitud), lng: Number(p.longitud) }));
    const ordenOptimo = optimizarRuta(ORIGEN, conCoords);
    const url = urlGoogleMaps(ordenOptimo, ORIGEN);
    const totalDinero = pedidos.reduce((s, p) => s + Number(p.total), 0);

    const ruta = await prisma.ruta.create({
      data: {
        empresaId: sesion.empresaId, nombre, fecha: new Date(fecha),
        zonaId: zonaId || null, motorizado: motorizado || null,
        totalPedidos: pedidos.length, totalDinero, urlGoogleMaps: url,
        ordenOptimo: ordenOptimo.map(o => o.id),
      },
    });

    for (let i = 0; i < ordenOptimo.length; i++) {
      await prisma.pedido.update({
        where: { id: ordenOptimo[i].id },
        data: { rutaId: ruta.id, ordenEnRuta: i + 1 },
      });
    }

    return NextResponse.json({ success: true, ruta, url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

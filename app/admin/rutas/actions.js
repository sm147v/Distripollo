"use server";

import { prisma } from "@/lib/prisma";
import { optimizarRuta, urlGoogleMaps, geocodificar } from "@/lib/maps";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ORIGEN = { lat: 6.281, lng: -75.567 };

export async function geocodificarTodos() {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");

  const pedidos = await prisma.pedido.findMany({
    where: {
      empresaId: sesion.empresaId,
      latitud: null,
      cliente: { direccion: { not: null } },
      estado: { in: ["NUEVO", "PENDIENTE", "CONFIRMADO"] },
    },
    include: { cliente: true },
    take: 30,
  });

  let exitosos = 0;
  for (const p of pedidos) {
    if (!p.cliente.direccion) continue;
    const coords = await geocodificar(p.cliente.direccion);
    if (coords) {
      await prisma.pedido.update({
        where: { id: p.id },
        data: { latitud: coords.lat, longitud: coords.lng },
      });
      exitosos++;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  revalidatePath("/admin/rutas");
  return { procesados: pedidos.length, exitosos };
}

export async function crearRuta(formData) {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");

  const nombre = formData.get("nombre");
  const fecha = formData.get("fecha");
  const zonaId = formData.get("zonaId");
  const motorizado = formData.get("motorizado");
  const pedidoIdsStr = formData.get("pedidoIds");

  if (!nombre || !fecha || !pedidoIdsStr) throw new Error("Faltan datos");

  const pedidoIds = pedidoIdsStr.split(",").map(s => parseInt(s)).filter(Boolean);
  const pedidos = await prisma.pedido.findMany({
    where: { id: { in: pedidoIds }, empresaId: sesion.empresaId, latitud: { not: null }, longitud: { not: null } },
  });

  if (pedidos.length === 0) throw new Error("Ningún pedido tiene coordenadas");

  const conCoords = pedidos.map(p => ({ id: p.id, lat: Number(p.latitud), lng: Number(p.longitud) }));
  const ordenOptimo = optimizarRuta(ORIGEN, conCoords);
  const url = urlGoogleMaps(ordenOptimo, ORIGEN);
  const totalDinero = pedidos.reduce((s, p) => s + Number(p.total), 0);

  const ruta = await prisma.ruta.create({
    data: {
      empresaId: sesion.empresaId, nombre, fecha: new Date(fecha),
      zonaId: zonaId ? parseInt(zonaId) : null, motorizado: motorizado || null,
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

  revalidatePath("/admin/rutas");
  return { success: true, id: ruta.id };
}

export async function eliminarRuta(formData) {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");
  const id = parseInt(formData.get("id"));
  if (!id) throw new Error("Falta id");

  const ruta = await prisma.ruta.findUnique({ where: { id } });
  if (!ruta || ruta.empresaId !== sesion.empresaId) throw new Error("No encontrada");

  await prisma.pedido.updateMany({ where: { rutaId: id }, data: { rutaId: null, ordenEnRuta: null } });
  await prisma.ruta.delete({ where: { id } });
  revalidatePath("/admin/rutas");
  return { success: true };
}

export async function cambiarEstadoRuta(formData) {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");
  const id = parseInt(formData.get("id"));
  const estado = formData.get("estado");
  await prisma.ruta.update({ where: { id, empresaId: sesion.empresaId }, data: { estado } });
  revalidatePath("/admin/rutas");
  return { success: true };
}

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PageHeader from "../_components/PageHeader";
import { RutasClient } from "./RutasClient";

/**
 * Devuelve los límites [inicio, fin) de un día en la zona horaria de
 * Medellín (UTC-5), expresados como Date en UTC para Prisma.
 *
 * Si llega "2026-05-15", devuelve:
 *   inicio: 2026-05-15T05:00:00.000Z  (= 15/may 00:00 hora Medellín)
 *   fin:    2026-05-16T05:00:00.000Z  (= 16/may 00:00 hora Medellín)
 */
function diaEnMedellin(fechaStr) {
  // fechaStr formato "YYYY-MM-DD". Si no viene, usamos hoy en Medellín.
  let y, m, d;
  if (fechaStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    [y, m, d] = fechaStr.split("-").map(Number);
  } else {
    // Hoy en hora de Medellín
    const ahora = new Date();
    const offsetMedellinMs = -5 * 60 * 60 * 1000; // UTC-5
    const enMedellin = new Date(ahora.getTime() + offsetMedellinMs);
    y = enMedellin.getUTCFullYear();
    m = enMedellin.getUTCMonth() + 1;
    d = enMedellin.getUTCDate();
  }
  // 00:00 hora Medellín = 05:00 UTC ese mismo día
  const inicio = new Date(Date.UTC(y, m - 1, d, 5, 0, 0));
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  const isoFecha = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { inicio, fin, isoFecha };
}

export default async function RutasPage({ searchParams }) {
  const sesion = await getSession();
  const sp = await searchParams;

  const { inicio, fin, isoFecha } = diaEnMedellin(sp.fecha);

  const pedidosSinRuta = await prisma.pedido.findMany({
    where: {
      empresaId: sesion.empresaId,
      rutaId: null,
      estado: { in: ["NUEVO", "PENDIENTE", "CONFIRMADO"] },
    },
    include: { cliente: { include: { zona: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Buscamos rutas del día seleccionado (sin relaciones inexistentes)
  const rutas = await prisma.ruta.findMany({
    where: {
      empresaId: sesion.empresaId,
      fecha: { gte: inicio, lt: fin },
    },
    include: {
      pedidos: {
        include: { cliente: true },
        orderBy: { ordenEnRuta: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const zonas = await prisma.zona.findMany({
    where: { empresaId: sesion.empresaId },
    orderBy: { nombre: "asc" },
  });

  const conCoords = pedidosSinRuta.filter((p) => p.latitud && p.longitud).length;
  const sinCoords = pedidosSinRuta.length - conCoords;

  return (
    <div>
      <PageHeader
        titulo="Rutas de entrega"
        subtitulo="Optimiza las entregas del día agrupando pedidos por zona y orden ideal."
      />

      <RutasClient
        pedidosSinRuta={pedidosSinRuta.map((p) => ({
          id: p.id,
          numero: p.numero,
          cliente: p.cliente.nombre,
          direccion: p.cliente.direccion || "Sin dirección",
          zona: p.cliente.zona?.nombre || null,
          zonaId: p.cliente.zonaId,
          total: Number(p.total),
          tieneCoords: !!(p.latitud && p.longitud),
          lat: p.latitud ? Number(p.latitud) : null,
          lng: p.longitud ? Number(p.longitud) : null,
          createdAt: p.createdAt.toISOString(),
        }))}
        rutas={rutas.map((r) => {
          // Calculamos totales en código porque no están en la DB
          const totalDinero = r.pedidos.reduce(
            (s, p) => s + Number(p.total),
            0
          );
          return {
            id: r.id,
            nombre: r.nombre || `Ruta #${r.id}`,
            fecha: r.fecha.toISOString(),
            estado: r.estado,
            // Usamos los campos REALES del schema
            motorizado: r.conductor || null,
            vehiculo: r.vehiculo || null,
            notas: r.notas || null,
            totalPedidos: r.pedidos.length,
            totalDinero,
            urlGoogleMaps: null, // no existe en el schema
            zona: null,           // no existe la relación
            pedidos: r.pedidos.map((p) => ({
              id: p.id,
              numero: p.numero,
              cliente: p.cliente.nombre,
              direccion: p.cliente.direccion || "",
              total: Number(p.total),
              ordenEnRuta: p.ordenEnRuta,
              lat: p.latitud ? Number(p.latitud) : null,
              lng: p.longitud ? Number(p.longitud) : null,
              estado: p.estado,
            })),
          };
        })}
        zonas={zonas.map((z) => ({ id: z.id, nombre: z.nombre }))}
        fechaFiltro={isoFecha}
        stats={{ conCoords, sinCoords, totalRutas: rutas.length }}
      />
    </div>
  );
}

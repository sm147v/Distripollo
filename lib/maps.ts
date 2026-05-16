/**
 * Utilidades de Google Maps API
 */

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Convierte una dirección en coordenadas (lat, lng)
 * Usa Geocoding API
 */
export async function geocodificar(direccion: string): Promise<{ lat: number; lng: number } | null> {
  if (!API_KEY) {
    console.error("Falta GOOGLE_MAPS_API_KEY");
    return null;
  }

  // Agregar "Medellín, Colombia" para mejorar la precisión
  const query = direccion.toLowerCase().includes("medell")
    ? direccion
    : `${direccion}, Medellín, Colombia`;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${API_KEY}&region=co`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    console.warn("Geocoding falló:", data.status, direccion);
    return null;
  } catch (err) {
    console.error("Error en geocoding:", err);
    return null;
  }
}

/**
 * Calcula la distancia entre dos puntos (en km) usando la fórmula de Haversine
 */
export function distanciaKm(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Optimiza el orden de paradas usando algoritmo nearest neighbor
 * Empieza desde el origen y siempre va al punto más cercano
 *
 * Para 30+ paradas, esto es muy bueno y rápido (vs TSP completo que es lento)
 */
export function optimizarRuta<T extends { lat: number; lng: number }>(
  origen: { lat: number; lng: number },
  paradas: T[]
): T[] {
  if (paradas.length === 0) return [];
  if (paradas.length === 1) return paradas;

  const orden: T[] = [];
  const pendientes = [...paradas];
  let actual = origen;

  while (pendientes.length > 0) {
    let mejorIdx = 0;
    let mejorDist = Infinity;

    for (let i = 0; i < pendientes.length; i++) {
      const d = distanciaKm(actual, pendientes[i]);
      if (d < mejorDist) {
        mejorDist = d;
        mejorIdx = i;
      }
    }

    const proximo = pendientes.splice(mejorIdx, 1)[0];
    orden.push(proximo);
    actual = proximo;
  }

  return orden;
}

/**
 * Genera URL de Google Maps con múltiples paradas
 * El motociclista la abre y le da indicaciones de voz
 */
export function urlGoogleMaps(
  paradas: { lat: number; lng: number }[],
  origen?: { lat: number; lng: number }
): string {
  if (paradas.length === 0) return "";

  const ORIGEN_DISTRIPOLLO = origen || { lat: 6.281, lng: -75.567 }; // Aranjuez, Medellín

  // Google Maps Directions URL con múltiples paradas
  // https://developers.google.com/maps/documentation/urls/get-started#directions-action
  const base = "https://www.google.com/maps/dir/?api=1";
  const origin = `&origin=${ORIGEN_DISTRIPOLLO.lat},${ORIGEN_DISTRIPOLLO.lng}`;

  const ultima = paradas[paradas.length - 1];
  const destination = `&destination=${ultima.lat},${ultima.lng}`;

  let waypoints = "";
  if (paradas.length > 1) {
    const intermedias = paradas.slice(0, -1);
    waypoints = `&waypoints=${intermedias.map(p => `${p.lat},${p.lng}`).join("|")}`;
  }

  return `${base}${origin}${destination}${waypoints}&travelmode=driving`;
}

/**
 * Calcula el total de km recorridos en la ruta
 */
export function totalKmRuta(
  origen: { lat: number; lng: number },
  paradas: { lat: number; lng: number }[]
): number {
  if (paradas.length === 0) return 0;

  let total = distanciaKm(origen, paradas[0]);
  for (let i = 1; i < paradas.length; i++) {
    total += distanciaKm(paradas[i - 1], paradas[i]);
  }
  return Math.round(total * 10) / 10;
}

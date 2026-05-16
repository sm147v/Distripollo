"use client";

import { useEffect, useRef, useState } from "react";

export function MapaRuta({ pedidos }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const conCoords = pedidos.filter(p => p.lat && p.lng);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (conCoords.length === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          setLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Error cargando Google Maps");
    document.head.appendChild(script);
  }, [conCoords.length]);

  useEffect(() => {
    if (!loaded || !ref.current || conCoords.length === 0) return;
    if (!window.google || !window.google.maps) return;

    const ORIGEN = { lat: 6.281, lng: -75.567 };

    const map = new window.google.maps.Map(ref.current, {
      zoom: 12,
      center: ORIGEN,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
    });

    new window.google.maps.Marker({
      position: ORIGEN,
      map,
      title: "Distripollo La 94",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#0F1E3F",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 3,
      },
      label: { text: "🐔", fontSize: "18px" },
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(ORIGEN);

    conCoords.forEach((p, i) => {
      const pos = { lat: p.lat, lng: p.lng };
      bounds.extend(pos);
      new window.google.maps.Marker({
        position: pos,
        map,
        title: `${p.ordenEnRuta || i + 1}. ${p.cliente}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#E63946",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 3,
        },
        label: {
          text: String(p.ordenEnRuta || i + 1),
          color: "white",
          fontWeight: "bold",
          fontSize: "12px",
        },
      });
    });

    const ordenadas = [...conCoords].sort((a, b) => (a.ordenEnRuta || 0) - (b.ordenEnRuta || 0));
    const path = [ORIGEN, ...ordenadas.map(p => ({ lat: p.lat, lng: p.lng }))];

    new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#E63946",
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map,
    });

    map.fitBounds(bounds, 50);
  }, [loaded, conCoords]);

  if (error) {
    return (
      <div className="bg-[#FEF2F3] text-[#E63946] p-6 text-center text-sm font-semibold">
        ⚠️ {error}
      </div>
    );
  }

  if (conCoords.length === 0) {
    return (
      <div className="bg-[#FAFAF9] p-6 text-center text-sm text-[#0F1E3F]/60">
        Sin paradas geocodificadas para mostrar en mapa
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={ref} className="w-full h-[400px] bg-[#FAFAF9]" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAF9]">
          <div className="text-sm text-[#0F1E3F]/60 font-semibold">Cargando mapa...</div>
        </div>
      )}
    </div>
  );
}

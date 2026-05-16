"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoPedido } from "../actions";
import { ESTADOS_PEDIDO } from "@/lib/format";

export default function EstadoSelector({ pedidoId, estadoActual }) {
  const [estado, setEstado] = useState(estadoActual);
  const [isPending, startTransition] = useTransition();

  function cambiar(nuevo) {
    if (nuevo === estado) return;
    if (
      ["CANCELADO", "ENTREGADO"].includes(nuevo) &&
      !confirm(`¿Marcar este pedido como ${ESTADOS_PEDIDO[nuevo].label}?`)
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await cambiarEstadoPedido(pedidoId, nuevo);
        setEstado(nuevo);
      } catch (err) {
        alert("Error al cambiar el estado: " + err.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(ESTADOS_PEDIDO).map(([key, info]) => {
        const activo = estado === key;
        return (
          <button
            key={key}
            onClick={() => cambiar(key)}
            disabled={isPending || activo}
            className={`px-3.5 py-2 text-xs uppercase tracking-wider font-medium rounded-lg border-2 transition-all ${
              activo
                ? "bg-[#1D3FA8] text-white border-[#1D3FA8]"
                : "bg-white text-stone-600 border-stone-200 hover:border-[#1D3FA8] hover:text-[#1D3FA8]"
            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
          >
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

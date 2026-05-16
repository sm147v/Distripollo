"use client";

import { useState, useTransition } from "react";
import { actualizarPrecio, toggleProductoActivo } from "./actions";
import { fmtMoney } from "@/lib/format";

export default function FilaProducto({ producto }) {
  const [precio, setPrecio] = useState(String(producto.precio));
  const [precioMayor, setPrecioMayor] = useState(
    producto.precioMayor ? String(producto.precioMayor) : ""
  );
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      try {
        await actualizarPrecio(
          producto.id,
          parseFloat(precio),
          precioMayor ? parseFloat(precioMayor) : null
        );
        setEditando(false);
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  function cancelar() {
    setPrecio(String(producto.precio));
    setPrecioMayor(producto.precioMayor ? String(producto.precioMayor) : "");
    setEditando(false);
  }

  function toggleActivo() {
    if (
      producto.activo &&
      !confirm(`¿Desactivar "${producto.nombre}"? Dejará de mostrarse en el bot.`)
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await toggleProductoActivo(producto.id);
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  return (
    <tr className={producto.activo ? "" : "opacity-50"}>
      <td className="px-6 py-3">
        <div className="text-sm font-medium text-stone-900">{producto.nombre}</div>
        <div className="text-xs text-stone-500">
          {producto.unidad} {!producto.activo && "· Inactivo"}
        </div>
      </td>
      <td className="px-6 py-3">
        <span className="text-xs text-stone-600">{producto.categoria || "—"}</span>
      </td>
      <td className="px-6 py-3">
        {editando ? (
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            min="0"
            step="1"
            className="w-28 px-2 py-1 text-right font-mono text-sm border-2 border-[#1D3FA8] rounded"
            autoFocus
          />
        ) : (
          <span className="font-mono text-sm font-semibold text-[#1D3FA8]">
            {fmtMoney(producto.precio)}
          </span>
        )}
      </td>
      <td className="px-6 py-3">
        {editando ? (
          <input
            type="number"
            value={precioMayor}
            onChange={(e) => setPrecioMayor(e.target.value)}
            min="0"
            step="1"
            placeholder="opcional"
            className="w-28 px-2 py-1 text-right font-mono text-sm border-2 border-stone-300 rounded"
          />
        ) : producto.precioMayor ? (
          <span className="font-mono text-sm text-stone-700">
            {fmtMoney(producto.precioMayor)}
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>
      <td className="px-6 py-3 text-right">
        {editando ? (
          <div className="inline-flex gap-1">
            <button
              onClick={guardar}
              disabled={isPending}
              className="px-3 py-1 text-xs uppercase tracking-wider bg-[#1D3FA8] text-white rounded hover:bg-[#1D3FA8]/90 disabled:opacity-50"
            >
              {isPending ? "..." : "Guardar"}
            </button>
            <button
              onClick={cancelar}
              disabled={isPending}
              className="px-3 py-1 text-xs uppercase tracking-wider bg-white border border-stone-200 text-stone-600 rounded hover:bg-stone-50"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="inline-flex gap-2">
            <button
              onClick={() => setEditando(true)}
              className="text-xs text-[#1D3FA8] hover:underline"
            >
              Editar
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={toggleActivo}
              disabled={isPending}
              className={`text-xs hover:underline ${
                producto.activo ? "text-stone-500" : "text-emerald-600"
              }`}
            >
              {producto.activo ? "Desactivar" : "Activar"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

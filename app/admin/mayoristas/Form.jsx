"use client";

import { useState, useTransition } from "react";
import { crearMayorista, toggleMayoristaActivo } from "./actions";

export function NuevoMayoristaForm() {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await crearMayorista(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        e.target.reset();
        setAbierto(false);
      }
    });
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="px-4 py-2.5 bg-[#1D3FA8] text-white text-sm font-medium rounded-lg hover:bg-[#1D3FA8]/90"
      >
        + Registrar mayorista
      </button>
    );
  }

  return (
    <div className="bg-white border-2 border-[#1D3FA8] rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif text-lg text-[#1D3FA8]">Nuevo mayorista</h3>
        <button
          onClick={() => {
            setAbierto(false);
            setError("");
          }}
          className="text-stone-400 hover:text-stone-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Razón social / Nombre</Label>
          <Input name="razonSocial" required placeholder="Distribuidora Carnes SA" />
        </div>
        <div>
          <Label>Tipo de documento</Label>
          <select
            name="tipoDocumento"
            defaultValue="CC"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#1D3FA8]"
          >
            <option value="CC">Cédula</option>
            <option value="NIT">NIT</option>
            <option value="CE">Cédula extranjería</option>
          </select>
        </div>
        <div>
          <Label>Número documento</Label>
          <Input name="documento" required placeholder="1023456789" />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input name="whatsapp" placeholder="3001234567" />
        </div>
        <div>
          <Label>Email (opcional)</Label>
          <Input name="email" type="email" />
        </div>
        <div className="col-span-2">
          <Label>Dirección</Label>
          <Input name="direccion" />
        </div>
        {error && (
          <div className="col-span-2 px-3 py-2 bg-[#E63946]/10 border border-[#E63946]/30 rounded text-sm text-[#E63946]">
            {error}
          </div>
        )}
        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-[#1D3FA8] text-white text-sm font-medium rounded-lg hover:bg-[#1D3FA8]/90 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Crear mayorista"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ToggleMayoristaBtn({ id, activo }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (
      activo &&
      !confirm("¿Desactivar este mayorista? No podrá hacer pedidos con sus precios especiales.")
    ) {
      return;
    }
    startTransition(async () => {
      await toggleMayoristaActivo(id);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`text-xs hover:underline ${
        activo ? "text-stone-500" : "text-emerald-600"
      }`}
    >
      {isPending ? "..." : activo ? "Desactivar" : "Activar"}
    </button>
  );
}

function Label({ children }) {
  return (
    <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1.5 font-medium">
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#1D3FA8]"
    />
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmtMoney } from "@/lib/format";
import { geocodificarTodos, crearRuta, eliminarRuta, cambiarEstadoRuta } from "./actions";
import { MapaRuta } from "./MapaRuta";

export function RutasClient({ pedidosSinRuta, rutas, zonas, fechaFiltro, stats }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seleccionados, setSeleccionados] = useState([]);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nombreRuta, setNombreRuta] = useState("");
  const [zonaSel, setZonaSel] = useState("");
  const [motorizado, setMotorizado] = useState("");
  const [msg, setMsg] = useState("");

  const seleccionadosData = pedidosSinRuta.filter(p => seleccionados.includes(p.id));
  const totalSeleccionado = seleccionadosData.reduce((s, p) => s + p.total, 0);
  const todosTienenCoords = seleccionadosData.every(p => p.tieneCoords);

  function toggleSeleccion(id) {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function seleccionarTodosConCoords() {
    setSeleccionados(pedidosSinRuta.filter(p => p.tieneCoords).map(p => p.id));
  }

  async function handleGeocodificar() {
    setMsg("Geocodificando direcciones...");
    startTransition(async () => {
      try {
        const r = await geocodificarTodos();
        setMsg(`✅ ${r.exitosos} de ${r.procesados} geocodificados`);
        router.refresh();
        setTimeout(() => setMsg(""), 4000);
      } catch (err) {
        setMsg("❌ Error: " + err.message);
      }
    });
  }

  async function handleCrearRuta(e) {
    e.preventDefault();
    if (seleccionados.length === 0) return alert("Selecciona pedidos");
    if (!todosTienenCoords) return alert("Algunos pedidos no tienen coordenadas. Geocodifícalos primero.");

    const fd = new FormData();
    fd.set("nombre", nombreRuta);
    fd.set("fecha", fechaFiltro);
    fd.set("zonaId", zonaSel);
    fd.set("motorizado", motorizado);
    fd.set("pedidoIds", seleccionados.join(","));

    startTransition(async () => {
      try {
        await crearRuta(fd);
        setMsg("✅ Ruta creada con orden optimizado");
        setSeleccionados([]);
        setMostrarCrear(false);
        setNombreRuta(""); setZonaSel(""); setMotorizado("");
        router.refresh();
        setTimeout(() => setMsg(""), 4000);
      } catch (err) {
        setMsg("❌ " + err.message);
      }
    });
  }

  async function handleEliminar(rutaId) {
    if (!confirm("¿Eliminar esta ruta? Los pedidos volverán a estar sin asignar.")) return;
    const fd = new FormData();
    fd.set("id", rutaId);
    startTransition(async () => {
      await eliminarRuta(fd);
      router.refresh();
    });
  }

  async function handleEstado(rutaId, estado) {
    const fd = new FormData();
    fd.set("id", rutaId);
    fd.set("estado", estado);
    startTransition(async () => {
      await cambiarEstadoRuta(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="bg-[#FFC72C]/20 border border-[#FFC72C]/40 text-[#0F1E3F] px-4 py-3 rounded-xl font-semibold text-sm">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-4">
          <div className="text-[0.7rem] text-[#0F1E3F]/60 font-bold uppercase tracking-wider mb-1">Sin asignar</div>
          <div className="font-serif font-extrabold text-3xl text-[#0F1E3F]">{pedidosSinRuta.length}</div>
        </div>
        <div className="bg-[#E3E8F5] border border-[#1D3FA8]/20 rounded-2xl p-4">
          <div className="text-[0.7rem] text-[#1D3FA8] font-bold uppercase tracking-wider mb-1">Con coords ✓</div>
          <div className="font-serif font-extrabold text-3xl text-[#1D3FA8]">{stats.conCoords}</div>
        </div>
        <div className="bg-[#FEF2F3] border border-[#E63946]/20 rounded-2xl p-4">
          <div className="text-[0.7rem] text-[#E63946] font-bold uppercase tracking-wider mb-1">Sin coords</div>
          <div className="font-serif font-extrabold text-3xl text-[#E63946]">{stats.sinCoords}</div>
        </div>
        <div className="bg-[#FFFAEB] border border-[#FFC72C]/40 rounded-2xl p-4">
          <div className="text-[0.7rem] text-[#0F1E3F] font-bold uppercase tracking-wider mb-1">Rutas hoy</div>
          <div className="font-serif font-extrabold text-3xl text-[#0F1E3F]">{stats.totalRutas}</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="date"
          defaultValue={fechaFiltro}
          onChange={(e) => router.push(`/admin/rutas?fecha=${e.target.value}`)}
          className="px-4 py-2.5 rounded-full border border-[#E8E8E4] bg-white font-mono text-sm focus:border-[#E63946] focus:outline-none"
        />
        {stats.sinCoords > 0 && (
          <button onClick={handleGeocodificar} disabled={pending} className="px-5 py-2.5 bg-[#1D3FA8] text-white font-semibold rounded-full hover:bg-[#15307D] transition disabled:opacity-50 text-sm">
            📍 Geocodificar {stats.sinCoords} pendientes
          </button>
        )}
        <button onClick={seleccionarTodosConCoords} className="px-5 py-2.5 bg-white text-[#0F1E3F] font-semibold rounded-full border border-[#E8E8E4] hover:bg-[#FAFAF9] transition text-sm">
          ✓ Seleccionar todos con coords ({stats.conCoords})
        </button>
        {seleccionados.length > 0 && (
          <button onClick={() => setMostrarCrear(true)} className="px-5 py-2.5 bg-[#E63946] text-white font-semibold rounded-full hover:bg-[#C72D3B] transition text-sm shadow-lg shadow-red-200">
            🚚 Crear ruta ({seleccionados.length} pedidos · {fmtMoney(totalSeleccionado)})
          </button>
        )}
      </div>

      {mostrarCrear && (
        <form onSubmit={handleCrearRuta} className="bg-[#0F1E3F] text-white rounded-3xl p-6 shadow-2xl">
          <h3 className="font-serif text-2xl mb-4 text-white">Nueva ruta</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FFC72C] mb-2">Nombre</label>
              <input value={nombreRuta} onChange={(e) => setNombreRuta(e.target.value)} required placeholder="Ej: Ruta Norte" className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FFC72C] mb-2">Zona (opcional)</label>
              <select value={zonaSel} onChange={(e) => setZonaSel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:bg-white/20 focus:outline-none">
                <option value="" className="text-black">Sin zona</option>
                {zonas.map(z => (<option key={z.id} value={z.id} className="text-black">{z.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FFC72C] mb-2">Motorizado</label>
              <input value={motorizado} onChange={(e) => setMotorizado(e.target.value)} placeholder="Nombre del repartidor" className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="px-6 py-3 bg-[#E63946] text-white font-bold rounded-full hover:bg-[#C72D3B] transition disabled:opacity-50">
              {pending ? "Optimizando..." : "Crear y optimizar ruta →"}
            </button>
            <button type="button" onClick={() => setMostrarCrear(false)} className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
        <div>
          <h2 className="font-serif text-xl text-[#0F1E3F] mb-3">
            Pedidos sin asignar <span className="font-mono text-sm text-[#0F1E3F]/50 ml-2">({pedidosSinRuta.length})</span>
          </h2>
          {pedidosSinRuta.length === 0 ? (
            <div className="bg-white border border-[#E8E8E4] rounded-2xl p-8 text-center text-[#0F1E3F]/60 text-sm">
              ✨ ¡Todos los pedidos están asignados!
            </div>
          ) : (
            <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2">
              {pedidosSinRuta.map(p => (
                <label key={p.id} className={`block cursor-pointer bg-white border-2 rounded-2xl p-4 transition ${seleccionados.includes(p.id) ? "border-[#E63946] bg-[#FEF2F3] shadow-md" : "border-[#E8E8E4] hover:border-[#E63946]/30"}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={seleccionados.includes(p.id)} onChange={() => toggleSeleccion(p.id)} disabled={!p.tieneCoords} className="mt-1 w-5 h-5 accent-[#E63946]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#E63946]">{p.numero}</span>
                        {p.zona && (<span className="text-[0.6rem] font-bold uppercase tracking-wider bg-[#1D3FA8] text-white px-2 py-0.5 rounded-full">{p.zona}</span>)}
                        {!p.tieneCoords ? (
                          <span className="text-[0.6rem] font-bold uppercase tracking-wider bg-[#FEF2F3] text-[#E63946] px-2 py-0.5 rounded-full">⚠ Sin coords</span>
                        ) : (
                          <span className="text-[0.6rem] font-bold uppercase tracking-wider bg-[#D4F1DD] text-[#0F4F2A] px-2 py-0.5 rounded-full">✓ Geocoded</span>
                        )}
                      </div>
                      <div className="font-serif font-bold text-[#0F1E3F] text-sm leading-tight mb-1">{p.cliente}</div>
                      <div className="text-xs text-[#0F1E3F]/60 mb-1 line-clamp-1">📍 {p.direccion}</div>
                      <div className="font-mono font-bold text-sm text-[#E63946]">{fmtMoney(p.total)}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl text-[#0F1E3F] mb-3">
            Rutas del día <span className="font-mono text-sm text-[#0F1E3F]/50 ml-2">({rutas.length})</span>
          </h2>
          {rutas.length === 0 ? (
            <div className="bg-white border border-[#E8E8E4] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3 opacity-30">🚚</div>
              <p className="text-[#0F1E3F]/60 text-sm mb-2">No hay rutas para esta fecha</p>
              <p className="text-xs text-[#0F1E3F]/40">Selecciona pedidos y crea una ruta nueva</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rutas.map(r => (<RutaCard key={r.id} ruta={r} onEliminar={handleEliminar} onEstado={handleEstado} />))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RutaCard({ ruta, onEliminar, onEstado }) {
  const [expandido, setExpandido] = useState(false);
  const estados = {
    PENDIENTE: { color: "bg-[#1D3FA8] text-white", label: "Pendiente" },
    EN_CURSO: { color: "bg-[#FFC72C] text-[#0F1E3F]", label: "En curso" },
    COMPLETADA: { color: "bg-[#D4F1DD] text-[#0F4F2A]", label: "Completada" },
  };
  const e = estados[ruta.estado] || estados.PENDIENTE;

  return (
    <div className="bg-white border border-[#E8E8E4] rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 bg-gradient-to-br from-white to-[#FAFAF9]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${e.color}`}>{e.label}</span>
              {ruta.zona && (<span className="text-[0.65rem] font-bold uppercase tracking-wider bg-[#0F1E3F] text-white px-2.5 py-1 rounded-full">📍 {ruta.zona}</span>)}
            </div>
            <h3 className="font-serif font-bold text-xl text-[#0F1E3F] leading-tight">{ruta.nombre}</h3>
            {ruta.motorizado && (<p className="text-xs text-[#0F1E3F]/60 mt-1">🛵 {ruta.motorizado}</p>)}
          </div>
          <button onClick={() => onEliminar(ruta.id)} className="text-[#E63946] hover:bg-[#FEF2F3] p-1.5 rounded-full transition" title="Eliminar">🗑️</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-[#E8E8E4]">
          <div>
            <div className="text-[0.65rem] text-[#0F1E3F]/60 font-bold uppercase tracking-wider">Paradas</div>
            <div className="font-mono font-extrabold text-xl text-[#0F1E3F]">{ruta.totalPedidos}</div>
          </div>
          <div>
            <div className="text-[0.65rem] text-[#0F1E3F]/60 font-bold uppercase tracking-wider">Total</div>
            <div className="font-mono font-extrabold text-xl text-[#E63946]">{fmtMoney(ruta.totalDinero)}</div>
          </div>
          <div>
            <div className="text-[0.65rem] text-[#0F1E3F]/60 font-bold uppercase tracking-wider">Pedidos</div>
            <div className="font-mono font-extrabold text-xl text-[#1D3FA8]">{ruta.pedidos.length}</div>
          </div>
        </div>
        {ruta.urlGoogleMaps && (
          <a href={ruta.urlGoogleMaps} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] hover:bg-[#1FAE52] text-white text-center font-bold py-3 rounded-full transition mb-2">
            🗺️ Abrir ruta en Google Maps
          </a>
        )}
        <div className="flex gap-2">
          <button onClick={() => setExpandido(!expandido)} className="flex-1 bg-white border border-[#E8E8E4] hover:bg-[#FAFAF9] text-[#0F1E3F] font-semibold py-2.5 rounded-full transition text-sm">
            {expandido ? "Ocultar paradas ↑" : `Ver ${ruta.pedidos.length} paradas ↓`}
          </button>
          {ruta.estado === "PENDIENTE" && (<button onClick={() => onEstado(ruta.id, "EN_CURSO")} className="px-4 py-2.5 bg-[#FFC72C] text-[#0F1E3F] font-bold rounded-full hover:bg-[#FFD75F] transition text-sm">Iniciar</button>)}
          {ruta.estado === "EN_CURSO" && (<button onClick={() => onEstado(ruta.id, "COMPLETADA")} className="px-4 py-2.5 bg-[#D4F1DD] text-[#0F4F2A] font-bold rounded-full hover:bg-[#A8E6BD] transition text-sm">Completar</button>)}
        </div>
      </div>
      {expandido && (
        <div className="border-t border-[#E8E8E4]">
          <MapaRuta pedidos={ruta.pedidos} />
          <div className="p-5 space-y-2">
            {ruta.pedidos.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center font-extrabold text-sm shrink-0">{p.ordenEnRuta || i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif font-bold text-sm text-[#0F1E3F] leading-tight">{p.cliente}</div>
                  <div className="text-xs text-[#0F1E3F]/60 line-clamp-1">📍 {p.direccion}</div>
                </div>
                <div className="font-mono font-bold text-sm text-[#E63946] shrink-0">{fmtMoney(p.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

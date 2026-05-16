"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "./ProductCard";

type Producto = {
  id: number; nombre: string; precio: number; unidad: string;
  categoria?: string; imagen?: string;
};

export function ProductosClient({ productos, categorias }: { productos: Producto[]; categorias: string[] }) {
  const searchParams = useSearchParams();
  const catFromUrl = searchParams.get("cat");
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(catFromUrl);

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchCat = !filtroCategoria || p.categoria === filtroCategoria;
      const matchSearch = !search.trim() || p.nombre.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, filtroCategoria, search]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-xl">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-5 py-3.5 rounded-full border border-[#E8E8E4] focus:border-[#E63946] focus:outline-none focus:ring-4 focus:ring-[#E63946]/10 text-base bg-white"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-10 flex-wrap">
        <FilterBtn active={!filtroCategoria} onClick={() => setFiltroCategoria(null)}>
          Todas <span className="font-mono text-[0.7rem] opacity-60 ml-1">{productos.length}</span>
        </FilterBtn>
        {categorias.map(c => {
          const count = productos.filter(p => p.categoria === c).length;
          return (
            <FilterBtn key={c} active={filtroCategoria === c} onClick={() => setFiltroCategoria(c)}>
              {c} <span className="font-mono text-[0.7rem] opacity-60 ml-1">{count}</span>
            </FilterBtn>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#0F1E3F]/60">
          <span className="font-mono font-semibold text-[#0F1E3F]">{filtered.length}</span> producto{filtered.length !== 1 ? "s" : ""}
          {filtroCategoria && <> · <span className="text-[#E63946] font-semibold">{filtroCategoria}</span></>}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filtered.map(p => <ProductCard key={p.id} producto={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E8E4]">
          <div className="text-6xl mb-4 opacity-40">🔍</div>
          <p className="font-serif text-2xl text-[#0F1E3F] mb-2">Sin resultados</p>
          <p className="text-sm text-[#0F1E3F]/60 mb-4">No encontramos productos con esos criterios.</p>
          <button
            onClick={() => { setSearch(""); setFiltroCategoria(null); }}
            className="text-[#E63946] font-semibold hover:underline"
          >
            Limpiar filtros →
          </button>
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
        active
          ? "bg-[#0F1E3F] text-white shadow-lg"
          : "bg-white text-[#0F1E3F] hover:bg-[#FAFAF9] border border-[#E8E8E4]"
      }`}
    >
      {children}
    </button>
  );
}

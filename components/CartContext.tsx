"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CartItem = {
  id: number;
  nombre: string;
  precio: number;
  unidad: string;
  cantidad: number;
  imagen?: string;
  categoria?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  updateCantidad: (id: number, cantidad: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("dp-cart") : null;
    if (saved) { try { setItems(JSON.parse(saved)); } catch {} }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("dp-cart", JSON.stringify(items));
  }, [items, loaded]);

  function addItem(item: Omit<CartItem, "cantidad">, cantidad = 1) {
    setItems(prev => {
      const e = prev.find(i => i.id === item.id);
      if (e) return prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      return [...prev, { ...item, cantidad }];
    });
  }

  function updateCantidad(id: number, cantidad: number) {
    if (cantidad <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
  }

  function removeItem(id: number) { setItems(prev => prev.filter(i => i.id !== id)); }
  function clear() { setItems([]); }

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateCantidad, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe estar dentro de CartProvider");
  return ctx;
}

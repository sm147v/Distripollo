"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Inicio", icon: "◐" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "▤" },
  { href: "/admin/rutas", label: "Rutas", icon: "▶" },
  { href: "/admin/productos", label: "Productos", icon: "⬢" },
  { href: "/admin/mayoristas", label: "Mayoristas", icon: "◇" },
  { href: "/admin/clientes", label: "Clientes", icon: "○" },
  { href: "/admin/reportes", label: "Reportes", icon: "△" },
];

export default function Sidebar({ usuario }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-[#0F1E3F] text-white flex flex-col h-screen sticky top-0">
      {/* Header / logo */}
      <div className="px-6 py-7 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FFC72C] rounded-full flex items-center justify-center text-lg">
            🐔
          </div>
          <div>
            <div className="font-serif text-xl leading-tight">Distripollo</div>
            <div className="text-[10px] tracking-[0.25em] text-[#FFC72C]/80 uppercase">
              La 94
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                active
                  ? "bg-[#1D3FA8] text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`text-base ${active ? "text-[#FFC72C]" : ""}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="px-3 py-2 mb-2">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
            Sesión
          </div>
          <div className="text-sm font-medium truncate">{usuario.nombre}</div>
          <div className="text-xs text-white/50 truncate">{usuario.email}</div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-white/60 hover:bg-[#E63946]/20 hover:text-[#E63946] rounded-md transition-colors"
        >
          ↪ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

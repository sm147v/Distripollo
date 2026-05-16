"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar al servidor");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FBF9F4]">
      {/* PANEL IZQUIERDO - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1D3FA8]">
        {/* Trama decorativa */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #FFC72C 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Bandera diagonal amarilla */}
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-[#FFC72C] rotate-45 opacity-90" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-[#E63946] rounded-full opacity-80" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div>
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#FFC72C] rounded-full flex items-center justify-center text-2xl">
                🐔
              </div>
              <div>
                <div className="font-serif text-3xl leading-tight tracking-tight">
                  Distripollo
                </div>
                <div className="text-xs tracking-[0.3em] text-[#FFC72C] uppercase">
                  La 94 · Medellín
                </div>
              </div>
            </div>
          </div>

          <div>
            <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05] mb-6 tracking-tight">
              Panel<br />
              <span className="italic text-[#FFC72C]">administrativo</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              Pedidos, productos, mayoristas y reportes — todo en un solo lugar.
            </p>
          </div>

          <div className="text-xs text-white/40 tracking-wider uppercase">
            v1.0 · Distripollo La 94 S.A.S. · NIT 901213966-2
          </div>
        </div>
      </div>

      {/* PANEL DERECHO - FORMULARIO */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-[#E63946] rounded-full flex items-center justify-center text-xl">
                🐔
              </div>
              <div className="font-serif text-2xl text-[#1D3FA8]">Distripollo</div>
            </div>
          </div>

          <div className="mb-10">
            <div className="text-xs tracking-[0.3em] uppercase text-[#E63946] mb-3 font-medium">
              Iniciar sesión
            </div>
            <h2 className="font-serif text-4xl text-[#1D3FA8] leading-tight">
              Bienvenida<br />
              <span className="italic">de vuelta</span>.
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-medium"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1D3FA8] transition-colors"
                placeholder="valentina@distripollo.co"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-medium"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1D3FA8] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg text-sm text-[#E63946]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1D3FA8] text-white font-medium rounded-lg hover:bg-[#1D3FA8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Verificando..." : "Entrar al panel"}
            </button>
          </form>

          <p className="text-xs text-stone-400 mt-8 text-center">
            ¿Olvidaste tu contraseña? Pídela al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

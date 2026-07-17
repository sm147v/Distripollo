import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Sin fallback a propósito: si ADMIN_JWT_SECRET no está definido, lanza. No
 * validamos cookies contra una llave conocida escrita en el repo. Lazy para no
 * romper el import; falla al primer request a /admin sin secreto configurado.
 */
function getSecret() {
  const raw = process.env.ADMIN_JWT_SECRET;
  if (!raw) {
    throw new Error(
      "ADMIN_JWT_SECRET no está definido. El middleware de /admin no valida " +
        "sesiones sin un secreto propio. Defínelo en las variables de entorno."
    );
  }
  return new TextEncoder().encode(raw);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Solo proteger /admin/*
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};

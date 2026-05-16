/**
 * 🔐 AUTENTICACIÓN PARA EL PANEL ADMIN
 *
 * Sistema simple y robusto:
 *  - Login con email + password
 *  - bcrypt para hashear passwords
 *  - JWT firmado guardado en cookie HttpOnly
 *  - Verificación en cada request del panel admin
 *
 * No usamos NextAuth porque para una sola empresa es matar moscas a cañonazos.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "cambia-este-secreto-en-produccion-distripollo-94"
);
const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 días

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(usuario) {
  const token = await new SignJWT({
    sub: String(usuario.id),
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    empresaId: usuario.empresaId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: Number(payload.sub),
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      empresaId: payload.empresaId,
    };
  } catch {
    return null;
  }
}

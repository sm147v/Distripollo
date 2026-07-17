/**
 * 🔐 AUTENTICACIÓN AISLADA DEL SUPER-ADMIN (nivel plataforma)
 *
 * DELIBERADAMENTE separada de lib/auth.js (auth de ADMIN de empresa). Todo el
 * aislamiento del sistema multi-tenant se sostiene sobre esta separación:
 *
 *  - Secreto PROPIO: SUPERADMIN_AUTH_SECRET, generado aparte, SIN fallback.
 *  - Cookie PROPIA: `superadmin_session` (distinta de `admin_session`).
 *  - Claims iss/aud propios y verificados (defensa en profundidad).
 *
 * INVARIANTE DE AISLAMIENTO (lo prueba superadmin-auth.check.ts):
 *   Un token de empresa (`admin_session`, firmado con ADMIN_JWT_SECRET) NO
 *   verifica aquí, porque la llave es distinta. Un `rol:"SUPERADMIN"` forjado
 *   dentro de un token de empresa es inútil: sigue siendo la llave equivocada.
 *   El rol no da acceso — la llave sí, y el ADMIN de empresa no la tiene.
 *
 * Sin impersonación en esta fase: este módulo solo autentica al super-admin
 * como sí mismo. Actuar-como-empresa es otra fase, con su propia auditoría.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "superadmin_session";
// Privilegio máximo ⇒ sesión corta. 8h en vez de los 7 días del admin de empresa.
const SESSION_DURATION = 60 * 60 * 8;
const ISSUER = "distripollo:superadmin";
const AUDIENCE = "distripollo:superadmin";

/**
 * Lee el secreto EN CADA USO. Sin fallback a propósito: si falta (o es débil),
 * lanza. Preferimos caer ruidoso a firmar sesiones de super-admin con una
 * llave conocida. Se lee lazy (no en import) para no romper el build cuando el
 * env var aún no está desplegado; falla en el instante en que se usa la auth.
 */
function getSecret() {
  const raw = process.env.SUPERADMIN_AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "SUPERADMIN_AUTH_SECRET no está definido o es demasiado corto (mín. 32 chars). " +
        "La auth del super-admin NO opera sin un secreto fuerte y propio. " +
        "Sin fallback a propósito: no firmamos sesiones con una llave conocida."
    );
  }
  return new TextEncoder().encode(raw);
}

export async function hashPassword(plain) {
  // Coste 12 para el super-admin (el admin de empresa usa 10).
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * PURA: firma un token de super-admin. No toca cookies ⇒ testeable sin request.
 */
export async function signSuperadminToken(superadmin) {
  return new SignJWT({
    email: superadmin.email,
    nombre: superadmin.nombre,
    rol: "SUPERADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(superadmin.id))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

/**
 * PURA: verifica un token. Devuelve la sesión o null. Testeable sin request.
 * Verifica firma + issuer + audience + algoritmo + rol. Cualquier fallo ⇒ null.
 */
export async function verifySuperadminToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (payload.rol !== "SUPERADMIN") return null;
    return {
      id: Number(payload.sub),
      email: payload.email,
      nombre: payload.nombre,
      rol: "SUPERADMIN",
    };
  } catch {
    return null;
  }
}

export async function createSuperadminSession(superadmin) {
  const token = await signSuperadminToken(superadmin);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function destroySuperadminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Lee la sesión de super-admin de la cookie. null si no hay o es inválida. */
export async function getSuperadminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySuperadminToken(token);
}

/**
 * Guard server-side para layouts/páginas/acciones bajo /superadmin.
 * Un ADMIN de empresa nunca lo pasa: su cookie es `admin_session`, no
 * `superadmin_session`, y aunque falsifique una, no tiene la llave para firmarla.
 */
export async function requireSuperadmin() {
  const sesion = await getSuperadminSession();
  if (!sesion) {
    redirect("/superadmin/login");
  }
  return sesion;
}

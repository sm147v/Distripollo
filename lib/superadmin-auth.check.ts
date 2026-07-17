/**
 * ✅ INVARIANTE DE AISLAMIENTO — Fase 1 (a)
 *
 * Demuestra que un ADMIN de empresa NO puede abrir una sesión de super-admin,
 * ni siquiera falsificando su propio token. El aislamiento es criptográfico:
 * las rutas /superadmin verifican SOLO contra SUPERADMIN_AUTH_SECRET, y el
 * ADMIN de empresa firma con ADMIN_JWT_SECRET — otra llave.
 *
 * Corre con:  node --import tsx --test lib/superadmin-auth.check.ts
 * (mismo mecanismo que las invariantes de nómina: tsx + node:test, sin jest/vitest)
 *
 * Los secretos de test se fijan ANTES de ejercer la auth. El módulo lee el
 * secreto lazy (en cada uso), así que basta con tenerlos puestos al llamar.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

const SUPERADMIN_SECRET = "test-superadmin-secret-fuerte-y-distinto-000000000";
const ADMIN_SECRET = "test-admin-secret-completamente-distinto-1111111111";

process.env.SUPERADMIN_AUTH_SECRET = SUPERADMIN_SECRET;
process.env.ADMIN_JWT_SECRET = ADMIN_SECRET;

import {
  signSuperadminToken,
  verifySuperadminToken,
} from "./superadmin-auth.js";

/**
 * Falsifica un token EXACTAMENTE como lo emite lib/auth.createSession para un
 * ADMIN de empresa: firmado con ADMIN_JWT_SECRET, HS256, sin iss/aud.
 * Este es el "adversario": una sesión de empresa presentada a la puerta del super-admin.
 */
async function tokenDeAdminDeEmpresa(rol: string = "ADMIN"): Promise<string> {
  return new SignJWT({
    sub: "7",
    email: "admin@empresa-cliente.com",
    nombre: "Admin de Empresa",
    rol,
    empresaId: 3,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(ADMIN_SECRET));
}

test("un token de ADMIN de empresa NO abre sesión de super-admin", async () => {
  const token = await tokenDeAdminDeEmpresa("ADMIN");
  assert.equal(await verifySuperadminToken(token), null);
});

test("un ADMIN con rol:'SUPERADMIN' forjado sigue afuera (la llave es la equivocada)", async () => {
  // El ADMIN intenta escalar poniéndose el rol de super-admin en SU token.
  const tokenForjado = await tokenDeAdminDeEmpresa("SUPERADMIN");
  assert.equal(await verifySuperadminToken(tokenForjado), null);
});

test("token firmado con el secreto correcto pero SIN iss/aud de super-admin → rechazado", async () => {
  // Defensa en profundidad: aunque por catástrofe se filtrara/compartiera el
  // secreto, sin los claims iss+aud correctos no verifica.
  const tokenSinClaims = await new SignJWT({ rol: "SUPERADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("1")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(SUPERADMIN_SECRET));
  assert.equal(await verifySuperadminToken(tokenSinClaims), null);
});

test("un token LEGÍTIMO de super-admin sí abre sesión", async () => {
  const token = await signSuperadminToken({
    id: 1,
    email: "root@distripollo.co",
    nombre: "Super Admin",
  });
  const sesion = await verifySuperadminToken(token);
  assert.ok(sesion, "debería devolver una sesión, no null");
  assert.equal(sesion!.id, 1);
  assert.equal(sesion!.rol, "SUPERADMIN");
  assert.equal(sesion!.email, "root@distripollo.co");
});

test("sin SUPERADMIN_AUTH_SECRET, firmar LANZA (sin fallback silencioso)", async () => {
  const guardado = process.env.SUPERADMIN_AUTH_SECRET;
  delete process.env.SUPERADMIN_AUTH_SECRET;
  try {
    await assert.rejects(
      () => signSuperadminToken({ id: 1, email: "x@y.co", nombre: "X" }),
      /SUPERADMIN_AUTH_SECRET no está definido/
    );
  } finally {
    process.env.SUPERADMIN_AUTH_SECRET = guardado;
  }
});

test("un secreto demasiado corto también LANZA (no se acepta llave débil)", async () => {
  const guardado = process.env.SUPERADMIN_AUTH_SECRET;
  process.env.SUPERADMIN_AUTH_SECRET = "corto";
  try {
    await assert.rejects(
      () => signSuperadminToken({ id: 1, email: "x@y.co", nombre: "X" }),
      /demasiado corto/
    );
  } finally {
    process.env.SUPERADMIN_AUTH_SECRET = guardado;
  }
});

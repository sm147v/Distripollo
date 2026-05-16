"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const sesion = await getSession();
  if (!sesion) throw new Error("No autenticado");
  return sesion;
}

export async function crearMayorista(formData) {
  const sesion = await requireAuth();

  const razonSocial = String(formData.get("razonSocial") || "").trim();
  const documento = String(formData.get("documento") || "").replace(/\D/g, "");
  const tipoDocumento = String(formData.get("tipoDocumento") || "CC");
  const whatsapp = String(formData.get("whatsapp") || "").replace(/\D/g, "");
  const direccion = String(formData.get("direccion") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!razonSocial) return { error: "El nombre/razón social es obligatorio" };
  if (!documento) return { error: "El documento es obligatorio" };
  if (documento.length < 6) return { error: "Documento muy corto" };

  // Verificar duplicado
  const existente = await prisma.mayorista.findUnique({
    where: {
      empresaId_documento: { empresaId: sesion.empresaId, documento },
    },
  });
  if (existente) {
    return { error: "Ya existe un mayorista con ese documento" };
  }

  await prisma.mayorista.create({
    data: {
      empresaId: sesion.empresaId,
      razonSocial,
      documento,
      tipoDocumento,
      whatsapp: whatsapp || null,
      direccion: direccion || null,
      email: email || null,
      activo: true,
    },
  });

  revalidatePath("/admin/mayoristas");
  return { ok: true };
}

export async function toggleMayoristaActivo(id) {
  const sesion = await requireAuth();
  const m = await prisma.mayorista.findUnique({ where: { id } });
  if (!m || m.empresaId !== sesion.empresaId) {
    throw new Error("Mayorista no encontrado");
  }
  await prisma.mayorista.update({
    where: { id },
    data: { activo: !m.activo },
  });
  revalidatePath("/admin/mayoristas");
}

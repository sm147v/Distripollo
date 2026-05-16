/**
 * 🔑 Script para crear el primer usuario admin.
 *
 * Uso:
 *   node scripts/crear-admin.js <email> <password> "<nombre>"
 *
 * Ejemplo:
 *   node scripts/crear-admin.js valentina@distripollo.co miClave123 "Valentina Bedoya"
 *
 * Si el usuario ya existe, actualiza su password.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, nombre] = process.argv;

  if (!email || !password || !nombre) {
    console.error("❌ Faltan argumentos.");
    console.error("Uso: node scripts/crear-admin.js <email> <password> \"<nombre completo>\"");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ La contraseña debe tener al menos 6 caracteres.");
    process.exit(1);
  }

  const empresa = await prisma.empresa.findUnique({
    where: { slug: "distripollo" },
  });

  if (!empresa) {
    console.error("❌ No se encontró la empresa 'distripollo'. Corré primero `npm run db:seed`.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const existente = await prisma.usuario.findUnique({ where: { email } });

  if (existente) {
    await prisma.usuario.update({
      where: { email },
      data: { password: hash, nombre, rol: "ADMIN" },
    });
    console.log(`✅ Password actualizado para ${email}`);
  } else {
    await prisma.usuario.create({
      data: {
        email,
        password: hash,
        nombre,
        rol: "ADMIN",
        empresaId: empresa.id,
      },
    });
    console.log(`✅ Admin creado: ${email}`);
  }

  console.log(`\n📋 Datos de login:`);
  console.log(`   URL: http://localhost:3000/login`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

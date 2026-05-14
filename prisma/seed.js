const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODUCTOS = [
  // PRODUCTOS CAMPESINOS
  { categoria: "Campesinos", nombre: "Pechuga campesina entera", precio: 17000, precioMayor: 15200, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Contramuslo campesino", precio: 14400, precioMayor: 13200, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Muslo campesino", precio: 13200, precioMayor: 12600, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Pernil campesino", precio: 9500, precioMayor: 7800, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Ala con costillar", precio: 9000, precioMayor: 8500, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Ala sin costillar", precio: 12200, precioMayor: 11900, unidad: "kg" },
  { categoria: "Campesinos", nombre: "Pollo entero x100", precio: 11200, precioMayor: 10200, unidad: "und" },
  { categoria: "Campesinos", nombre: "Gallina Bucanero x1000", precio: 9438, precioMayor: 9060, unidad: "und" },
  { categoria: "Campesinos", nombre: "Pechuga deshuesada Bucanero", precio: 16800, precioMayor: 16000, unidad: "kg" },

  // PRODUCTOS CONGELADOS BUCANERO
  { categoria: "Congelados Bucanero", nombre: "Pechuga x1", precio: 13000, precioMayor: 12540, unidad: "und" },
  { categoria: "Congelados Bucanero", nombre: "Pechuga x2", precio: 13000, precioMayor: 12540, unidad: "und" },
  { categoria: "Congelados Bucanero", nombre: "Pechuga blanca", precio: 15000, precioMayor: 14460, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Contramuslo blanco", precio: 7813, precioMayor: 7500, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Muslo blanco", precio: 9438, precioMayor: 9060, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Ala blanca", precio: 10625, precioMayor: 10200, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Grasa de pechuga", precio: 1000, precioMayor: 960, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Hueso de pechuga", precio: 1000, precioMayor: 960, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Chorizo x10 de Bucanero", precio: 15674, precioMayor: 15047, unidad: "paq" },
  { categoria: "Congelados Bucanero", nombre: "Alitas BBQ", precio: 22659, precioMayor: 21752, unidad: "und" },
  { categoria: "Congelados Bucanero", nombre: "Alitas picantes", precio: 22659, precioMayor: 21752, unidad: "und" },
  { categoria: "Congelados Bucanero", nombre: "Chuzo x10 und Bucanero", precio: 74732, precioMayor: 71742, unidad: "paq" },
  { categoria: "Congelados Bucanero", nombre: "Minichuzo Bucanero x6", precio: 29765, precioMayor: 28575, unidad: "paq" },
  { categoria: "Congelados Bucanero", nombre: "Recorte con pechuga", precio: 6875, precioMayor: 6600, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Mollejas Bucanero", precio: 8688, precioMayor: 8340, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Corazón de Bucanero", precio: 7063, precioMayor: 6780, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Hígado de Bucanero", precio: 3813, precioMayor: 3660, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Menudencia de Bucanero", precio: 7500, precioMayor: 7200, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Menudencia de pollo COA", precio: 5125, precioMayor: 4920, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Moliexpres", precio: 5140, precioMayor: 4934, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Surtido de Bucanero", precio: 5063, precioMayor: 4860, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Entremuslo x6", precio: 10063, precioMayor: 9660, unidad: "paq" },
  { categoria: "Congelados Bucanero", nombre: "Muslo x6 Bucanero", precio: 11313, precioMayor: 10860, unidad: "paq" },
  { categoria: "Congelados Bucanero", nombre: "Presas de pollo", precio: 14688, precioMayor: 14100, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Patas y pescuezos Bucanero", precio: 3563, precioMayor: 3420, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Caja de pernil Bucanero", precio: 25625, precioMayor: 24600, unidad: "caja" },
  { categoria: "Congelados Bucanero", nombre: "Recorte en bolsa", precio: 2500, precioMayor: 2500, unidad: "kg" },
  { categoria: "Congelados Bucanero", nombre: "Patas solas pollo COA", precio: 4750, precioMayor: 4560, unidad: "kg" },

  // CARNES FRÍAS
  { categoria: "Carnes Frías", nombre: "Salchichón mix de pollo y cerdo x1000", precio: 11097, precioMayor: 10653, unidad: "und" },
  { categoria: "Carnes Frías", nombre: "Salchichón de pollo cervecero x750", precio: 11097, precioMayor: 10653, unidad: "und" },
  { categoria: "Carnes Frías", nombre: "Salchichón de pollo x750", precio: 8978, precioMayor: 8618, unidad: "und" },
  { categoria: "Carnes Frías", nombre: "Salchicha manguera", precio: 8434, precioMayor: 8097, unidad: "und" },

  // PESCADO
  { categoria: "Pescado", nombre: "Posta de basa", precio: 7750, precioMayor: 7440, unidad: "kg" },
  { categoria: "Pescado", nombre: "Hueso de basa", precio: 7750, precioMayor: 7440, unidad: "kg" },

  // LÁCTEOS
  { categoria: "Lácteos", nombre: "Mantequilla de vaca x500", precio: 14375, precioMayor: 13800, unidad: "und" },
  { categoria: "Lácteos", nombre: "Mantequilla de vaca x250", precio: 8000, precioMayor: 7680, unidad: "und" },
  { categoria: "Lácteos", nombre: "Suero costeño x500", precio: 6500, precioMayor: 6240, unidad: "und" },
  { categoria: "Lácteos", nombre: "Suero costeño x250", precio: 4125, precioMayor: 3960, unidad: "und" },
  { categoria: "Lácteos", nombre: "Queso costeño x500", precio: 13750, precioMayor: 13200, unidad: "und" },
  { categoria: "Lácteos", nombre: "Queso costeño x250", precio: 6875, precioMayor: 6600, unidad: "und" },

  // PRODUCTOS PRECOCIDOS
  { categoria: "Precocidos", nombre: "Tocineta x1000 Valentinas", precio: 28233, precioMayor: 27103, unidad: "und" },
  { categoria: "Precocidos", nombre: "Yuca x1000", precio: 8797, precioMayor: 8445, unidad: "und" },
  { categoria: "Precocidos", nombre: "Yuca x500", precio: 4235, precioMayor: 4066, unidad: "und" },
  { categoria: "Precocidos", nombre: "Papa x1000 FP", precio: 10405, precioMayor: 9989, unidad: "und" },
  { categoria: "Precocidos", nombre: "Papa x500 FP", precio: 5611, precioMayor: 5386, unidad: "und" },
  { categoria: "Precocidos", nombre: "Maíz x1000 FP", precio: 8488, precioMayor: 8148, unidad: "und" },
  { categoria: "Precocidos", nombre: "Maíz x500 FP", precio: 4449, precioMayor: 4271, unidad: "und" },
  { categoria: "Precocidos", nombre: "Mix x1000 FP", precio: 9310, precioMayor: 8938, unidad: "und" },
  { categoria: "Precocidos", nombre: "Mix x500 FP", precio: 4724, precioMayor: 4535, unidad: "und" },
  { categoria: "Precocidos", nombre: "Nuggets x15 und x300g", precio: 9612, precioMayor: 9228, unidad: "paq" },
  { categoria: "Precocidos", nombre: "Pinchos apanados x300 x6 und", precio: 9835, precioMayor: 9442, unidad: "paq" },
  { categoria: "Precocidos", nombre: "Milanesa de pollo x4 und x320", precio: 10066, precioMayor: 9663, unidad: "paq" },
  { categoria: "Precocidos", nombre: "Milanesa de pollo x10 und x800", precio: 23321, precioMayor: 22388, unidad: "paq" },

  // FILETES DE PECHUGA DON JUAN
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x2500", precio: 72500, precioMayor: 59944, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x2000", precio: 58000, precioMayor: 47955, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x1800", precio: 52200, precioMayor: 43160, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x1500", precio: 43500, precioMayor: 35966, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x1300", precio: 37700, precioMayor: 31171, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x1200", precio: 34800, precioMayor: 28773, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x1000", precio: 29000, precioMayor: 23978, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Filete de pechuga Don Juan x500", precio: 14600, precioMayor: 11788, unidad: "und" },
  { categoria: "Filetes Don Juan", nombre: "Trocito de pechuga", precio: 7500, precioMayor: 6900, unidad: "kg" },
];

async function main() {
  console.log("🌱 Inicializando Distripollo...");

  // Crear/actualizar empresa
  const empresa = await prisma.empresa.upsert({
    where: { slug: "distripollo" },
    update: { nombre: "Distripollo La 94" },
    create: {
      nombre: "Distripollo La 94",
      slug: "distripollo",
      whatsapp: "573054223600",
    },
  });
  console.log(`✓ Empresa: ${empresa.nombre}`);

  // Borrar productos existentes para evitar duplicados
  await prisma.itemPedido.deleteMany({});
  await prisma.producto.deleteMany({ where: { empresaId: empresa.id } });
  console.log("✓ Catálogo limpiado");

  // Crear productos
  let count = 0;
  for (const p of PRODUCTOS) {
    await prisma.producto.create({
      data: {
        ...p,
        empresaId: empresa.id,
      },
    });
    count++;
  }
  console.log(`✓ ${count} productos cargados`);

  // Crear zonas si no existen
  const zonasExistentes = await prisma.zona.count({ where: { empresaId: empresa.id } });
  if (zonasExistentes === 0) {
    const zonas = ["Centro", "Norte", "Sur", "Oriente", "Occidente"];
    for (const nombre of zonas) {
      await prisma.zona.create({ data: { empresaId: empresa.id, nombre } });
    }
    console.log(`✓ ${zonas.length} zonas creadas`);
  }

  console.log("\n🎉 Distripollo listo!");
  console.log("\n📋 Resumen por categoría:");
  const categorias = [...new Set(PRODUCTOS.map(p => p.categoria))];
  for (const cat of categorias) {
    const num = PRODUCTOS.filter(p => p.categoria === cat).length;
    console.log(`   • ${cat}: ${num} productos`);
  }
  console.log("\n💡 Ahora corre: npm run db:studio para ver todo visualmente");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

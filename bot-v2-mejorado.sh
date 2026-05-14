#!/bin/bash
# ════════════════════════════════════════════════════════════════
# 🤖 BOT DISTRIPOLLO MEJORADO v2
# ════════════════════════════════════════════════════════════════
# Mejoras:
#   ✅ Entiende texto pegado (multilínea con todos los productos)
#   ✅ Lenguaje natural ("porfa", "necesito", "deme", "regálame")
#   ✅ Identificación por CC/NIT para mayoristas (precios especiales)
#   ✅ Búsqueda fuzzy de productos (acepta "pechuga campesina" o solo "pechuga")
#   ✅ Comandos rápidos: /menu /productos /precios /mayorista
# ════════════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🤖 Actualizando bot de Distripollo (v2)...${NC}"
echo ""

if [ ! -f "package.json" ] || [ ! -d "bot" ]; then
    echo -e "${RED}❌ No estás en el proyecto distripollo-bot${NC}"
    exit 1
fi

# Backup del bot actual
cp bot/index.js bot/index.v1.bak 2>/dev/null || true
echo -e "${YELLOW}💾 Backup en bot/index.v1.bak${NC}"
echo ""

# ─── Crear bot mejorado ───
cat > bot/index.js << 'BOT_EOF'
/**
 * 🐔 DISTRIPOLLO BOT v2 - WhatsApp con lenguaje natural
 *
 * Mejoras:
 *  ✓ Acepta texto pegado/multilínea
 *  ✓ Entiende lenguaje natural
 *  ✓ Mayoristas se identifican por CC/NIT y reciben precios especiales
 *  ✓ Búsqueda fuzzy de productos
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const logger = pino({ level: "silent" });

const EMPRESA_SLUG = "distripollo";

// ═══════════════════════════════════════════════
// ESTADO DE CONVERSACIONES
// ═══════════════════════════════════════════════
const conversaciones = new Map();

function getEstado(jid) {
  if (!conversaciones.has(jid)) {
    conversaciones.set(jid, {
      paso: "inicio",
      pedido: { items: [] },
      mayoristaId: null,
      esMayorista: false,
      ultimoMensaje: Date.now(),
    });
  }
  return conversaciones.get(jid);
}

function resetEstado(jid) {
  conversaciones.delete(jid);
}

// Limpia conversaciones después de 30 min sin actividad
setInterval(() => {
  const now = Date.now();
  for (const [jid, est] of conversaciones.entries()) {
    if (now - est.ultimoMensaje > 30 * 60 * 1000) {
      conversaciones.delete(jid);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════
// CONEXIÓN WHATSAPP
// ═══════════════════════════════════════════════
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("bot/auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["Distripollo Bot", "Chrome", "2.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("\n📱 ESCANEA EL QR:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Cerrado. Reconectar:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("\n✅ BOT DISTRIPOLLO v2 CONECTADO\n");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe || msg.key.remoteJid?.endsWith("@g.us")) return;
    const jid = msg.key.remoteJid;
    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
    if (!texto) return;

    console.log(`📩 ${jid}: ${texto.substring(0, 100)}`);

    try {
      const respuesta = await procesarMensaje(jid, texto);
      if (respuesta) {
        await sock.sendMessage(jid, { text: respuesta });
        console.log(`📤 ${jid}: ${respuesta.substring(0, 80)}...`);
      }
    } catch (err) {
      console.error("Error:", err);
      await sock.sendMessage(jid, { text: "😅 Hubo un problema. Un asesor te contactará pronto." });
    }
  });

  return sock;
}

// ═══════════════════════════════════════════════
// LÓGICA PRINCIPAL DEL BOT
// ═══════════════════════════════════════════════
async function procesarMensaje(jid, texto) {
  const estado = getEstado(jid);
  estado.ultimoMensaje = Date.now();
  const textoLower = texto.toLowerCase().trim();
  const whatsapp = jid.replace("@s.whatsapp.net", "");

  // Cargar empresa con productos
  const empresa = await prisma.empresa.findUnique({
    where: { slug: EMPRESA_SLUG },
    include: { productos: { where: { activo: true } } },
  });

  if (!empresa) return "⚠️ Sistema no configurado.";

  // ─── Comandos universales que resetean ───
  if (["cancelar", "salir", "menu", "menú", "inicio", "hola", "buenas", "buenos días", "buenas tardes", "buenas noches"].some(c => textoLower === c || textoLower.startsWith(c + " "))) {
    if (textoLower === "cancelar" || textoLower === "salir") {
      resetEstado(jid);
      return "❌ Cancelado. Escribe *hola* cuando quieras hacer un pedido.";
    }
    // Si dice "hola" y ya estaba en algo, no resetear si tenía pedido en curso
    if (estado.paso === "inicio" || estado.pedido.items.length === 0) {
      resetEstado(jid);
      return saludarYMenu(empresa, estado);
    }
  }

  // ─── Comando /mayorista (registrarse o identificarse) ───
  if (textoLower === "/mayorista" || textoLower === "mayorista" || textoLower.includes("soy mayorista") || textoLower.includes("precio mayorista") || textoLower.includes("al por mayor")) {
    estado.paso = "esperando_documento";
    return "🏢 *Acceso mayorista*\n\nPor favor envíame tu *CC* o *NIT* para verificar tu cuenta y darte precios especiales.\n\n_Si aún no estás registrado como mayorista, escribe *cancelar* y haz tu pedido normal._";
  }

  // ─── PASO: Esperando documento de mayorista ───
  if (estado.paso === "esperando_documento") {
    const doc = texto.replace(/[^\d]/g, ""); // solo números
    if (doc.length < 6) {
      return "🤔 Ese número parece inválido. Envíame tu CC o NIT (solo números). Ej: *1023456789*";
    }

    const mayorista = await prisma.mayorista.findUnique({
      where: { empresaId_documento: { empresaId: empresa.id, documento: doc } },
    });

    if (!mayorista) {
      estado.paso = "inicio";
      return `😕 No encuentro un mayorista registrado con ese documento.\n\n¿Quieres registrarte? Escribe a:\n📞 ${empresa.whatsapp || "el WhatsApp de la empresa"}\n\nO escribe *hola* para hacer un pedido al detal.`;
    }

    if (!mayorista.activo) {
      estado.paso = "inicio";
      return `⚠️ Tu cuenta de mayorista está inactiva. Contacta al asesor para reactivarla.`;
    }

    estado.mayoristaId = mayorista.id;
    estado.esMayorista = true;
    estado.paso = "inicio";
    return `✅ ¡Hola *${mayorista.razonSocial}*!\n\nAcceso mayorista confirmado. Verás precios especiales en tu pedido.\n\n¿Qué deseas?\n1️⃣ Hacer un pedido\n2️⃣ Ver catálogo con tus precios\n3️⃣ Estado de mis pedidos`;
  }

  // ─── PASO: INICIO ───
  if (estado.paso === "inicio") {
    if (texto === "1" || textoLower.includes("pedido") || textoLower.includes("comprar")) {
      estado.paso = "tomando_pedido";
      return tomarPedidoIntro(empresa, estado);
    }
    if (texto === "2" || textoLower.includes("precio") || textoLower.includes("catalog") || textoLower.includes("productos")) {
      return mostrarProductos(empresa, estado);
    }
    if (texto === "3" || textoLower.includes("estado") || textoLower.includes("mi pedido")) {
      return await consultarEstado(empresa.id, whatsapp);
    }
    if (texto === "4" || textoLower.includes("asesor") || textoLower.includes("humano") || textoLower.includes("persona")) {
      resetEstado(jid);
      return "👨 Un asesor te contactará pronto. Si es urgente, llama directamente al número de Distripollo La 94.";
    }

    // Si escribe algo que parece un pedido directo, lo tomamos sin pasar por menú
    const items = parsearPedidoCompleto(texto, empresa.productos);
    if (items.length > 0) {
      estado.pedido.items.push(...items);
      estado.paso = "tomando_pedido";
      return mostrarResumenItems(estado, true);
    }

    return saludarYMenu(empresa, estado);
  }

  // ─── PASO: TOMANDO PEDIDO ───
  if (estado.paso === "tomando_pedido") {
    if (["listo", "terminar", "ya", "fin", "continuar", "seguir"].includes(textoLower) || textoLower.startsWith("ya ") || textoLower.startsWith("listo ")) {
      if (estado.pedido.items.length === 0) {
        return "🤔 Aún no agregaste productos.\n\nEscribe lo que necesitas. Ejemplos:\n• _30 kg pechuga campesina_\n• _Necesito 2 kg de muslo y 1 kg alitas_\n• _10 unidades de pollo entero_";
      }
      estado.paso = "esperando_datos";
      return pedirDatosCliente(estado);
    }

    // Intentar parsear múltiples items en el mensaje
    const items = parsearPedidoCompleto(texto, empresa.productos);
    if (items.length > 0) {
      estado.pedido.items.push(...items);
      return mostrarResumenItems(estado, false);
    }

    // No entendió, dar ayuda
    return `🤔 No encontré productos en lo que escribiste.\n\nProbá así:\n• _30 kg pechuga campesina_\n• _2 contramuslos_\n• _1 yuca x500_\n\nO escribe *listo* si ya terminaste, o *productos* para ver el catálogo.`;
  }

  // ─── PASO: ESPERANDO DATOS DEL CLIENTE ───
  if (estado.paso === "esperando_datos") {
    if (!estado.pedido.nombreNegocio) {
      estado.pedido.nombreNegocio = texto;
      return "📍 Perfecto. Ahora envíame tu *dirección completa* (con barrio):";
    }
    if (!estado.pedido.direccion) {
      estado.pedido.direccion = texto;
      estado.paso = "esperando_fecha";
      return "📅 ¿Para qué *fecha y hora* necesitas el pedido?\n\nEjemplos:\n• _Mañana en la mañana_\n• _El viernes a las 9am_\n• _Hoy mismo si puede ser_";
    }
  }

  // ─── PASO: ESPERANDO FECHA ───
  if (estado.paso === "esperando_fecha") {
    estado.pedido.fechaEntrega = texto;
    estado.paso = "confirmando_final";
    return mostrarResumenFinal(estado);
  }

  // ─── PASO: CONFIRMACIÓN FINAL ───
  if (estado.paso === "confirmando_final") {
    if (["confirmar", "confirmo", "si", "sí", "dale", "ok", "listo"].some(p => textoLower === p || textoLower.startsWith(p + " "))) {
      try {
        const numero = await guardarPedido(empresa.id, whatsapp, estado);
        resetEstado(jid);
        return `🎉 *¡PEDIDO CONFIRMADO!*\n\n📋 Número: *${numero}*\n\nUn asesor te contactará pronto para coordinar la entrega y el pago.\n\n¡Gracias por confiar en *Distripollo La 94*! 🐔`;
      } catch (err) {
        console.error("Error guardando:", err);
        return "😅 Hubo un error guardando. Un asesor te contactará pronto.";
      }
    }
    if (["cancelar", "no", "atras"].some(p => textoLower === p)) {
      resetEstado(jid);
      return "❌ Pedido cancelado.";
    }
    return "Por favor responde *confirmar* para guardar el pedido, o *cancelar* para descartarlo.";
  }

  return saludarYMenu(empresa, estado);
}

// ═══════════════════════════════════════════════
// PARSER INTELIGENTE - Detecta items en cualquier formato
// ═══════════════════════════════════════════════
function parsearPedidoCompleto(texto, productos) {
  const items = [];

  // Dividir por líneas, comas, "y", o cualquier separador
  const lineas = texto
    .split(/[\n,;]+|\sy\s/gi)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const linea of lineas) {
    const item = parsearItemUno(linea, productos);
    if (item) {
      // Si ya existe el mismo producto, sumar cantidad
      const existing = items.find(i => i.productoId === item.productoId);
      if (existing) {
        existing.cantidad += item.cantidad;
        existing.subtotal = existing.cantidad * existing.precioUnit;
      } else {
        items.push(item);
      }
    }
  }
  return items;
}

function parsearItemUno(texto, productos) {
  // Limpiar palabras innecesarias
  const limpio = texto
    .toLowerCase()
    .replace(/\b(porfa|porfavor|por favor|necesito|quiero|deme|dame|me das|regalame|regálame|llevame|el|la|de|del|las|los|un|una|unas|unos)\b/g, "")
    .trim();

  // Buscar número + (unidad opcional) + nombre
  const match = limpio.match(/(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos|k|unidad|unidades|und|u|paquete|paquetes|paq|caja|cajas|cj)?\s+(.+)/i);
  if (!match) return null;

  const cantidad = parseFloat(match[1].replace(",", "."));
  const nombreBuscado = match[3].trim();

  if (!nombreBuscado || cantidad <= 0) return null;

  // Búsqueda fuzzy: encuentra el mejor match
  const producto = encontrarProducto(nombreBuscado, productos);
  if (!producto) return null;

  const precio = Number(producto.precio);

  return {
    productoId: producto.id,
    nombre: producto.nombre,
    cantidad,
    unidad: producto.unidad,
    precioUnit: precio,
    subtotal: cantidad * precio,
  };
}

function encontrarProducto(busqueda, productos) {
  const b = busqueda.toLowerCase().trim();

  // 1. Match exacto
  let p = productos.find(p => p.nombre.toLowerCase() === b);
  if (p) return p;

  // 2. Match por inclusión (la búsqueda está dentro del nombre)
  p = productos.find(p => p.nombre.toLowerCase().includes(b));
  if (p) return p;

  // 3. El nombre está dentro de la búsqueda
  p = productos.find(p => b.includes(p.nombre.toLowerCase()));
  if (p) return p;

  // 4. Coincidencia por palabras clave (al menos 70% de palabras coinciden)
  const palabrasBusqueda = b.split(/\s+/).filter(w => w.length > 2);
  if (palabrasBusqueda.length === 0) return null;

  let mejorMatch = null;
  let mejorScore = 0;

  for (const prod of productos) {
    const palabrasProd = prod.nombre.toLowerCase().split(/\s+/);
    let coincidencias = 0;
    for (const pb of palabrasBusqueda) {
      if (palabrasProd.some(pp => pp.includes(pb) || pb.includes(pp))) {
        coincidencias++;
      }
    }
    const score = coincidencias / palabrasBusqueda.length;
    if (score > mejorScore && score >= 0.5) {
      mejorScore = score;
      mejorMatch = prod;
    }
  }

  return mejorMatch;
}

// ═══════════════════════════════════════════════
// MENSAJES
// ═══════════════════════════════════════════════
function saludarYMenu(empresa, estado) {
  const saludo = estado.esMayorista
    ? `🏢 *Bienvenido(a) mayorista*`
    : `🐔 *¡Hola! Bienvenido a ${empresa.nombre}*`;

  return `${saludo}\n\n¿Qué deseas?\n\n1️⃣ Hacer un pedido\n2️⃣ Ver catálogo y precios\n3️⃣ Estado de mi pedido\n4️⃣ Hablar con un asesor\n\n_También puedes escribir directamente lo que necesitas, ej: "20 kg pechuga campesina"_\n${estado.esMayorista ? "" : "\n_¿Eres mayorista? Escribe */mayorista*_"}`;
}

function tomarPedidoIntro(empresa, estado) {
  const tipo = estado.esMayorista ? "mayorista" : "al detal";
  return `📝 *Hacer pedido (${tipo})*\n\nDime los productos que necesitas. Puedes escribir todo de una o de a uno.\n\nEjemplos:\n• _30 kg pechuga campesina_\n• _Necesito 2 kg muslo, 1 kg alitas y 3 contramuslos_\n• _Yuca x500 (2 paquetes)_\n\nCuando termines, escribe *listo*.`;
}

function precioParaCliente(producto, esMayorista) {
  if (esMayorista && producto.precioMayor) return Number(producto.precioMayor);
  return Number(producto.precio);
}

function mostrarProductos(empresa, estado) {
  if (empresa.productos.length === 0) return "⚠️ Catálogo no disponible.";

  const porCategoria = {};
  empresa.productos.forEach(p => {
    const cat = p.categoria || "General";
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(p);
  });

  let msg = estado.esMayorista
    ? `📋 *CATÁLOGO MAYORISTA*\n\n_Precios especiales para ti_\n\n`
    : `📋 *CATÁLOGO ${empresa.nombre.toUpperCase()}*\n\n`;

  for (const cat of Object.keys(porCategoria)) {
    msg += `*${cat.toUpperCase()}*\n`;
    for (const p of porCategoria[cat]) {
      const precio = precioParaCliente(p, estado.esMayorista);
      msg += `• ${p.nombre}: $${precio.toLocaleString("es-CO")}/${p.unidad}\n`;
    }
    msg += "\n";
  }

  msg += `\n💬 Para pedir, escribe la cantidad y el producto.\nEj: _30 kg pechuga campesina_`;

  // Si el mensaje es muy largo (WhatsApp tiene límite), avisar
  if (msg.length > 4000) {
    return msg.substring(0, 3800) + "\n\n...\n\n_Catálogo muy extenso. Pregunta por una categoría específica._";
  }
  return msg;
}

function mostrarResumenItems(estado, esPrimero) {
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);
  let msg = esPrimero ? `✅ *Detecté estos productos:*\n\n` : `✅ Agregado.\n\n📦 *Pedido actual:*\n`;

  for (const i of estado.pedido.items) {
    msg += `• ${i.cantidad} ${i.unidad} ${i.nombre}\n`;
    msg += `   $${i.precioUnit.toLocaleString("es-CO")}/${i.unidad} = $${i.subtotal.toLocaleString("es-CO")}\n`;
  }

  msg += `\n💰 *Total parcial: $${total.toLocaleString("es-CO")}*\n\n`;
  msg += `¿Algo más?\n_(Agrega otro producto, o escribe *listo* para continuar)_`;
  return msg;
}

function pedirDatosCliente(estado) {
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);
  let msg = `📦 *RESUMEN:*\n\n`;
  for (const i of estado.pedido.items) {
    msg += `• ${i.cantidad} ${i.unidad} ${i.nombre} - $${i.subtotal.toLocaleString("es-CO")}\n`;
  }
  msg += `\n💰 *Total: $${total.toLocaleString("es-CO")}*\n\n`;
  msg += `Ahora dime el *nombre de tu negocio* (o tu nombre si es para tu casa):`;
  return msg;
}

function mostrarResumenFinal(estado) {
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);
  let msg = `📋 *RESUMEN FINAL*\n\n`;
  if (estado.esMayorista) msg += `🏢 *Pedido mayorista*\n`;
  msg += `🏪 *Cliente:* ${estado.pedido.nombreNegocio}\n`;
  msg += `📍 *Dirección:* ${estado.pedido.direccion}\n`;
  msg += `📅 *Entrega:* ${estado.pedido.fechaEntrega}\n\n`;
  msg += `📦 *Productos:*\n`;
  for (const i of estado.pedido.items) {
    msg += `• ${i.cantidad} ${i.unidad} ${i.nombre} - $${i.subtotal.toLocaleString("es-CO")}\n`;
  }
  msg += `\n💰 *Total: $${total.toLocaleString("es-CO")}*\n\n`;
  msg += `Responde *confirmar* para guardar el pedido,\no *cancelar* para descartarlo.`;
  return msg;
}

// ═══════════════════════════════════════════════
// GUARDAR PEDIDO EN DB
// ═══════════════════════════════════════════════
async function guardarPedido(empresaId, whatsapp, estado) {
  // Buscar o crear cliente
  let cliente = await prisma.cliente.findUnique({
    where: { empresaId_whatsapp: { empresaId, whatsapp } },
  });

  const dataCliente = {
    nombre: estado.pedido.nombreNegocio,
    direccion: estado.pedido.direccion,
    ultimoPedido: new Date(),
    esMayorista: estado.esMayorista,
    mayoristaId: estado.mayoristaId,
  };

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: { empresaId, whatsapp, ...dataCliente },
    });
  } else {
    cliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: dataCliente,
    });
  }

  // Generar número de pedido
  const numero = "DP-" + Date.now().toString().slice(-8);
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);

  await prisma.pedido.create({
    data: {
      numero,
      empresaId,
      clienteId: cliente.id,
      total,
      esMayorista: estado.esMayorista,
      notas: `Fecha solicitada: ${estado.pedido.fechaEntrega}`,
      items: {
        create: estado.pedido.items.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          unidad: i.unidad,
          precioUnit: i.precioUnit,
          subtotal: i.subtotal,
        })),
      },
    },
  });

  return numero;
}

async function consultarEstado(empresaId, whatsapp) {
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId, cliente: { whatsapp } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (pedidos.length === 0) return "📭 No tienes pedidos. Escribe *1* para hacer tu primer pedido.";

  let msg = `📋 *Tus últimos pedidos:*\n\n`;
  for (const p of pedidos) {
    msg += `*${p.numero}* — ${p.estado}\n`;
    msg += `💰 $${Number(p.total).toLocaleString("es-CO")}\n`;
    msg += `📅 ${p.createdAt.toLocaleDateString("es-CO")}\n\n`;
  }
  return msg;
}

// ═══════════════════════════════════════════════
// INICIAR
// ═══════════════════════════════════════════════
console.log("🐔 Distripollo Bot v2 iniciando...");
startBot().catch(console.error);
BOT_EOF

echo -e "${GREEN}✓ Bot v2 creado${NC}"
echo ""

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BOT v2 LISTO                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Mejoras del bot v2:${NC}"
echo -e "  ✓ Acepta ${GREEN}texto pegado${NC} con todos los productos"
echo -e "  ✓ Entiende ${GREEN}lenguaje natural${NC} (porfa, necesito, deme, etc)"
echo -e "  ✓ ${GREEN}Mayoristas${NC} con identificación por CC/NIT"
echo -e "  ✓ ${GREEN}Búsqueda fuzzy${NC} de productos"
echo -e "  ✓ Limpia conversaciones inactivas tras 30 min"
echo ""
echo -e "${YELLOW}Reinicia el bot para probar:${NC}"
echo ""
echo -e "  Si está corriendo: ${GREEN}Ctrl+C${NC} en esa terminal"
echo -e "  Después: ${GREEN}npm run bot${NC}"
echo ""
echo -e "${YELLOW}Pruebas que puedes hacer:${NC}"
echo ""
echo -e "  💬 ${BLUE}\"Necesito 30 kg pechuga campesina, 20 kg muslo y 10 kg alitas\"${NC}"
echo -e "  → Debe detectar los 3 productos en un solo mensaje"
echo ""
echo -e "  💬 ${BLUE}\"hola\"${NC} → menú"
echo -e "  💬 ${BLUE}\"/mayorista\"${NC} → pide CC/NIT"
echo -e "  💬 ${BLUE}\"porfa deme 5 kg de muslo campesino\"${NC} → debe entender"
echo ""
echo -e "${YELLOW}Para crear un mayorista de prueba:${NC}"
echo -e "  ${GREEN}npm run db:studio${NC}"
echo -e "  Abre tabla ${BLUE}Mayorista${NC} → New record"
echo -e "  Llena: empresaId=1, documento=\"123456789\", razonSocial=\"Test\""
echo -e "  Luego escríbele al bot: \"/mayorista\" y manda \"123456789\""
echo ""

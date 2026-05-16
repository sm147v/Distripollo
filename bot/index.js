/**
 * 🐔 DISTRIPOLLO BOT v3 - WhatsApp con comprensión semántica
 *
 * Mejoras respecto a v2:
 *  ✓ Parser semántico: entiende ortografía, sinónimos, lenguaje natural
 *  ✓ Detección de cantidad sin número ("un salchichón" = 1 unidad)
 *  ✓ Tolerancia a errores de tipeo (Levenshtein)
 *  ✓ Desambiguación interactiva (te ofrece elegir entre opciones)
 *  ✓ Mensajes de ayuda más claros y útiles
 *  ✓ Mantiene mayoristas, sesiones, multi-empresa
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
const parser = require("./parser-semantico");

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
      ambiguoActual: null,
      ambiguosPendientes: [],
      conflictoActual: null,
      conflictosPendientes: [],
      ultimoMensaje: Date.now(),
    });
  }
  return conversaciones.get(jid);
}

function resetEstado(jid) {
  conversaciones.delete(jid);
}

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
    browser: ["Distripollo Bot", "Chrome", "3.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("\n📱 ESCANEA EL QR:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Cerrado. Reconectar:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("\n✅ BOT DISTRIPOLLO v3 CONECTADO\n");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe || msg.key.remoteJid?.endsWith("@g.us")) return;
    const jid = msg.key.remoteJid;
    const texto = (
      msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    ).trim();
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
      await sock.sendMessage(jid, {
        text: "😅 Hubo un problema. Un asesor te contactará pronto.",
      });
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

  const empresa = await prisma.empresa.findUnique({
    where: { slug: EMPRESA_SLUG },
    include: { productos: { where: { activo: true } } },
  });

  if (!empresa) return "⚠️ Sistema no configurado.";

  if (esComandoUniversal(textoLower)) {
    if (textoLower === "cancelar" || textoLower === "salir") {
      resetEstado(jid);
      return "❌ Cancelado. Escribe *hola* cuando quieras hacer un pedido.";
    }
    if (estado.paso === "inicio" || estado.pedido.items.length === 0) {
      resetEstado(jid);
      return saludarYMenu(empresa, estado);
    }
  }

  if (esComandoMayorista(textoLower)) {
    estado.paso = "esperando_documento";
    return (
      "🏢 *Acceso mayorista*\n\n" +
      "Por favor envíame tu *CC* o *NIT* para verificar tu cuenta y darte precios especiales.\n\n" +
      "_Si aún no estás registrado como mayorista, escribe *cancelar* y haz tu pedido normal._"
    );
  }

  if (estado.paso === "esperando_documento") {
    return await procesarDocumentoMayorista(estado, texto, empresa);
  }

  if (estado.paso === "esperando_cantidad_correcta" && estado.conflictoActual) {
    return procesarCantidadCorrecta(estado, texto, empresa);
  }

  if (estado.paso === "aclarando_conflicto_unidad" && estado.conflictoActual) {
    return procesarAclaracionConflictoUnidad(estado, texto, empresa);
  }

  if (estado.paso === "aclarando_ambiguo" && estado.ambiguoActual) {
    return procesarAclaracionAmbigua(estado, texto, empresa);
  }

  if (estado.paso === "inicio") {
    return await procesarInicio(estado, jid, texto, textoLower, empresa, whatsapp);
  }

  if (estado.paso === "tomando_pedido") {
    return procesarTomandoPedido(estado, texto, textoLower, empresa);
  }

  if (estado.paso === "esperando_datos") {
    if (!estado.pedido.nombreNegocio) {
      estado.pedido.nombreNegocio = texto;
      return "📍 Perfecto. Ahora envíame tu *dirección completa* (con barrio):";
    }
    if (!estado.pedido.direccion) {
      estado.pedido.direccion = texto;
      estado.paso = "esperando_fecha";
      return (
        "📅 ¿Para qué *fecha y hora* necesitas el pedido?\n\n" +
        "Ejemplos:\n" +
        "• _Mañana en la mañana_\n" +
        "• _El viernes a las 9am_\n" +
        "• _Hoy mismo si puede ser_"
      );
    }
  }

  if (estado.paso === "esperando_fecha") {
    estado.pedido.fechaEntrega = texto;
    estado.paso = "confirmando_final";
    return mostrarResumenFinal(estado);
  }

  if (estado.paso === "confirmando_final") {
    return await procesarConfirmacionFinal(estado, jid, textoLower, empresa, whatsapp);
  }

  return saludarYMenu(empresa, estado);
}

// ═══════════════════════════════════════════════
// HANDLERS POR PASO
// ═══════════════════════════════════════════════
function esComandoUniversal(textoLower) {
  const comandos = [
    "cancelar", "salir", "menu", "menú", "inicio",
    "hola", "buenas", "buenos dias", "buenos días",
    "buenas tardes", "buenas noches",
  ];
  return comandos.some((c) => textoLower === c || textoLower.startsWith(c + " "));
}

function esComandoMayorista(textoLower) {
  return (
    textoLower === "/mayorista" ||
    textoLower === "mayorista" ||
    textoLower.includes("soy mayorista") ||
    textoLower.includes("precio mayorista") ||
    textoLower.includes("al por mayor")
  );
}

async function procesarDocumentoMayorista(estado, texto, empresa) {
  const doc = texto.replace(/[^\d]/g, "");
  if (doc.length < 6) {
    return "🤔 Ese número parece inválido. Envíame tu CC o NIT (solo números). Ej: *1023456789*";
  }

  const mayorista = await prisma.mayorista.findUnique({
    where: { empresaId_documento: { empresaId: empresa.id, documento: doc } },
  });

  if (!mayorista) {
    estado.paso = "inicio";
    return (
      `😕 No encuentro un mayorista registrado con ese documento.\n\n` +
      `¿Quieres registrarte? Escribe a:\n📞 ${empresa.whatsapp || "el WhatsApp de la empresa"}\n\n` +
      `O escribe *hola* para hacer un pedido al detal.`
    );
  }

  if (!mayorista.activo) {
    estado.paso = "inicio";
    return `⚠️ Tu cuenta de mayorista está inactiva. Contacta al asesor para reactivarla.`;
  }

  estado.mayoristaId = mayorista.id;
  estado.esMayorista = true;
  estado.paso = "inicio";
  return (
    `✅ ¡Hola *${mayorista.razonSocial}*!\n\n` +
    `Acceso mayorista confirmado. Verás precios especiales en tu pedido.\n\n` +
    `¿Qué deseas?\n1️⃣ Hacer un pedido\n2️⃣ Ver catálogo con tus precios\n3️⃣ Estado de mis pedidos`
  );
}

async function procesarInicio(estado, jid, texto, textoLower, empresa, whatsapp) {
  if (texto === "1" || textoLower.includes("pedido") || textoLower.includes("comprar")) {
    estado.paso = "tomando_pedido";
    return tomarPedidoIntro(empresa, estado);
  }
  if (texto === "2" || textoLower.includes("precio") || textoLower.includes("catalog") ||
      textoLower.includes("productos")) {
    return mostrarProductos(empresa, estado);
  }
  if (texto === "3" || textoLower.includes("estado") || textoLower.includes("mi pedido")) {
    return await consultarEstado(empresa.id, whatsapp);
  }
  if (texto === "4" || textoLower.includes("asesor") || textoLower.includes("humano") ||
      textoLower.includes("persona")) {
    resetEstado(jid);
    return "👨 Un asesor te contactará pronto. Si es urgente, llama directamente al número de Distripollo La 94.";
  }

  const { items, ambiguos, conflictos, noEntendidos } = parser.parsearPedido(
    texto, empresa.productos, estado.esMayorista
  );

  if (items.length > 0 || ambiguos.length > 0 || conflictos.length > 0) {
    estado.pedido.items.push(...items);
    estado.paso = "tomando_pedido";
    return iniciarFlujoAclaraciones(estado, items, ambiguos, conflictos, noEntendidos, true);
  }

  return saludarYMenu(empresa, estado);
}

function procesarTomandoPedido(estado, texto, textoLower, empresa) {
  if (
    ["listo", "terminar", "ya", "fin", "continuar", "seguir"].includes(textoLower) ||
    textoLower.startsWith("ya ") ||
    textoLower.startsWith("listo ")
  ) {
    if (estado.pedido.items.length === 0) {
      return (
        "🤔 Aún no agregaste productos.\n\n" +
        "Escribe lo que necesitas. Ejemplos:\n" +
        "• _30 kg pechuga campesina_\n" +
        "• _Necesito 2 kg de muslo y 1 kg alitas_\n" +
        "• _10 unidades de pollo entero_"
      );
    }
    estado.paso = "esperando_datos";
    return pedirDatosCliente(estado);
  }

  if (textoLower === "productos" || textoLower === "catalogo" || textoLower === "catálogo") {
    return mostrarProductos(empresa, estado);
  }

  if (textoLower === "quitar" || textoLower === "borrar" || textoLower === "vaciar") {
    estado.pedido.items = [];
    return "🗑️ Pedido vaciado. Empieza de nuevo, dime qué necesitas.";
  }

  const { items, ambiguos, conflictos } = parser.parsearPedido(
    texto, empresa.productos, estado.esMayorista
  );

  if (items.length === 0 && ambiguos.length === 0 && conflictos.length === 0) {
    return (
      "🤔 No encontré productos en lo que escribiste.\n\n" +
      "Probá así:\n" +
      "• _30 kg pechuga campesina_\n" +
      "• _2 contramuslos_\n" +
      "• _1 yuca x500_\n\n" +
      "O escribe *listo* si ya terminaste, o *productos* para ver el catálogo."
    );
  }

  for (const item of items) {
    const existing = estado.pedido.items.find((i) => i.productoId === item.productoId);
    if (existing) {
      existing.cantidad += item.cantidad;
      existing.subtotal = existing.cantidad * existing.precioUnit;
    } else {
      estado.pedido.items.push(item);
    }
  }

  return iniciarFlujoAclaraciones(estado, items, ambiguos, conflictos, [], false);
}

// ═══════════════════════════════════════════════
// FLUJO DE ACLARACIONES
// ═══════════════════════════════════════════════
/**
 * Después de parsear un mensaje, decide qué hacer con los items
 * que necesitan aclaración (ambiguos o con conflicto de unidad).
 * Prioriza: primero conflictos, luego ambiguos.
 */
function iniciarFlujoAclaraciones(estado, items, ambiguos, conflictos, noEntendidos, esPrimero) {
  // Prefix con lo que ya se agregó (si algo)
  let prefijo = "";
  if (items.length > 0) {
    if (esPrimero) {
      prefijo = formatearMensajeInicial(items, noEntendidos) + "\n\n";
    } else {
      prefijo = "✅ Agregué:\n";
      for (const i of items) {
        prefijo += `• ${formatCant(i.cantidad)} ${i.unidad} ${i.nombre}\n`;
      }
      prefijo += "\n";
    }
  }

  // 1) Conflictos de unidad primero (son más graves)
  if (conflictos.length > 0) {
    estado.conflictosPendientes = conflictos.slice(1);
    estado.conflictoActual = conflictos[0];
    // Guardar también los ambiguos pendientes para después
    estado.ambiguosPendientes = ambiguos;
    estado.paso = "aclarando_conflicto_unidad";
    return prefijo + pedirAclaracionConflicto(conflictos[0]);
  }

  // 2) Ambiguos
  if (ambiguos.length > 0) {
    estado.ambiguosPendientes = ambiguos.slice(1);
    estado.ambiguoActual = ambiguos[0];
    estado.paso = "aclarando_ambiguo";
    return prefijo + pedirAclaracion(ambiguos[0]);
  }

  // 3) Sin aclaraciones pendientes: continuar normal
  if (esPrimero) {
    return prefijo + "¿Algo más?\n_(Agrega otro producto, o escribe *listo* para continuar)_";
  }
  return mostrarResumenItems(estado, false);
}

function procesarAclaracionAmbigua(estado, texto, empresa) {
  const ambiguo = estado.ambiguoActual;
  const textoLower = texto.toLowerCase().trim();

  const numElegido = parseInt(textoLower, 10);
  let elegido = null;

  if (!isNaN(numElegido) && numElegido >= 1 && numElegido <= ambiguo.candidatos.length) {
    elegido = ambiguo.candidatos[numElegido - 1];
  } else if (textoLower === "cancelar" || textoLower === "no" || textoLower === "ninguno") {
    estado.ambiguoActual = null;
    return procesarSiguienteAclaracion(estado, "❌ Producto saltado.\n\n");
  } else {
    const reintento = parser.buscarProducto(texto, ambiguo.candidatos);
    if (reintento.producto && !reintento.ambiguo) {
      elegido = reintento.producto;
    }
  }

  if (!elegido) {
    return (
      "🤔 No entendí cuál elegiste.\n\n" +
      pedirAclaracion(ambiguo) +
      "\n\n_O escribe *cancelar* para saltar este producto._"
    );
  }

  // VERIFICAR CONFLICTO DE UNIDAD al resolver el ambiguo
  // Si el cliente dijo "25 kg" pero el producto elegido se vende por und,
  // tenemos un conflicto que debe ir al flujo de aclaración de unidad.
  if (ambiguo.unidad) {
    const { CATEGORIA_UNIDAD } = require("./diccionario");
    const catCliente = CATEGORIA_UNIDAD[ambiguo.unidad];
    const catProducto = CATEGORIA_UNIDAD[elegido.unidad];
    if (catCliente && catProducto && catCliente !== catProducto) {
      // Convertir ambiguo resuelto en un conflicto
      estado.ambiguoActual = null;
      const conflicto = {
        conflictoUnidad: true,
        producto: elegido,
        cantidad: ambiguo.cantidad,
        unidadCliente: ambiguo.unidad,
        unidadProducto: elegido.unidad,
        textoOriginal: ambiguo.textoOriginal,
      };
      // Si no hay conflicto actual, este es el nuevo. Si hay, pasa a la cola.
      if (!estado.conflictoActual) {
        estado.conflictoActual = conflicto;
      } else {
        estado.conflictosPendientes.push(conflicto);
      }
      estado.paso = "aclarando_conflicto_unidad";
      return (
        `Ok, *${elegido.nombre}*.\n\n` +
        pedirAclaracionConflicto(conflicto)
      );
    }
  }

  // No hay conflicto: agregar el item normalmente
  const precio = estado.esMayorista && elegido.precioMayor
    ? Number(elegido.precioMayor)
    : Number(elegido.precio);

  const item = {
    productoId: elegido.id,
    nombre: elegido.nombre,
    cantidad: ambiguo.cantidad,
    unidad: elegido.unidad, // siempre la del producto
    precioUnit: precio,
    subtotal: ambiguo.cantidad * precio,
  };

  const existing = estado.pedido.items.find((i) => i.productoId === item.productoId);
  if (existing) {
    existing.cantidad += item.cantidad;
    existing.subtotal = existing.cantidad * existing.precioUnit;
  } else {
    estado.pedido.items.push(item);
  }

  estado.ambiguoActual = null;
  const confirmacion = `✅ Agregado: ${formatCant(item.cantidad)} ${item.unidad} ${item.nombre}\n\n`;
  return procesarSiguienteAclaracion(estado, confirmacion);
}

function procesarSiguienteAclaracion(estado, prefijo) {
  // 1) Conflictos pendientes primero
  if (estado.conflictoActual) {
    estado.paso = "aclarando_conflicto_unidad";
    return prefijo + pedirAclaracionConflicto(estado.conflictoActual);
  }
  if (estado.conflictosPendientes && estado.conflictosPendientes.length > 0) {
    estado.conflictoActual = estado.conflictosPendientes.shift();
    estado.paso = "aclarando_conflicto_unidad";
    return prefijo + pedirAclaracionConflicto(estado.conflictoActual);
  }

  // 2) Ambiguos pendientes
  if (estado.ambiguosPendientes && estado.ambiguosPendientes.length > 0) {
    const siguiente = estado.ambiguosPendientes.shift();
    estado.ambiguoActual = siguiente;
    estado.paso = "aclarando_ambiguo";
    return prefijo + pedirAclaracion(siguiente);
  }

  // 3) Sin aclaraciones pendientes
  estado.paso = "tomando_pedido";
  if (estado.pedido.items.length === 0) {
    return prefijo + "Dime qué necesitas:";
  }
  return prefijo + mostrarResumenItems(estado, false);
}

// ═══════════════════════════════════════════════
// HANDLER: aclaración de conflicto de unidad
// ═══════════════════════════════════════════════
/**
 * El cliente pidió algo en una unidad incompatible con el producto.
 * Ej: "25 kg de alitas picantes" cuando el producto es por "und".
 *
 * Opciones que ofrecemos:
 *   1. Llevarse N unidades (la cantidad que dijo, interpretada como conteo)
 *   2. Pedir otra cantidad
 *   3. Cancelar este producto
 */
function procesarAclaracionConflictoUnidad(estado, texto, empresa) {
  const conflicto = estado.conflictoActual;
  const textoLower = texto.toLowerCase().trim();

  // Opción 3: cancelar
  if (
    textoLower === "3" || textoLower === "cancelar" || textoLower === "ninguno" ||
    textoLower === "no" || textoLower === "saltar"
  ) {
    estado.conflictoActual = null;
    return procesarSiguienteAclaracion(estado, `❌ Producto *${conflicto.producto.nombre}* descartado.\n\n`);
  }

  // Opción 1: aceptar la cantidad como conteo
  if (textoLower === "1" || textoLower === "si" || textoLower === "sí" ||
      textoLower === "dale" || textoLower === "ok") {
    agregarItemPorConflicto(estado, conflicto, conflicto.cantidad);
    estado.conflictoActual = null;
    return procesarSiguienteAclaracion(
      estado,
      `✅ Agregado: ${formatCant(conflicto.cantidad)} ${conflicto.producto.unidad} ${conflicto.producto.nombre}\n\n`
    );
  }

  // Opción 2: el cliente puede haber escrito "2" o un número distinto
  const numEscrito = parseFloat(textoLower.replace(",", "."));
  if (!isNaN(numEscrito) && numEscrito > 0) {
    // Si escribió "2" justo, podría ser tanto "opción 2" como "2 unidades"
    // Si es exactamente 2 y todavía no aclaró, asumimos que es opción 2
    if (numEscrito === 2 && conflicto.cantidad !== 2) {
      // Pedir cantidad nueva
      estado.paso = "esperando_cantidad_correcta";
      return (
        `🔢 ¿Cuántas *${conflicto.producto.unidad}* de *${conflicto.producto.nombre}* querés?\n\n` +
        `Respondé solo con el número.`
      );
    }
    // Cualquier otro número → tomarlo como cantidad nueva directa
    agregarItemPorConflicto(estado, conflicto, numEscrito);
    estado.conflictoActual = null;
    return procesarSiguienteAclaracion(
      estado,
      `✅ Agregado: ${formatCant(numEscrito)} ${conflicto.producto.unidad} ${conflicto.producto.nombre}\n\n`
    );
  }

  // No entendió: repetir
  return (
    "🤔 No entendí.\n\n" +
    pedirAclaracionConflicto(conflicto)
  );
}

/**
 * Helper: agregar un item al pedido a partir de un conflicto resuelto.
 */
function agregarItemPorConflicto(estado, conflicto, cantidadFinal) {
  const producto = conflicto.producto;
  const precio = estado.esMayorista && producto.precioMayor
    ? Number(producto.precioMayor)
    : Number(producto.precio);

  const item = {
    productoId: producto.id,
    nombre: producto.nombre,
    cantidad: cantidadFinal,
    unidad: producto.unidad,
    precioUnit: precio,
    subtotal: cantidadFinal * precio,
  };

  const existing = estado.pedido.items.find((i) => i.productoId === item.productoId);
  if (existing) {
    existing.cantidad += item.cantidad;
    existing.subtotal = existing.cantidad * existing.precioUnit;
  } else {
    estado.pedido.items.push(item);
  }
}

async function procesarConfirmacionFinal(estado, jid, textoLower, empresa, whatsapp) {
  if (
    ["confirmar", "confirmo", "si", "sí", "dale", "ok", "listo"].some(
      (p) => textoLower === p || textoLower.startsWith(p + " ")
    )
  ) {
    try {
      const numero = await guardarPedido(empresa.id, whatsapp, estado);
      resetEstado(jid);
      return (
        `🎉 *¡PEDIDO CONFIRMADO!*\n\n` +
        `📋 Número: *${numero}*\n\n` +
        `Un asesor te contactará pronto para coordinar la entrega y el pago.\n\n` +
        `¡Gracias por confiar en *Distripollo La 94*! 🐔`
      );
    } catch (err) {
      console.error("Error guardando:", err);
      return "😅 Hubo un error guardando. Un asesor te contactará pronto.";
    }
  }
  if (["cancelar", "no", "atras"].some((p) => textoLower === p)) {
    resetEstado(jid);
    return "❌ Pedido cancelado.";
  }
  return "Por favor responde *confirmar* para guardar el pedido, o *cancelar* para descartarlo.";
}

// ═══════════════════════════════════════════════
// MENSAJES
// ═══════════════════════════════════════════════
function saludarYMenu(empresa, estado) {
  const saludo = estado.esMayorista
    ? `🏢 *Bienvenido(a) mayorista*`
    : `🐔 *¡Hola! Bienvenido a ${empresa.nombre}*`;

  return (
    `${saludo}\n\n¿Qué deseas?\n\n` +
    `1️⃣ Hacer un pedido\n` +
    `2️⃣ Ver catálogo y precios\n` +
    `3️⃣ Estado de mi pedido\n` +
    `4️⃣ Hablar con un asesor\n\n` +
    `_También puedes escribir directamente lo que necesitas, ej: "20 kg pechuga campesina"_\n` +
    (estado.esMayorista ? "" : "\n_¿Eres mayorista? Escribe */mayorista*_")
  );
}

function tomarPedidoIntro(empresa, estado) {
  const tipo = estado.esMayorista ? "mayorista" : "al detal";
  return (
    `📝 *Hacer pedido (${tipo})*\n\n` +
    `Dime los productos que necesitas. Puedes escribir todo de una o de a uno.\n\n` +
    `Ejemplos:\n` +
    `• _30 kg pechuga campesina_\n` +
    `• _Necesito 2 kg muslo, 1 kg alitas y 3 contramuslos_\n` +
    `• _Yuca x500 (2 paquetes)_\n` +
    `• _Un salchichón mix de pollo_\n\n` +
    `Cuando termines, escribe *listo*.`
  );
}

function precioParaCliente(producto, esMayorista) {
  if (esMayorista && producto.precioMayor) return Number(producto.precioMayor);
  return Number(producto.precio);
}

function mostrarProductos(empresa, estado) {
  if (empresa.productos.length === 0) return "⚠️ Catálogo no disponible.";

  const porCategoria = {};
  empresa.productos.forEach((p) => {
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

  if (msg.length > 4000) {
    return msg.substring(0, 3800) + "\n\n...\n\n_Catálogo muy extenso. Pregunta por una categoría específica._";
  }
  return msg;
}

function formatCant(n) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

function formatearMensajeInicial(items, noEntendidos) {
  let msg = `✅ *Detecté estos productos:*\n\n`;
  for (const i of items) {
    msg += `• ${formatCant(i.cantidad)} ${i.unidad} ${i.nombre}\n`;
    msg += `   $${i.precioUnit.toLocaleString("es-CO")}/${i.unidad} = $${i.subtotal.toLocaleString("es-CO")}\n`;
  }
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  msg += `\n💰 *Total parcial: $${total.toLocaleString("es-CO")}*`;

  if (noEntendidos.length > 0) {
    msg += `\n\n⚠️ No entendí: ${noEntendidos.map((n) => `_"${n}"_`).join(", ")}`;
  }
  return msg;
}

function procesarCantidadCorrecta(estado, texto, empresa) {
  const conflicto = estado.conflictoActual;
  const textoLower = texto.toLowerCase().trim();

  if (textoLower === "cancelar" || textoLower === "no" || textoLower === "atras") {
    estado.conflictoActual = null;
    estado.paso = "tomando_pedido";
    return procesarSiguienteAclaracion(estado, "❌ Producto descartado.\n\n");
  }

  const num = parseFloat(textoLower.replace(",", "."));
  if (isNaN(num) || num <= 0) {
    return `🔢 Necesito un número. ¿Cuántas *${conflicto.producto.unidad}* de *${conflicto.producto.nombre}*?`;
  }

  agregarItemPorConflicto(estado, conflicto, num);
  estado.conflictoActual = null;
  return procesarSiguienteAclaracion(
    estado,
    `✅ Agregado: ${formatCant(num)} ${conflicto.producto.unidad} ${conflicto.producto.nombre}\n\n`
  );
}

function pedirAclaracionConflicto(conflicto) {
  const p = conflicto.producto;
  const precio = Number(p.precio);
  const unidadCliente = conflicto.unidadCliente;
  const unidadProducto = p.unidad;
  const cant = formatCant(conflicto.cantidad);

  // Nombres legibles de las unidades
  const nombreUnidad = {
    "kg":   "kilogramos (kg)",
    "lb":   "libras",
    "g":    "gramos",
    "und":  "unidades",
    "paq":  "paquetes",
    "caja": "cajas",
  };
  const nombreClient = nombreUnidad[unidadCliente] || unidadCliente;
  const nombreProd = nombreUnidad[unidadProducto] || unidadProducto;

  let msg = `⚠️ *Atención con la unidad*\n\n`;
  msg += `Dijiste *"${cant} ${unidadCliente} de ${p.nombre}"*, pero ese producto se vende por *${nombreProd}*, no por ${nombreClient}.\n\n`;
  msg += `Su precio es *$${precio.toLocaleString("es-CO")} por ${unidadProducto}*.\n\n`;
  msg += `¿Qué prefieres?\n`;
  msg += `*1.* Llevar *${cant} ${unidadProducto}* (${cant} ${nombreProd})\n`;
  msg += `*2.* Cambiar la cantidad\n`;
  msg += `*3.* Cancelar este producto\n\n`;
  msg += `_Responde con 1, 2 o 3, o directamente con el número de ${unidadProducto} que querés._`;
  return msg;
}

function pedirAclaracion(ambiguo) {
  let msg = `🤔 Cuando dices *"${ambiguo.textoOriginal.trim()}"*, ¿a cuál te refieres?\n\n`;
  ambiguo.candidatos.forEach((c, i) => {
    const precio = Number(c.precio);
    msg += `*${i + 1}.* ${c.nombre} — $${precio.toLocaleString("es-CO")}/${c.unidad}\n`;
  });
  msg += `\nResponde con el número (1, 2 o 3)`;
  return msg;
}

function mostrarResumenItems(estado, esPrimero) {
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);
  let msg = esPrimero ? `✅ *Detecté estos productos:*\n\n` : `✅ Agregado.\n\n📦 *Pedido actual:*\n`;

  for (const i of estado.pedido.items) {
    msg += `• ${formatCant(i.cantidad)} ${i.unidad} ${i.nombre}\n`;
    msg += `   $${i.precioUnit.toLocaleString("es-CO")}/${i.unidad} = $${i.subtotal.toLocaleString("es-CO")}\n`;
  }

  msg += `\n💰 *Total parcial: $${total.toLocaleString("es-CO")}*\n\n`;
  msg += `¿Algo más?\n_(Agrega otro producto, escribe *quitar* para vaciar, o *listo* para continuar)_`;
  return msg;
}

function pedirDatosCliente(estado) {
  const total = estado.pedido.items.reduce((s, i) => s + i.subtotal, 0);
  let msg = `📦 *RESUMEN:*\n\n`;
  for (const i of estado.pedido.items) {
    msg += `• ${formatCant(i.cantidad)} ${i.unidad} ${i.nombre} - $${i.subtotal.toLocaleString("es-CO")}\n`;
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
    msg += `• ${formatCant(i.cantidad)} ${i.unidad} ${i.nombre} - $${i.subtotal.toLocaleString("es-CO")}\n`;
  }
  msg += `\n💰 *Total: $${total.toLocaleString("es-CO")}*\n\n`;
  msg += `Responde *confirmar* para guardar el pedido,\no *cancelar* para descartarlo.`;
  return msg;
}

// ═══════════════════════════════════════════════
// GUARDAR PEDIDO EN DB
// ═══════════════════════════════════════════════
async function guardarPedido(empresaId, whatsapp, estado) {
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
        create: estado.pedido.items.map((i) => ({
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

  if (pedidos.length === 0)
    return "📭 No tienes pedidos. Escribe *1* para hacer tu primer pedido.";

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
console.log("🐔 Distripollo Bot v3 iniciando...");
startBot().catch(console.error);

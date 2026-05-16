/**
 * 🧠 PARSER SEMÁNTICO - Distripollo
 *
 * Motor de comprensión de pedidos sin necesidad de IA externa.
 * Combina varias técnicas para entender lenguaje natural:
 *
 *   1. NORMALIZACIÓN profunda (sin tildes, lowercase, sin signos)
 *   2. CORRECCIÓN de errores ortográficos comunes
 *   3. SINÓNIMOS y formas plurales/diminutivas
 *   4. DETECCIÓN DE CANTIDAD sin número explícito ("un salchichón" = 1)
 *   5. BÚSQUEDA por LEVENSHTEIN (errores de tipeo)
 *   6. SCORING ponderado para elegir el mejor producto
 *   7. DESAMBIGUACIÓN cuando hay varios candidatos
 */

const {
  CORRECCIONES,
  SINONIMOS,
  PALABRAS_NUM,
  UNIDADES,
  CATEGORIA_UNIDAD,
  PALABRAS_BASURA,
  REGEX_CONECTORES,
} = require("./diccionario");

// ═══════════════════════════════════════════════════════════════
// 1. NORMALIZACIÓN
// ═══════════════════════════════════════════════════════════════
/**
 * Lleva un texto a forma canónica para comparación.
 * Quita tildes, signos, mayúsculas y espacios extras.
 */
function normalizar(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // quita marcas diacríticas
    .replace(/ñ/g, "n")                 // ñ ya no tiene tilde pero por seguridad
    .replace(/[¿?¡!.()]/g, " ")        // signos a espacio
    .replace(/\s+/g, " ")               // colapsar espacios
    .trim();
}

/**
 * Aplica correcciones ortográficas del diccionario.
 * Se ejecuta sobre texto ya normalizado.
 */
function corregirOrtografia(texto) {
  let resultado = " " + texto + " ";  // padding para matching de palabras completas
  for (const [err, ok] of Object.entries(CORRECCIONES)) {
    // Reemplazar como palabra completa (entre espacios)
    const regex = new RegExp(`\\s${escaparRegex(err)}\\s`, "g");
    resultado = resultado.replace(regex, ` ${ok} `);
  }
  return resultado.trim();
}

function escaparRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ═══════════════════════════════════════════════════════════════
// 2. SINÓNIMOS
// ═══════════════════════════════════════════════════════════════
/**
 * Mapa "palabra → forma canónica" precomputado al cargar el módulo.
 * Acelera la búsqueda de sinónimos a O(1).
 */
const SINONIMOS_MAP = {};
for (const grupo of SINONIMOS) {
  const canonico = grupo[0];
  for (const palabra of grupo) {
    SINONIMOS_MAP[normalizar(palabra)] = canonico;
  }
}

/**
 * Devuelve la forma canónica de una palabra o la palabra misma si no
 * está en ningún grupo de sinónimos.
 */
function canonizar(palabra) {
  return SINONIMOS_MAP[palabra] || palabra;
}

/**
 * ¿Dos palabras son sinónimas?
 */
function sonSinonimas(a, b) {
  if (a === b) return true;
  return canonizar(a) === canonizar(b);
}

// ═══════════════════════════════════════════════════════════════
// 3. LEVENSHTEIN (distancia de edición)
// ═══════════════════════════════════════════════════════════════
/**
 * Cuenta cuántas operaciones (inserción/borrado/sustitución) hay
 * que hacer para transformar `a` en `b`.
 * Implementación clásica con matriz reducida a 2 filas (O(min(n,m)) memoria).
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // borrar
        curr[j - 1] + 1,    // insertar
        prev[j - 1] + costo // sustituir
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * ¿Dos palabras son "casi iguales"? Tolera errores proporcionales
 * a la longitud (más permisivo en palabras largas).
 */
function casiIguales(a, b) {
  if (a === b) return true;
  // Una palabra pequeña dentro de otra → cuenta como match
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 4) return a === b;  // palabras cortas: match exacto

  const dist = levenshtein(a, b);
  const umbral = Math.max(1, Math.floor(maxLen / 4));
  return dist <= umbral;
}

// ═══════════════════════════════════════════════════════════════
// 4. EXTRACCIÓN DE CANTIDAD + UNIDAD
// ═══════════════════════════════════════════════════════════════
/**
 * De un texto como "2 kg pechuga campesina" extrae:
 *   { cantidad: 2, unidad: "kg", restoTexto: "pechuga campesina" }
 *
 * Maneja:
 *   - Números explícitos: "2", "2.5", "2,5"
 *   - Palabras-número: "un", "una", "dos", "media docena"
 *   - Sin cantidad explícita: devuelve cantidad 1
 *   - Unidad implícita: detecta "x500", "x1000" en el nombre
 */
function extraerCantidad(texto) {
  const textoNormCrudo = corregirOrtografia(normalizar(texto));

  // PROTEGER PRESENTACIONES: "x500", "x1000", "x2500" son parte del
  // nombre del producto, NO una cantidad. Las reemplazamos por placeholders
  // antes de buscar números, y las restauramos en el texto resto.
  const presentaciones = [];
  const textoNorm = textoNormCrudo.replace(/x\s*(\d{2,5})\b/gi, (match) => {
    presentaciones.push(match.replace(/\s+/g, ""));
    return `__PRES${presentaciones.length - 1}__`;
  });

  const restaurarPres = (txt) => {
    let r = txt;
    presentaciones.forEach((p, i) => {
      r = r.replace(`__pres${i}__`, p).replace(`__PRES${i}__`, p);
    });
    return r;
  };

  // CASO 1: número explícito al inicio (más prioritario)
  // Ej: "30 kg pechuga", "2.5 kilos muslo", "5 paquetes"
  const matchNum = textoNorm.match(
    /^(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos|k|libra|libras|lb|lbs|gramo|gramos|g|gr|unidad|unidades|und|u|uds|pieza|piezas|paquete|paquetes|paq|bolsa|bolsas|caja|cajas|cj)?\b(.*)$/i
  );
  if (matchNum) {
    const cantidad = parseFloat(matchNum[1].replace(",", "."));
    const unidad = matchNum[2] ? (UNIDADES[matchNum[2].toLowerCase()] || null) : null;
    const resto = restaurarPres((matchNum[3] || "").trim());
    if (cantidad > 0) {
      return { cantidad, unidad, restoTexto: resto };
    }
  }

  // CASO 2: número en cualquier parte del texto (excluyendo placeholders)
  const matchNumCualquiera = textoNorm.match(/(\d+(?:[.,]\d+)?)/);
  if (matchNumCualquiera) {
    const cantidad = parseFloat(matchNumCualquiera[1].replace(",", "."));
    // Buscar unidad cerca del número
    const tras = textoNorm.substring(matchNumCualquiera.index + matchNumCualquiera[0].length).trim();
    const matchUnidad = tras.match(/^(kg|kgs|kilo|kilos|k|libra|libras|lb|gramo|gramos|g|gr|unidad|unidades|und|u|paquete|paquetes|paq|bolsa|caja|cj)\b/i);
    let unidad = null;
    let resto = "";
    if (matchUnidad) {
      unidad = UNIDADES[matchUnidad[1].toLowerCase()] || null;
      resto = (textoNorm.substring(0, matchNumCualquiera.index) + " " + tras.substring(matchUnidad[0].length)).trim();
    } else {
      resto = (textoNorm.substring(0, matchNumCualquiera.index) + " " + tras).trim();
    }
    if (cantidad > 0) {
      return { cantidad, unidad, restoTexto: restaurarPres(resto) };
    }
  }

  // CASO 3: palabra-número ("un salchichón", "media docena de huevos")
  const palabras = textoNorm.split(/\s+/);
  for (let i = 0; i < palabras.length; i++) {
    if (PALABRAS_NUM[palabras[i]] !== undefined) {
      let cantidad = PALABRAS_NUM[palabras[i]];
      // Caso especial: "media docena" = 0.5 * 12 = 6
      if ((palabras[i] === "media" || palabras[i] === "medio") &&
          i + 1 < palabras.length &&
          PALABRAS_NUM[palabras[i + 1]] !== undefined &&
          PALABRAS_NUM[palabras[i + 1]] >= 2) {
        cantidad = 0.5 * PALABRAS_NUM[palabras[i + 1]];
        palabras.splice(i, 2);
      } else {
        palabras.splice(i, 1);
      }
      return {
        cantidad,
        unidad: null,
        restoTexto: restaurarPres(palabras.join(" ").trim()),
      };
    }
  }

  // CASO 4: sin cantidad ni palabra-número → asumimos 1
  return { cantidad: 1, unidad: null, restoTexto: restaurarPres(textoNorm) };
}

// ═══════════════════════════════════════════════════════════════
// 5. LIMPIEZA DEL TEXTO DEL PRODUCTO
// ═══════════════════════════════════════════════════════════════
/**
 * Quita palabras-basura del texto para dejar solo los términos
 * relevantes para identificar el producto.
 */
function limpiarTextoProducto(texto) {
  const palabras = normalizar(texto)
    .split(/\s+/)
    .filter((p) => p && !PALABRAS_BASURA.has(p));
  return palabras.join(" ");
}

// ═══════════════════════════════════════════════════════════════
// 6. SCORING: qué tan parecido es un texto a un producto del catálogo
// ═══════════════════════════════════════════════════════════════
/**
 * Devuelve un score de 0 a 100 que indica qué tan probable es que
 * `textoBusqueda` se refiera a `producto`.
 *
 * Reglas:
 *   - Match exacto del nombre completo: 100
 *   - Nombre del producto contiene la búsqueda: 85-95
 *   - La búsqueda contiene el nombre del producto: 80-90
 *   - Match por palabras clave + sinónimos: hasta 75
 *   - Match por Levenshtein: hasta 65
 *   - Bonus por número de presentación (x500, x1000, x2500): +15
 *   - Bonus por marca específica (Don Juan, Bucanero): +10
 *   - Penalización si la búsqueda menciona números que no aparecen
 *     en el producto: -10
 */
function calcularScore(textoBusqueda, producto) {
  const busqueda = corregirOrtografia(limpiarTextoProducto(textoBusqueda));
  const nombre = normalizar(producto.nombre);

  if (!busqueda || !nombre) return 0;

  // ── Match exacto ──
  if (busqueda === nombre) return 100;

  // ── Helper: ¿todas las palabras de A aparecen como palabras completas en B? ──
  const palabrasBusqueda = busqueda.split(/\s+/).filter((p) => p.length > 1);
  const palabrasProd = nombre.split(/\s+/).filter((p) => p.length > 1);

  if (palabrasBusqueda.length === 0) return 0;

  // ── Todas las palabras de búsqueda están en el producto (como palabras) ──
  const todasEnProducto = palabrasBusqueda.every((pb) => {
    const pbCanon = canonizar(pb);
    return palabrasProd.some((pp) => pp === pb || canonizar(pp) === pbCanon);
  });

  if (todasEnProducto) {
    // El producto contiene todas las palabras de la búsqueda
    // Score base alto + bonus por especificidad (qué tanto cubre)
    const cobertura = palabrasBusqueda.length / palabrasProd.length;
    return 85 + Math.min(10, cobertura * 12);
  }

  // ── Todas las palabras del producto están en la búsqueda ──
  const todasEnBusqueda = palabrasProd.every((pp) => {
    const ppCanon = canonizar(pp);
    return palabrasBusqueda.some((pb) => pb === pp || canonizar(pb) === ppCanon);
  });

  if (todasEnBusqueda) {
    return 80 + Math.min(8, (palabrasProd.length / palabrasBusqueda.length) * 8);
  }

  // ── Análisis palabra por palabra (matching parcial con tolerancia) ──
  let coincidenciasFuertes = 0; // exacto o sinónimo (palabra completa)
  let coincidenciasDebiles = 0; // Levenshtein

  for (const pb of palabrasBusqueda) {
    const pbCanon = canonizar(pb);
    let encontrado = false;

    for (const pp of palabrasProd) {
      if (pb === pp || pbCanon === canonizar(pp)) {
        coincidenciasFuertes++;
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      for (const pp of palabrasProd) {
        if (casiIguales(pb, pp) || casiIguales(pbCanon, canonizar(pp))) {
          coincidenciasDebiles++;
          encontrado = true;
          break;
        }
      }
    }
  }

  const totalCoinc = coincidenciasFuertes + coincidenciasDebiles * 0.6;
  const cobertura = totalCoinc / palabrasBusqueda.length;

  // Si menos del 40% de las palabras matchearon, descartar
  if (cobertura < 0.4) return 0;

  let score = cobertura * 60; // base hasta 60
  score += (coincidenciasFuertes / palabrasBusqueda.length) * 15; // bonus por matches fuertes

  // ── Bonus / penalización por número de presentación ──
  // Productos tienen formas como "x500", "x1000", "x2500"
  const numProd = nombre.match(/x\s*(\d+)/);
  const numBusq = busqueda.match(/x?\s*(\d{3,5})\b/);
  if (numProd && numBusq) {
    if (numProd[1] === numBusq[1]) {
      score += 18;
    } else {
      // Si la búsqueda especifica un número diferente, es muy probable
      // que se refiera a otro producto: penalizar.
      score -= 25;
    }
  } else if (numProd && !numBusq) {
    // Si el producto tiene número pero la búsqueda no, es válido pero
    // no especifica → score normal
  } else if (!numProd && numBusq) {
    // La búsqueda menciona un peso/cantidad pero el producto no
    // tiene presentación → leve penalización
    score -= 5;
  }

  // ── Bonus por marcas específicas ──
  if (nombre.includes("don juan") && busqueda.includes("don juan")) score += 10;
  if (nombre.includes("bucanero") && busqueda.includes("bucanero")) score += 8;
  if (nombre.includes("valentina") && busqueda.includes("valentina")) score += 8;

  // ── Bonus por especificación de tipo ──
  const tiposEspeciales = ["campesina", "campesino", "bbq", "picante", "blanca", "blanco"];
  for (const tipo of tiposEspeciales) {
    if (nombre.includes(tipo) && busqueda.includes(tipo)) score += 6;
  }

  return Math.min(100, Math.max(0, score));
}

// ═══════════════════════════════════════════════════════════════
// 7. BÚSQUEDA DE PRODUCTO con desambiguación
// ═══════════════════════════════════════════════════════════════
/**
 * Busca el producto que mejor coincida con `textoBusqueda`.
 *
 * Devuelve un objeto con estructura:
 *   {
 *     producto: <objeto del catálogo o null>,
 *     score: <0-100>,
 *     ambiguo: <bool>,
 *     candidatos: [<top 3 productos>],
 *   }
 *
 * UMBRAL_MIN: score mínimo para considerar un match válido.
 * UMBRAL_AMBIGUO: diferencia máxima entre top1 y top2 para considerar ambiguo.
 */
const UMBRAL_MIN = 35;
const UMBRAL_AMBIGUO = 8;

function buscarProducto(textoBusqueda, productos) {
  const scoreados = productos
    .map((p) => ({ producto: p, score: calcularScore(textoBusqueda, p) }))
    .filter((s) => s.score >= UMBRAL_MIN)
    .sort((a, b) => b.score - a.score);

  if (scoreados.length === 0) {
    return { producto: null, score: 0, ambiguo: false, candidatos: [] };
  }

  const top = scoreados[0];
  const segundo = scoreados[1];

  // Determinar si es ambiguo: hay un segundo candidato muy cerca
  // Solo se considera "no ambiguo" si el top es match exacto/casi perfecto (100).
  const ambiguo =
    !!segundo &&
    top.score - segundo.score < UMBRAL_AMBIGUO &&
    top.score < 100;

  return {
    producto: top.producto,
    score: top.score,
    ambiguo,
    candidatos: scoreados.slice(0, 3).map((s) => s.producto),
  };
}

// ═══════════════════════════════════════════════════════════════
// 8. PARSEO DE UN ITEM COMPLETO (cantidad + producto)
// ═══════════════════════════════════════════════════════════════
/**
 * Parsea una sola línea/frase como "30 kg pechuga campesina".
 * Devuelve:
 *   - Un item válido con {productoId, nombre, cantidad, unidad, precioUnit, subtotal}
 *   - O un objeto de error/ambigüedad con {error, candidatos}
 *   - O null si no detectó nada parseable
 */
function parsearItem(textoLinea, productos, esMayorista = false) {
  if (!textoLinea || !textoLinea.trim()) return null;

  // Extraer cantidad
  const { cantidad, unidad, restoTexto } = extraerCantidad(textoLinea);

  if (!restoTexto) return null;

  // Buscar producto
  const resultado = buscarProducto(restoTexto, productos);

  if (!resultado.producto) return null;

  // Si es ambiguo, devolver candidatos para que el bot pregunte
  if (resultado.ambiguo) {
    return {
      ambiguo: true,
      cantidad,
      unidad,
      textoOriginal: textoLinea,
      candidatos: resultado.candidatos,
    };
  }

  const producto = resultado.producto;

  // ── DETECCIÓN DE CONFLICTO DE UNIDADES ──
  // El cliente especificó una unidad explícita que es de categoría
  // distinta a la del producto. Ej: "25 kg alitas picantes" cuando
  // las alitas se venden por und (paquete).
  if (unidad) {
    const catCliente = CATEGORIA_UNIDAD[unidad];
    const catProducto = CATEGORIA_UNIDAD[producto.unidad];
    if (catCliente && catProducto && catCliente !== catProducto) {
      return {
        conflictoUnidad: true,
        producto,
        cantidad,
        unidadCliente: unidad,
        unidadProducto: producto.unidad,
        textoOriginal: textoLinea,
      };
    }
  }

  const precio = esMayorista && producto.precioMayor
    ? Number(producto.precioMayor)
    : Number(producto.precio);

  return {
    productoId: producto.id,
    nombre: producto.nombre,
    cantidad,
    unidad: producto.unidad,  // siempre usar la unidad oficial del producto
    precioUnit: precio,
    subtotal: cantidad * precio,
    matchScore: resultado.score,
  };
}

// ═══════════════════════════════════════════════════════════════
// 9. PARSEO DE PEDIDO COMPLETO (múltiples items)
// ═══════════════════════════════════════════════════════════════
/**
 * Parsea un mensaje que puede contener varios items separados por
 * comas, "y", saltos de línea, etc.
 *
 * Devuelve:
 *   {
 *     items: [<items válidos>],
 *     ambiguos: [<items con varios candidatos>],
 *     noEntendidos: [<fragmentos que no se pudieron parsear>]
 *   }
 */
function parsearPedido(texto, productos, esMayorista = false) {
  const items = [];
  const ambiguos = [];
  const conflictos = [];
  const noEntendidos = [];

  // PRE-PROCESAMIENTO: normalizar conectores compuestos a comas.
  const textoPreprocesado = texto
    .replace(/\s+y\s+tambi[eé]n\s+/gi, ", ")
    .replace(/\s+y\s+adem[aá]s\s+/gi, ", ")
    .replace(/\s+y\s+luego\s+/gi, ", ")
    .replace(/\s+y\s+otr[oa]\s+/gi, ", ")
    .replace(/\s+pero\s+tambi[eé]n\s+/gi, ", ")
    .replace(/\s+pero\s+adem[aá]s\s+/gi, ", ")
    .replace(/\s+m[aá]s\s+/gi, ", ")
    .replace(/\.\s+pero\s+/gi, ", ")
    .replace(/\.\s+tambi[eé]n\s+/gi, ", ");

  // Dividir por separadores
  const lineas = textoPreprocesado
    .split(REGEX_CONECTORES)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const linea of lineas) {
    const item = parsearItem(linea, productos, esMayorista);

    if (!item) {
      const limpio = limpiarTextoProducto(linea);
      if (limpio.length > 2) {
        noEntendidos.push(linea);
      }
      continue;
    }

    if (item.ambiguo) {
      ambiguos.push(item);
      continue;
    }

    if (item.conflictoUnidad) {
      conflictos.push(item);
      continue;
    }

    // Si ya existe el mismo producto, sumar cantidad
    const existing = items.find((i) => i.productoId === item.productoId);
    if (existing) {
      existing.cantidad += item.cantidad;
      existing.subtotal = existing.cantidad * existing.precioUnit;
    } else {
      items.push(item);
    }
  }

  return { items, ambiguos, conflictos, noEntendidos };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  normalizar,
  corregirOrtografia,
  canonizar,
  sonSinonimas,
  levenshtein,
  casiIguales,
  extraerCantidad,
  limpiarTextoProducto,
  calcularScore,
  buscarProducto,
  parsearItem,
  parsearPedido,
};

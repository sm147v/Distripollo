/**
 * 📖 DICCIONARIO SEMÁNTICO - Distripollo
 *
 * Datos que alimentan al parser semántico:
 *   • CORRECCIONES: errores ortográficos comunes → forma correcta
 *   • SINONIMOS: grupos de palabras que significan lo mismo
 *   • PALABRAS_NUM: "un", "dos", "media docena" → número
 *   • UNIDADES: variaciones de unidades de medida → unidad canónica
 *   • PALABRAS_BASURA: palabras a ignorar al parsear
 *   • PRODUCTOS_AMBIGUOS: claves cortas que requieren contexto adicional
 */

// ═══════════════════════════════════════════════════════════════
// CORRECCIONES ORTOGRÁFICAS COMUNES
// ═══════════════════════════════════════════════════════════════
// Estas se aplican DESPUÉS de quitar tildes y pasar a lowercase.
// Cubren los errores típicos que los clientes envían por WhatsApp.
const CORRECCIONES = {
  // Pechuga
  "pchuga": "pechuga", "pchga": "pechuga", "pechga": "pechuga",
  "pechuda": "pechuga", "pechuhga": "pechuga", "pechguita": "pechuguita",

  // Muslo
  "muselo": "muslo", "muzlo": "muslo", "musllo": "muslo",
  "muslito": "muslo", "musitlo": "muslo",

  // Contramuslo
  "contramusslo": "contramuslo", "contra muslo": "contramuslo",
  "contramuselo": "contramuslo",

  // Ala
  "alla": "ala", "alllita": "alita", "halla": "ala",

  // Salchichón / salchicha
  "salsicha": "salchicha", "salsicha manguera": "salchicha manguera",
  "salsichon": "salchichon", "salchicon": "salchichon", "salchichion": "salchichon",
  "salchchon": "salchichon",

  // Chorizo
  "chorrizo": "chorizo", "choriso": "chorizo", "chorisos": "chorizos",

  // Yuca
  "yucca": "yuca", "yucka": "yuca", "lluca": "yuca",

  // Bucanero
  "buccanero": "bucanero", "bucanerro": "bucanero", "buanero": "bucanero",
  "bucanerro": "bucanero",

  // Pollo
  "poyo": "pollo", "polllo": "pollo", "poio": "pollo",

  // Pernil
  "perni": "pernil", "perníl": "pernil",

  // Menudencia
  "menudensia": "menudencia", "menudensias": "menudencias",
  "menudo": "menudencia", "menudos": "menudencias",

  // Hígado
  "igado": "higado", "higadito": "higado", "higaditos": "higados",

  // Corazón
  "corazoncito": "corazon", "corasón": "corazon", "corason": "corazon",

  // Mollejas
  "moyejas": "mollejas", "molejas": "mollejas", "mojejas": "mollejas",

  // Costillar
  "costilar": "costillar", "costillas": "costillar", "costillita": "costillar",

  // Filete
  "filette": "filete", "fillete": "filete", "phylete": "filete",

  // Tocineta
  "tosineta": "tocineta", "tocinetta": "tocineta", "tozineta": "tocineta",

  // Nuggets
  "nuget": "nuggets", "nagets": "nuggets", "naguets": "nuggets",
  "nuggets": "nuggets",

  // Mantequilla
  "mantequiya": "mantequilla", "mantekilla": "mantequilla",

  // Queso
  "qeso": "queso", "ceso": "queso",

  // Costeño
  "costeno": "costeño", "costenio": "costeño",

  // Campesina
  "campesna": "campesina", "campzina": "campesina", "kampesina": "campesina",
};

// ═══════════════════════════════════════════════════════════════
// GRUPOS DE SINÓNIMOS
// ═══════════════════════════════════════════════════════════════
// Cada arreglo es un grupo: cualquiera de sus palabras se considera
// equivalente al resto durante la búsqueda.
// La PRIMERA palabra de cada grupo es la forma canónica.
const SINONIMOS = [
  // Partes del pollo
  ["ala", "alita", "alas", "alitas"],
  ["muslo", "muslos", "muslito", "muslitos"],
  ["pechuga", "pechugas", "pechuguita", "pechuguitas", "pechuga deshuesada"],
  ["contramuslo", "contramuslos", "contramuslito", "contramuslitos"],
  ["pernil", "perniles"],

  // Vísceras / menudencias
  ["menudencia", "menudencias"],
  ["molleja", "mollejas"],
  ["higado", "higados", "higaditos"],
  ["corazon", "corazones", "corazoncito"],
  ["pata", "patas", "patica", "paticas"],
  ["pescuezo", "pescuezos"],

  // Procesados
  ["chorizo", "chorizos", "choricito"],
  ["salchicha", "salchichas"],
  ["salchichon", "salchichones"],
  ["chuzo", "chuzos", "pincho", "pinchos"],
  ["minichuzo", "minichuzos"],
  ["nugget", "nuggets"],
  ["milanesa", "milanesas"],

  // Vegetales / acompañantes
  ["yuca", "yucas", "yuquita", "yuquitas"],
  ["papa", "papas", "papita", "papitas"],
  ["maiz", "maices", "maicito"],
  ["mix", "mixto", "mezclado"],

  // Lácteos
  ["mantequilla", "mantequillas"],
  ["queso", "quesos"],
  ["suero", "sueros"],

  // Pescado
  ["basa", "pescado"],
  ["posta", "postas", "filete pescado"],

  // Marcas / tipos
  ["campesino", "campesina", "campesinos", "campesinas", "criollo", "criolla"],
  ["bucanero", "buc", "marca bucanero"],
  ["blanco", "blanca", "blancos", "blancas"],
  ["entero", "entera", "completo", "completa"],
  ["deshuesada", "deshuesado", "sin hueso"],
  ["costeño", "costeno"],

  // Calientes / preparados
  ["bbq", "barbacoa", "barbecue"],
  ["picante", "picantes", "picosa", "picoso"],

  // Misc
  ["grasa", "grasas", "gordo"],
  ["hueso", "huesos"],
  ["recorte", "recortes", "recortería"],
  ["surtido", "surtidos", "variado"],
  ["entremuslo", "entremuslos"],
  ["tocineta", "tocinetas", "tocino"],
  ["caja", "cajas"],

  // Filetes Don Juan
  ["filete", "filetes", "filet"],
  ["don juan", "donjuan"],
  ["trocito", "trocitos", "trozos", "trozo"],
];

// ═══════════════════════════════════════════════════════════════
// PALABRAS → NÚMEROS
// ═══════════════════════════════════════════════════════════════
const PALABRAS_NUM = {
  // Determinantes singulares = 1
  "un": 1, "una": 1, "uno": 1, "unos": 1, "unas": 1,
  // Números literales
  "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
  "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
  "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
  "veinte": 20, "treinta": 30, "cuarenta": 40, "cincuenta": 50,
  // Fracciones
  "medio": 0.5, "media": 0.5,
  "cuarto": 0.25, "cuartos": 0.25,
  // Conjuntos
  "docena": 12, "docenas": 12,
  "par": 2, "pareja": 2,
};

// ═══════════════════════════════════════════════════════════════
// UNIDADES DE MEDIDA → unidad canónica
// ═══════════════════════════════════════════════════════════════
const UNIDADES = {
  // Peso (canónico: kg)
  "kg": "kg", "kgs": "kg", "kilo": "kg", "kilos": "kg", "k": "kg",
  "libra": "lb", "libras": "lb", "lb": "lb", "lbs": "lb",
  "gramo": "g", "gramos": "g", "g": "g", "gr": "g", "grs": "g",
  // Conteo (canónico: und)
  "unidad": "und", "unidades": "und", "und": "und", "u": "und", "uds": "und",
  "pieza": "und", "piezas": "und",
  // Paquetes (canónico: paq)
  "paquete": "paq", "paquetes": "paq", "paq": "paq", "paqs": "paq",
  "bolsa": "paq", "bolsas": "paq",
  // Cajas (canónico: caja)
  "caja": "caja", "cajas": "caja", "cj": "caja",
};

// Conversión entre unidades de peso (para futura normalización)
const CONVERSION_PESO = {
  "kg": 1,
  "lb": 0.4536,   // 1 lb ≈ 0.4536 kg
  "g": 0.001,     // 1 g = 0.001 kg
};

// ═══════════════════════════════════════════════════════════════
// CATEGORÍA DE UNIDAD: peso vs conteo
// ═══════════════════════════════════════════════════════════════
// Permite detectar conflictos cuando el cliente pide algo en kg pero
// el producto se vende por unidad/paquete (o viceversa).
//
// Ejemplo: "25 kg de alitas picantes" → conflicto porque alitas
// picantes se venden por und (paquete), no por kg.
const CATEGORIA_UNIDAD = {
  "kg":   "peso",
  "lb":   "peso",
  "g":    "peso",
  "und":  "conteo",
  "paq":  "conteo",
  "caja": "conteo",
};

// ═══════════════════════════════════════════════════════════════
// PALABRAS BASURA (se eliminan antes de parsear)
// ═══════════════════════════════════════════════════════════════
// Cortesía, relleno, conectores y verbos que no aportan al producto/cantidad
const PALABRAS_BASURA = new Set([
  // Cortesía
  "porfa", "porfavor", "favor", "porfis", "plis", "please",
  "gracias", "muchas", "amable", "amablemente",
  // Verbos de pedido (presente, imperativo)
  "necesito", "necesitamos", "necesita", "necesitaba",
  "quiero", "queremos", "quiere", "queria", "querria",
  "deme", "dame", "darme", "dar", "des", "dieras", "dieran",
  "diste", "dijiste", "dije", "dijo", "dijeron",
  "regalame", "regaleme", "regala",
  "llevame", "llevate", "llevenos",
  "envia", "enviame", "envien", "enviar",
  "manda", "mandame", "manden", "mandar",
  "vendeme", "venda", "venderme", "vender",
  "pasame", "pasenme", "pasar",
  "presta", "prestame", "prestar",
  "pone", "ponme", "poneme", "ponerle", "poner",
  "espero", "esperaba",
  // Pronombres y partículas
  "yo", "tu", "te", "me", "le", "se", "nos", "les",
  "mi", "ti", "el", "ella", "ellos", "ellas",
  // Conectores
  "y", "o", "u", "tambien", "ademas", "luego", "despues",
  "pero", "ahora", "ya", "entonces", "asi",
  // Verbos auxiliares / decir
  "que", "como", "cuando", "donde", "porque",
  "decia", "decias", "decias", "dicho",
  // Artículos / preposiciones / demostrativos
  "el", "la", "los", "las", "del", "de", "al", "a",
  "ese", "esa", "esos", "esas", "este", "esta", "estos", "estas",
  "aquel", "aquella", "aquello",
  // Preguntas / sí/no
  "hay", "tienes", "tiene", "tenes", "tendras", "tendrias",
  "estan", "estaban",
  // Otros rellenos
  "favor", "por", "para", "con", "sin",
  "solo", "solamente", "apenas",
  "muy", "mucho", "poco", "algo",
  "bien", "puede", "podria", "podras",
]);

// ═══════════════════════════════════════════════════════════════
// CONECTORES DE MULTI-ITEM
// ═══════════════════════════════════════════════════════════════
// Sirven para dividir un mensaje en items individuales.
// Ej: "2 kg pechuga, 1 kg muslo y 3 pollos"
//
// IMPORTANTE: " y " solo divide cuando va seguido de un número o de
// una palabra-número ("una/un/dos/..."). Esto evita partir nombres como
// "Salchichón mix de pollo y cerdo" en dos pedazos.
//
// Para conectores compuestos como "y también", "y luego", "pero también",
// hay pre-procesamiento adicional en parsearPedido() que los convierte a comas.
const REGEX_CONECTORES = /[\n,;]+|\s+\+\s+|\s+y\s+(?=\d|un\s|una\s|uno\s|unos\s|unas\s|dos\s|tres\s|cuatro\s|cinco\s|seis\s|siete\s|ocho\s|nueve\s|diez\s|once\s|doce\s|veinte\s|treinta\s|media\s|medio\s|docena\s|par\s)/gi;

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  CORRECCIONES,
  SINONIMOS,
  PALABRAS_NUM,
  UNIDADES,
  CONVERSION_PESO,
  CATEGORIA_UNIDAD,
  PALABRAS_BASURA,
  REGEX_CONECTORES,
};

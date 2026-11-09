// =====================================================================
// Tarea 4 - Big Data (UNAD)  |  Caso de uso: Tienda en línea (e-commerce)
// Script 1: creación de la BD, colecciones, validación, datos e índices
// Ejecutar: mongosh < 01_datos.js
// =====================================================================
use("tienda_online");
db.dropDatabase();

// ---------- Generador pseudoaleatorio determinista (resultados repetibles) ----------
let seed = 42;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;

// ---------- Colecciones con validación de esquema (buena práctica) ----------
db.createCollection("clientes", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["nombre", "email", "ciudad", "fecha_registro"],
    properties: {
      nombre: { bsonType: "string" },
      email: { bsonType: "string", pattern: "^.+@.+$" },
      ciudad: { bsonType: "string" },
      fecha_registro: { bsonType: "date" }
    } } }
});
db.createCollection("productos", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["nombre", "categoria", "precio", "stock"],
    properties: {
      precio: { bsonType: ["int", "double", "long"], minimum: 0 },
      stock: { bsonType: "int", minimum: 0 }
    } } }
});
db.createCollection("pedidos");

// ---------- Clientes (30) ----------
const nombres = ["Laura","Carlos","Andrea","Juan","Sofía","Miguel","Valentina","Daniel","Camila","Felipe",
                 "Natalia","Sebastián","Paula","Andrés","Daniela","Julián","Mariana","Esteban","Carolina","David"];
const apellidos = ["Gómez","Rodríguez","Martínez","López","Hernández","Pérez","Ramírez","Torres","Díaz","Vargas"];
const ciudades = ["Bogotá","Medellín","Cali","Barranquilla","Bucaramanga","Cartagena","Pereira"];
const clientes = [];
for (let i = 1; i <= 30; i++) {
  const n = pick(nombres), a = pick(apellidos);
  clientes.push({
    _id: i,
    nombre: `${n} ${a}`,
    email: `${n}.${a}${i}@correo.com`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
    ciudad: pick(ciudades),
    telefonos: [`3${int(10,23)}${int(1000000,9999999)}`],
    fecha_registro: new Date(2024, int(0, 11), int(1, 28)),
    activo: rnd() > 0.1
  });
}
db.clientes.insertMany(clientes);

// ---------- Productos (40) ----------
const catalogo = {
  "Tecnología": ["Portátil", "Mouse inalámbrico", "Teclado mecánico", "Monitor 24\"", "Audífonos Bluetooth", "Disco SSD 1TB", "Webcam HD", "Parlante portátil"],
  "Hogar":      ["Licuadora", "Cafetera", "Lámpara LED", "Juego de sábanas", "Aspiradora", "Ventilador", "Olla arrocera", "Organizador"],
  "Deportes":   ["Balón de fútbol", "Bicicleta", "Pesas 10kg", "Tapete yoga", "Guantes gimnasio", "Zapatillas running", "Botella térmica", "Cuerda saltar"],
  "Libros":     ["Big Data en la práctica", "Python para datos", "Bases de datos NoSQL", "Algoritmos", "Redes de computadores", "Estadística aplicada", "IA moderna", "Cloud Computing"],
  "Moda":       ["Camiseta", "Jean", "Chaqueta", "Gorra", "Mochila", "Tenis casuales", "Reloj", "Cinturón"]
};
const productos = [];
let pid = 1;
for (const [cat, lista] of Object.entries(catalogo)) {
  for (const nom of lista) {
    productos.push({
      _id: pid++,
      nombre: nom,
      categoria: cat,
      precio: int(15, 400) * 1000,
      stock: int(0, 120),
      etiquetas: [cat.toLowerCase(), pick(["oferta", "nuevo", "popular", "premium"])],
      especificaciones: { marca: pick(["Alfa", "Beta", "Gamma", "Delta"]), garantia_meses: pick([6, 12, 24]) }
    });
  }
}
db.productos.insertMany(productos);

// ---------- Pedidos (150): items incrustados (embedding) ----------
const estados = ["pagado", "enviado", "entregado", "cancelado"];
const metodos = ["tarjeta", "PSE", "contraentrega", "nequi"];
const pedidos = [];
for (let i = 1; i <= 150; i++) {
  const nItems = int(1, 4), items = [];
  const usados = new Set();
  while (items.length < nItems) {
    const p = pick(productos);
    if (usados.has(p._id)) continue;
    usados.add(p._id);
    items.push({ producto_id: p._id, nombre: p.nombre, categoria: p.categoria, cantidad: int(1, 3), precio_unitario: p.precio });
  }
  pedidos.push({
    _id: i,
    cliente_id: int(1, 30),
    fecha: new Date(2025, int(0, 11), int(1, 28), int(0, 23), int(0, 59)),
    estado: pick(estados),
    metodo_pago: pick(metodos),
    items: items,
    total: items.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0)
  });
}
db.pedidos.insertMany(pedidos);

// ---------- Índices (optimización de consultas) ----------
db.clientes.createIndex({ email: 1 }, { unique: true });
db.clientes.createIndex({ ciudad: 1 });
db.productos.createIndex({ categoria: 1, precio: -1 });
db.pedidos.createIndex({ cliente_id: 1, fecha: -1 });
db.pedidos.createIndex({ estado: 1 });
db.pedidos.createIndex({ "items.producto_id": 1 });

print("clientes : " + db.clientes.countDocuments());
print("productos: " + db.productos.countDocuments());
print("pedidos  : " + db.pedidos.countDocuments());
print("TOTAL documentos: " + (db.clientes.countDocuments() + db.productos.countDocuments() + db.pedidos.countDocuments()));

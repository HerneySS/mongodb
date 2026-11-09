// =====================================================================
// Tarea 4 - Big Data (UNAD)  |  Base de datos: tienda_online
// Script 2: consultas (CRUD, filtros/operadores, join con $lookup, agregaciones)
// Ejecutar: mongosh < 02_consultas.js
// =====================================================================
use("tienda_online");
const t = (titulo) => print("\n==== " + titulo + " ====");

// ------------------------------- 1. CRUD -------------------------------
t("1.1 INSERT: nuevo cliente (insertOne)");
printjson(db.clientes.insertOne({
  _id: 31, nombre: "Ana Prueba", email: "ana.prueba31@correo.com", ciudad: "Bogotá",
  telefonos: ["3101234567"], fecha_registro: new Date(), activo: true
}));

t("1.2 INSERT: varios productos (insertMany)");
printjson(db.productos.insertMany([
  { _id: 41, nombre: "Tablet 10\"", categoria: "Tecnología", precio: 850000, stock: 15, etiquetas: ["tecnología", "nuevo"], especificaciones: { marca: "Alfa", garantia_meses: 12 } },
  { _id: 42, nombre: "Smartwatch",  categoria: "Tecnología", precio: 420000, stock: 30, etiquetas: ["tecnología", "popular"], especificaciones: { marca: "Beta", garantia_meses: 12 } }
]).insertedIds);

t("1.3 SELECT: 5 clientes de Bogotá (find + proyección + sort + limit)");
db.clientes.find({ ciudad: "Bogotá" }, { _id: 0, nombre: 1, email: 1, ciudad: 1 }).sort({ nombre: 1 }).limit(5).forEach(printjson);

t("1.4 SELECT: un pedido por _id (findOne)");
printjson(db.pedidos.findOne({ _id: 1 }));

t("1.5 UPDATE: bajar 10% el precio de la categoría Libros (updateMany + $mul)");
printjson(db.productos.updateMany({ categoria: "Libros" }, { $mul: { precio: 0.9 } }));

t("1.6 UPDATE: sumar stock y agregar etiqueta (updateOne + $inc + $addToSet)");
printjson(db.productos.updateOne({ _id: 41 }, { $inc: { stock: 10 }, $addToSet: { etiquetas: "oferta" } }));

t("1.7 DELETE: eliminar el cliente de prueba (deleteOne)");
printjson(db.clientes.deleteOne({ _id: 31 }));

t("1.8 DELETE: eliminar los productos de prueba (deleteMany)");
printjson(db.productos.deleteMany({ _id: { $in: [41, 42] } }));

// ------------------------- 2. FILTROS Y OPERADORES ---------------------
t("2.1 Productos de Tecnología con precio entre 100.000 y 300.000 ($and, $gte, $lte)");
db.productos.find({ $and: [{ categoria: "Tecnología" }, { precio: { $gte: 100000, $lte: 300000 } }] },
                  { _id: 0, nombre: 1, precio: 1 }).forEach(printjson);

t("2.2 Pedidos pagados o enviados con total > 1.000.000 ($or, $in, $gt)");
print("Cantidad: " + db.pedidos.countDocuments({ estado: { $in: ["pagado", "enviado"] }, total: { $gt: 1000000 } }));

t("2.3 Clientes en Cali, Medellín o Pereira, activos ($in)");
db.clientes.find({ ciudad: { $in: ["Cali", "Medellín", "Pereira"] }, activo: true }, { _id: 0, nombre: 1, ciudad: 1 }).limit(5).forEach(printjson);

t("2.4 Pedidos que contengan un ítem con cantidad >= 3 ($elemMatch)");
print("Cantidad: " + db.pedidos.countDocuments({ items: { $elemMatch: { cantidad: { $gte: 3 } } } }));

t("2.5 Búsqueda por expresión regular: libros que contengan 'datos' ($regex)");
db.productos.find({ nombre: { $regex: "datos", $options: "i" } }, { _id: 0, nombre: 1, categoria: 1 }).forEach(printjson);

t("2.6 Valores distintos: ciudades de los clientes (distinct)");
printjson(db.clientes.distinct("ciudad"));

// ---------------------------- 3. JOIN ($lookup) ------------------------
t("3.1 JOIN pedidos -> clientes: 5 pedidos con el nombre y ciudad del cliente");
db.pedidos.aggregate([
  { $lookup: { from: "clientes", localField: "cliente_id", foreignField: "_id", as: "cliente" } },
  { $unwind: "$cliente" },
  { $project: { _id: 1, estado: 1, total: 1, "cliente.nombre": 1, "cliente.ciudad": 1 } },
  { $limit: 5 }
]).forEach(printjson);

t("3.2 JOIN pedidos -> productos (por ítem): detalle de unidades y marca del producto vendido");
db.pedidos.aggregate([
  { $unwind: "$items" },
  { $lookup: { from: "productos", localField: "items.producto_id", foreignField: "_id", as: "prod" } },
  { $unwind: "$prod" },
  { $group: { _id: "$prod.especificaciones.marca", unidades: { $sum: "$items.cantidad" } } },
  { $sort: { unidades: -1 } }
]).forEach(printjson);

t("3.3 JOIN: clientes con menos pedidos (lookup + $size + sort)");
db.clientes.aggregate([
  { $lookup: { from: "pedidos", localField: "_id", foreignField: "cliente_id", as: "compras" } },
  { $project: { _id: 0, nombre: 1, ciudad: 1, num_pedidos: { $size: "$compras" } } },
  { $sort: { num_pedidos: 1 } }, { $limit: 5 }
]).forEach(printjson);

// ------------------------- 4. AGREGACIONES -----------------------------
t("4.1 CONTAR: pedidos por estado ($group + $sum:1)");
db.pedidos.aggregate([{ $group: { _id: "$estado", pedidos: { $sum: 1 } } }, { $sort: { pedidos: -1 } }]).forEach(printjson);

t("4.2 SUMAR: ventas totales por método de pago (excluye cancelados)");
db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  { $group: { _id: "$metodo_pago", ventas: { $sum: "$total" } } },
  { $sort: { ventas: -1 } }
]).forEach(printjson);

t("4.3 PROMEDIAR: valor promedio, mínimo y máximo de pedido por estado");
db.pedidos.aggregate([
  { $group: { _id: "$estado", promedio: { $avg: "$total" }, minimo: { $min: "$total" }, maximo: { $max: "$total" } } },
  { $project: { promedio: { $round: ["$promedio", 0] }, minimo: 1, maximo: 1 } }
]).forEach(printjson);

t("4.4 Top 5 productos más vendidos (unidades e ingresos)");
db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  { $unwind: "$items" },
  { $group: { _id: "$items.nombre", unidades: { $sum: "$items.cantidad" },
              ingresos: { $sum: { $multiply: ["$items.cantidad", "$items.precio_unitario"] } } } },
  { $sort: { unidades: -1 } }, { $limit: 5 }
]).forEach(printjson);

t("4.5 Ventas por mes de 2025 ($month)");
db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  { $group: { _id: { $month: "$fecha" }, pedidos: { $sum: 1 }, ventas: { $sum: "$total" } } },
  { $sort: { _id: 1 } }
]).forEach(printjson);

t("4.6 Top 5 clientes por gasto total (join + group)");
db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  { $group: { _id: "$cliente_id", gasto: { $sum: "$total" }, pedidos: { $sum: 1 } } },
  { $sort: { gasto: -1 } }, { $limit: 5 },
  { $lookup: { from: "clientes", localField: "_id", foreignField: "_id", as: "c" } },
  { $unwind: "$c" },
  { $project: { _id: 0, cliente: "$c.nombre", ciudad: "$c.ciudad", pedidos: 1, gasto: 1 } }
]).forEach(printjson);

t("4.7 Precio promedio y stock total por categoría de producto");
db.productos.aggregate([
  { $group: { _id: "$categoria", productos: { $sum: 1 }, precio_prom: { $avg: "$precio" }, stock_total: { $sum: "$stock" } } },
  { $project: { productos: 1, stock_total: 1, precio_prom: { $round: ["$precio_prom", 0] } } },
  { $sort: { precio_prom: -1 } }
]).forEach(printjson);

// ------------------------- 5. OPTIMIZACIÓN -----------------------------
t("5.1 explain(): la consulta por cliente usa el índice cliente_id_1_fecha_-1");
const plan = db.pedidos.find({ cliente_id: 5 }).sort({ fecha: -1 }).explain("executionStats");
print("Etapa ganadora : " + plan.queryPlanner.winningPlan.stage + " -> " + (plan.queryPlanner.winningPlan.inputStage || {}).stage);
print("Índice usado   : " + (plan.queryPlanner.winningPlan.inputStage || {}).indexName);
print("Docs examinados: " + plan.executionStats.totalDocsExamined + " | devueltos: " + plan.executionStats.nReturned);

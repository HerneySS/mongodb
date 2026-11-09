# MongoDB – Tienda en línea

Tarea 4 – Almacenamiento y Consultas de Datos en Big Data (UNAD, curso 202016911).

Base de datos `tienda_online` en MongoDB con tres colecciones:

| Colección | Documentos | Descripción |
|---|---|---|
| `clientes` | 30 | Datos del cliente, con validación de esquema y email único |
| `productos` | 40 | Catálogo con etiquetas y especificaciones anidadas |
| `pedidos` | 150 | Pedidos con los ítems incrustados |

Total: 220 documentos.

## Archivos

- `01_datos.js`: crea la base, la validación `$jsonSchema`, los datos de prueba (generador determinista) y los índices.
- `02_consultas.js`: consultas CRUD, filtros y operadores, uniones con `$lookup`, agregaciones y `explain()`.
- `resultados_consultas.txt`: salida de la ejecución de `02_consultas.js`.

## Cómo ejecutarlo con Docker

```bash
docker run -d --name mongo_tarea4 -p 27017:27017 mongo:7
docker cp 01_datos.js mongo_tarea4:/tmp/
docker cp 02_consultas.js mongo_tarea4:/tmp/
docker exec mongo_tarea4 mongosh --quiet --file /tmp/01_datos.js
docker exec mongo_tarea4 mongosh --quiet --file /tmp/02_consultas.js
```

Para consultar de forma interactiva:

```bash
docker exec -it mongo_tarea4 mongosh tienda_online
```

## Autor

Herney Andres Samboni Samboni

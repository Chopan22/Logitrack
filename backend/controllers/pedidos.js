const db = require('../config/db');
const { geocodificar } = require('../services/geocoding');

const listar = async (req, res) => {
    const { estado, ruta_id } = req.query;
    const condiciones = [];
    const params = [];

    if (estado) {
        params.push(estado);
        condiciones.push(`estado = $${params.length}`);
    }
    if (ruta_id) {
        params.push(ruta_id);
        condiciones.push(`ruta_id = $${params.length}`);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await db.query(
        `SELECT *,
                ST_Y(coordenadas_destino) AS lat,
                ST_X(coordenadas_destino) AS lng
         FROM pedidos ${where} ORDER BY creado_en DESC`,
        params
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { descripcion, direccion_destino, cliente_nombre, cliente_telefono, lat, lng } = req.body;

    if (!direccion_destino) {
        return res.status(400).json({ error: 'direccion_destino es requerida' });
    }

    // Si no llegan coordenadas, se geocodifica la direccion automaticamente.
    let finalLat = lat;
    let finalLng = lng;
    if (finalLat == null || finalLng == null) {
        const geo = await geocodificar(direccion_destino);
        if (geo) {
            finalLat = geo.lat;
            finalLng = geo.lng;
        }
    }

    const coordenadas = finalLat != null && finalLng != null
        ? `ST_SetSRID(ST_MakePoint(${parseFloat(finalLng)}, ${parseFloat(finalLat)}), 4326)`
        : null;

    const result = await db.query(
        `INSERT INTO pedidos (descripcion, direccion_destino, coordenadas_destino, cliente_nombre, cliente_telefono)
         VALUES ($1, $2, ${coordenadas ? coordenadas : 'NULL'}, $3, $4)
         RETURNING *,
                   ST_Y(coordenadas_destino) AS lat,
                   ST_X(coordenadas_destino) AS lng`,
        [descripcion, direccion_destino, cliente_nombre, cliente_telefono]
    );
    res.status(201).json(result.rows[0]);
};

const actualizar = async (req, res) => {
    const { id } = req.params;
    const { descripcion, direccion_destino, cliente_nombre, cliente_telefono, estado } = req.body;

    const result = await db.query(
        `UPDATE pedidos
         SET descripcion       = COALESCE($1, descripcion),
             direccion_destino = COALESCE($2, direccion_destino),
             cliente_nombre    = COALESCE($3, cliente_nombre),
             cliente_telefono  = COALESCE($4, cliente_telefono),
             estado            = COALESCE($5, estado)
         WHERE id = $6
         RETURNING *`,
        [descripcion, direccion_destino, cliente_nombre, cliente_telefono, estado, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(result.rows[0]);
};

const asignar = async (req, res) => {
    const { id } = req.params;
    const { ruta_id } = req.body;

    if (!ruta_id) {
        return res.status(400).json({ error: 'ruta_id es requerido' });
    }

    const ruta = await db.query(
        `SELECT id FROM rutas WHERE id = $1 AND estado = 'en_curso'`,
        [ruta_id]
    );
    if (ruta.rows.length === 0) {
        return res.status(404).json({ error: 'Ruta no encontrada o no está en curso' });
    }

    const result = await db.query(
        `UPDATE pedidos
         SET ruta_id = $1, estado = 'en_camino'
         WHERE id = $2 AND estado = 'pendiente'
         RETURNING *`,
        [ruta_id, id]
    );

    if (result.rows.length === 0) {
        return res.status(409).json({ error: 'Pedido no encontrado o no está pendiente' });
    }
    res.json(result.rows[0]);
};

// Endpoint PUBLICO para que el cliente final siga su pedido (sin login).
// Devuelve solo informacion segura del pedido y la ultima ubicacion del repartidor.
const tracking = async (req, res) => {
    const { id } = req.params;

    const pedidoRes = await db.query(
        `SELECT id, descripcion, direccion_destino, estado, ruta_id,
                cliente_nombre,
                ST_Y(coordenadas_destino) AS lat,
                ST_X(coordenadas_destino) AS lng
         FROM pedidos
         WHERE id = $1`,
        [id]
    );

    if (pedidoRes.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoRes.rows[0];

    // Ultima ubicacion conocida del repartidor en esa ruta (si existe).
    let ubicacion = null;
    if (pedido.ruta_id) {
        const ubiRes = await db.query(
            `SELECT ST_Y(coordenadas) AS lat,
                    ST_X(coordenadas) AS lng,
                    fecha_hora
             FROM ubicaciones
             WHERE ruta_id = $1
             ORDER BY fecha_hora DESC
             LIMIT 1`,
            [pedido.ruta_id]
        );
        if (ubiRes.rows.length > 0) ubicacion = ubiRes.rows[0];
    }

    res.json({ pedido, ubicacion });
};

module.exports = { listar, crear, actualizar, asignar, tracking };

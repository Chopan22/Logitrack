const db = require('../config/db');

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
        `SELECT * FROM pedidos ${where} ORDER BY creado_en DESC`,
        params
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { descripcion, direccion_destino, cliente_nombre, cliente_telefono, lat, lng } = req.body;

    if (!direccion_destino) {
        return res.status(400).json({ error: 'direccion_destino es requerida' });
    }

    const coordenadas = lat && lng
        ? `ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)`
        : null;

    const result = await db.query(
        `INSERT INTO pedidos (descripcion, direccion_destino, coordenadas_destino, cliente_nombre, cliente_telefono)
         VALUES ($1, $2, ${coordenadas ? coordenadas : 'NULL'}, $3, $4)
         RETURNING *`,
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

module.exports = { listar, crear, actualizar, asignar };

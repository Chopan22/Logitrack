const db = require('../config/db');

const listar = async (req, res) => {
    const { estado } = req.query;

    const conditions = estado ? 'WHERE r.estado = $1' : '';
    const params = estado ? [estado] : [];

    const result = await db.query(
        `SELECT r.id, r.estado, r.inicio, r.fin,
                v.patente, v.alias AS vehiculo_alias,
                c.nombre AS conductor_nombre
         FROM rutas r
         JOIN vehiculos v   ON r.vehiculo_id  = v.id
         JOIN conductores c ON r.conductor_id = c.id
         ${conditions}
         ORDER BY r.inicio DESC`,
        params
    );
    res.json(result.rows);
};

const iniciar = async (req, res) => {
    const { vehiculo_id, conductor_id } = req.body;

    if (!vehiculo_id || !conductor_id) {
        return res.status(400).json({ error: 'vehiculo_id y conductor_id son requeridos' });
    }

    const activa = await db.query(
        `SELECT id FROM rutas WHERE vehiculo_id = $1 AND estado = 'en_curso'`,
        [vehiculo_id]
    );
    if (activa.rows.length > 0) {
        return res.status(409).json({ error: 'El vehículo ya tiene una ruta en curso' });
    }

    const result = await db.query(
        `INSERT INTO rutas (vehiculo_id, conductor_id, estado)
         VALUES ($1, $2, 'en_curso')
         RETURNING *`,
        [vehiculo_id, conductor_id]
    );
    res.status(201).json(result.rows[0]);
};

const cerrar = async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        `UPDATE rutas
         SET estado = 'completada', fin = NOW()
         WHERE id = $1 AND estado = 'en_curso'
         RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ruta no encontrada o ya cerrada' });
    }
    res.json(result.rows[0]);
};

module.exports = { listar, iniciar, cerrar };

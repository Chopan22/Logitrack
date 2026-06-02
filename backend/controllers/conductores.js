const db = require('../config/db');

const listar = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM conductores ORDER BY id'
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { nombre, telefono } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await db.query(
        'INSERT INTO conductores (nombre, telefono) VALUES ($1, $2) RETURNING *',
        [nombre, telefono]
    );
    res.status(201).json(result.rows[0]);
};

const actualizar = async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, activo } = req.body;

    const result = await db.query(
        `UPDATE conductores
         SET nombre    = COALESCE($1, nombre),
             telefono  = COALESCE($2, telefono),
             activo    = COALESCE($3, activo)
         WHERE id = $4
         RETURNING *`,
        [nombre, telefono, activo, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conductor no encontrado' });
    }
    res.json(result.rows[0]);
};

module.exports = { listar, crear, actualizar };

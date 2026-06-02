const db = require('../config/db');

const listar = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM vehiculos ORDER BY id'
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { patente, alias, tipo } = req.body;

    if (!patente) {
        return res.status(400).json({ error: 'La patente es requerida' });
    }

    const result = await db.query(
        'INSERT INTO vehiculos (patente, alias, tipo) VALUES ($1, $2, $3) RETURNING *',
        [patente.toUpperCase(), alias, tipo]
    );
    res.status(201).json(result.rows[0]);
};

const actualizar = async (req, res) => {
    const { id } = req.params;
    const { alias, tipo, activo } = req.body;

    const result = await db.query(
        `UPDATE vehiculos
         SET alias = COALESCE($1, alias),
             tipo  = COALESCE($2, tipo),
             activo = COALESCE($3, activo)
         WHERE id = $4
         RETURNING *`,
        [alias, tipo, activo, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json(result.rows[0]);
};

module.exports = { listar, crear, actualizar };

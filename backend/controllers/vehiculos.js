const db = require('../config/db');
const { validarPatente, validarTexto, validarBooleano } = require('../utils/validar');

const listar = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM vehiculos ORDER BY id'
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { patente, alias, tipo } = req.body;

    const errorPatente = validarPatente(patente);
    if (errorPatente) {
        return res.status(400).json({ error: errorPatente });
    }

    const duplicado = await db.query(
        'SELECT id FROM vehiculos WHERE patente = $1',
        [patente.trim().toUpperCase()]
    );
    if (duplicado.rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe un vehículo con esa patente' });
    }

    const result = await db.query(
        'INSERT INTO vehiculos (patente, alias, tipo) VALUES ($1, $2, $3) RETURNING *',
        [patente.trim().toUpperCase(), alias, tipo]
    );
    res.status(201).json(result.rows[0]);
};

const actualizar = async (req, res) => {
    const { id } = req.params;
    const { alias, tipo, activo } = req.body;

    if (alias != null) {
        const errorAlias = validarTexto(alias, 'El alias', { min: 1, max: 50 });
        if (errorAlias) return res.status(400).json({ error: errorAlias });
    }
    const errorActivo = validarBooleano(activo, 'activo');
    if (errorActivo) return res.status(400).json({ error: errorActivo });

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

// Baja logica: el vehiculo queda inactivo pero se conserva para que
// el historial de rutas y entregas siga mostrando sus datos.
const eliminar = async (req, res) => {
    const { id } = req.params;

    const enCurso = await db.query(
        `SELECT id FROM rutas WHERE vehiculo_id = $1 AND estado = 'en_curso'`,
        [id]
    );
    if (enCurso.rows.length > 0) {
        return res.status(409).json({
            error: 'El vehículo tiene una ruta en curso; ciérrala antes de darlo de baja',
        });
    }

    const result = await db.query(
        `UPDATE vehiculos
         SET activo = false
         WHERE id = $1 AND activo = true
         RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehículo no encontrado o ya está de baja' });
    }
    res.json({ mensaje: 'Vehículo dado de baja', vehiculo: result.rows[0] });
};

module.exports = { listar, crear, actualizar, eliminar };

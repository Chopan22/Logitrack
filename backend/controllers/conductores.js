const db = require('../config/db');
const { validarTelefono, validarTexto, validarBooleano } = require('../utils/validar');

const listar = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM conductores ORDER BY id'
    );
    res.json(result.rows);
};

const crear = async (req, res) => {
    const { nombre, telefono } = req.body;

    const errorNombre = validarTexto(nombre, 'El nombre', { min: 3, max: 80 });
    if (errorNombre) {
        return res.status(400).json({ error: errorNombre });
    }
    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) {
        return res.status(400).json({ error: errorTelefono });
    }

    const result = await db.query(
        'INSERT INTO conductores (nombre, telefono) VALUES ($1, $2) RETURNING *',
        [nombre.trim(), telefono]
    );
    res.status(201).json(result.rows[0]);
};

const actualizar = async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, activo } = req.body;

    if (nombre != null) {
        const errorNombre = validarTexto(nombre, 'El nombre', { min: 3, max: 80 });
        if (errorNombre) return res.status(400).json({ error: errorNombre });
    }
    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) return res.status(400).json({ error: errorTelefono });
    const errorActivo = validarBooleano(activo, 'activo');
    if (errorActivo) return res.status(400).json({ error: errorActivo });

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

// Baja logica: el conductor queda inactivo pero se conserva para que
// el historial de rutas y entregas siga mostrando su nombre.
const eliminar = async (req, res) => {
    const { id } = req.params;

    const enCurso = await db.query(
        `SELECT id FROM rutas WHERE conductor_id = $1 AND estado = 'en_curso'`,
        [id]
    );
    if (enCurso.rows.length > 0) {
        return res.status(409).json({
            error: 'El conductor tiene una ruta en curso; ciérrala antes de darlo de baja',
        });
    }

    const result = await db.query(
        `UPDATE conductores
         SET activo = false
         WHERE id = $1 AND activo = true
         RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conductor no encontrado o ya está de baja' });
    }
    res.json({ mensaje: 'Conductor dado de baja', conductor: result.rows[0] });
};

module.exports = { listar, crear, actualizar, eliminar };

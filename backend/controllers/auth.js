const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registro = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'nombre, email y password son requeridos' });
    }

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
        return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
        `INSERT INTO usuarios (nombre, email, password, rol)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nombre, email, rol, creado_en`,
        [nombre, email, hash, rol || 'admin']
    );

    res.status(201).json(result.rows[0]);
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
};

module.exports = { registro, login };

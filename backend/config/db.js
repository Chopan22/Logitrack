const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Función para probar la conexión y la extensión espacial
const testConnection = async () => {
    try {
        const res = await pool.query('SELECT PostGIS_Version();');
        console.log('🟢 Conexión a la Base de Datos exitosa.');
        console.log('🌍 Versión de PostGIS detectada:', res.rows.postgis_version);
    } catch (err) {
        console.error('🔴 Error conectando a la Base de Datos:', err.message);
    }
};

testConnection();

module.exports = pool;
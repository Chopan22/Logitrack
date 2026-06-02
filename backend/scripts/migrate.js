const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function ensureMigrationsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS _migraciones (
            id          SERIAL PRIMARY KEY,
            nombre      VARCHAR(255) UNIQUE NOT NULL,
            aplicada_en TIMESTAMP DEFAULT NOW()
        )
    `);
}

async function getAppliedMigrations() {
    const result = await db.query('SELECT nombre FROM _migraciones ORDER BY nombre');
    return result.rows.map(row => row.nombre);
}

async function runMigrations() {
    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const pending = files.filter(f => !applied.includes(f));

    if (pending.length === 0) {
        console.log('✅ No hay migraciones pendientes.');
        return;
    }

    for (const file of pending) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`⏳ Aplicando: ${file}`);
        await db.query(sql);
        await db.query('INSERT INTO _migraciones (nombre) VALUES ($1)', [file]);
        console.log(`✅ Completada: ${file}`);
    }

    console.log(`\n🎉 ${pending.length} migración(es) aplicada(s).`);
}

runMigrations()
    .catch(err => {
        console.error('❌ Error en migración:', err.message);
        process.exit(1);
    })
    .finally(() => db.end());

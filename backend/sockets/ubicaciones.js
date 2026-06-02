const db = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`🟢 Cliente conectado: ${socket.id}`);

        socket.on('enviar_ubicacion', async (data) => {
            const { ruta_id, lat, lng } = data;

            if (!ruta_id || lat == null || lng == null) {
                return socket.emit('error', { mensaje: 'ruta_id, lat y lng son requeridos' });
            }

            const ruta = await db.query(
                `SELECT id FROM rutas WHERE id = $1 AND estado = 'en_curso'`,
                [ruta_id]
            );
            if (ruta.rows.length === 0) {
                return socket.emit('error', { mensaje: 'Ruta no encontrada o no está en curso' });
            }

            await db.query(
                `INSERT INTO ubicaciones (ruta_id, coordenadas)
                 VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326))`,
                [ruta_id, lng, lat]
            );

            io.emit('nueva_ubicacion', { ruta_id, lat, lng });
        });

        socket.on('disconnect', () => {
            console.log(`🔴 Cliente desconectado: ${socket.id}`);
        });
    });
};

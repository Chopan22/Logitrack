const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Al importar esto, se ejecutará el testConnection() automáticamente
const db = require('./config/db'); 

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba
// Ruta temporal para inicializar la base de datos
app.get('/api/setup', async (req, res) => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS ubicaciones (
                id SERIAL PRIMARY KEY,
                vehiculo_id VARCHAR(50) NOT NULL,
                coordenadas GEOMETRY(Point, 4326),
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(query);
        res.json({ message: '✅ Tabla de ubicaciones creada con soporte espacial (SRID 4326)' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando la tabla' });
    }
});

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// Crear el servidor HTTP usando Express
const server = http.createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
const io = new Server(server, {
    cors: {
        origin: "*", // En producción limitaremos esto al dominio del frontend
        methods: ["GET", "POST"]
    }
});

// Escuchar conexiones de clientes (Frontend o App Móvil)
io.on('connection', (socket) => {
    console.log(`🟢 Nuevo cliente conectado: ${socket.id}`);

    // Escuchar el evento cuando un vehículo envía su GPS
    socket.on('enviar_ubicacion', async (data) => {
        console.log('📍 Ubicación recibida:', data);
        
        // 1. Guardar en la Base de Datos con formato PostGIS
        try {
            const query = `
                INSERT INTO ubicaciones (vehiculo_id, coordenadas) 
                VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326))
            `;
            await db.query(query, [data.vehiculo_id, data.lng, data.lat]);
            
            // 2. Re-transmitir la ubicación a todos los clientes web conectados
            io.emit('nueva_ubicacion', data);
            
        } catch (error) {
            console.error('Error guardando ubicación:', error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Cliente desconectado: ${socket.id}`);
    });
});

// ¡Importante! Ahora usamos server.listen en lugar de app.listen
server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP y WebSocket corriendo en http://localhost:${PORT}`);
});

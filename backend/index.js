require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/vehiculos',   require('./routes/vehiculos'));
app.use('/api/conductores', require('./routes/conductores'));
app.use('/api/rutas',       require('./routes/rutas'));
app.use('/api/pedidos',     require('./routes/pedidos'));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

require('./sockets/ubicaciones')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nailspa')
  .then(() => console.log('✅ Conectado a MongoDB - NailSpa'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Rutas
const authRoutes = require('./routes/auth');
const serviciosRoutes = require('./routes/servicios');
const especialistasRoutes = require('./routes/especialistas');
const citasRoutes = require('./routes/citas');
const estacionesRoutes = require('./routes/estaciones');

app.use('/api/auth', authRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/especialistas', especialistasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/estaciones', estacionesRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NailSpa API' });
});

// Socket.io eventos
io.on('connection', (socket) => {
  console.log('📱 Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('📴 Cliente desconectado:', socket.id);
  });
});

// Hacer io accesible en las rutas
app.set('io', io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   💅 Nail Spa - Sistema de Reservas          ║
║   🚀 Servidor corriendo en puerto ${PORT}       ║
║   📡 WebSocket habilitado                     ║
╚═══════════════════════════════════════════════╝
  `);
});

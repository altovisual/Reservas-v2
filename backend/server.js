require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middlewares - CORS configurado para producción
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || "http://localhost:3000"),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Manejar preflight requests
app.options('*', cors());

app.use(express.json());

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const clientesRoutes = require('./routes/clientes');
const pagosRoutes = require('./routes/pagos');
const uploadRoutes = require('./routes/upload');
const galeriaRoutes = require('./routes/galeria');
const resenasRoutes = require('./routes/resenas');
const horariosRoutes = require('./routes/horarios');
const reportesRoutes = require('./routes/reportes');

app.use('/api/auth', authRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/especialistas', especialistasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/estaciones', estacionesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NailSpa API' });
});

// Socket.io eventos
io.on('connection', (socket) => {
  console.log('📱 Cliente conectado:', socket.id);
  
  // Enviar confirmación al cliente
  socket.emit('connected', { message: 'Conectado al servidor', id: socket.id });
  
  socket.on('disconnect', () => {
    console.log('📴 Cliente desconectado:', socket.id);
  });
});

// Log de clientes conectados cada 30 segundos
setInterval(() => {
  const clientCount = io.engine.clientsCount;
  if (clientCount > 0) {
    console.log(`📊 Clientes Socket.IO conectados: ${clientCount}`);
  }
}, 30000);

// Hacer io accesible en las rutas
app.set('io', io);

const PORT = process.env.PORT || 5001;

// Solo iniciar servidor si no estamos en Vercel (serverless)
if (process.env.VERCEL !== '1') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   💅 Nail Spa - Sistema de Reservas          ║
║   🚀 Servidor corriendo en puerto ${PORT}       ║
║   📡 WebSocket habilitado                     ║
╚═══════════════════════════════════════════════╝
    `);
  });
}

// Exportar para Vercel
module.exports = app;

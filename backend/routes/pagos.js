const express = require('express');
const router = express.Router();
const Pago = require('../models/Pago');
const Cliente = require('../models/Cliente');
const Cita = require('../models/Cita');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar multer para memoria
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Datos de pago del negocio (configurables)
const DATOS_PAGO_NEGOCIO = {
  nombreNegocio: 'Nail Spa San Felipe',
  rif: 'J-12345678-9',
  
  // Pago Móvil
  pagoMovil: {
    banco: 'Banesco',
    codigoBanco: '0134',
    telefono: '0424-1234567',
    cedula: 'V-12345678'
  },
  
  // Transferencia
  transferencia: {
    banco: 'Banesco',
    tipoCuenta: 'Corriente',
    numeroCuenta: '0134-0000-00-0000000000',
    titular: 'Nail Spa C.A.',
    cedula: 'J-12345678-9'
  },
  
  // Zelle
  zelle: {
    email: 'pagos@nailspa.com',
    titular: 'Nail Spa'
  },
  
  // Binance
  binance: {
    payId: '123456789',
    usuario: 'nailspa_ve'
  }
};

// Obtener datos de pago del negocio
router.get('/datos-negocio', (req, res) => {
  res.json(DATOS_PAGO_NEGOCIO);
});

// Obtener tasa del día (simulada - en producción conectar a API)
router.get('/tasa-dia', async (req, res) => {
  try {
    // En producción, conectar a API de tasa BCV o monitor dólar
    const tasa = {
      bcv: 36.50,
      paralelo: 38.00,
      fecha: new Date().toISOString().split('T')[0]
    };
    res.json(tasa);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Subir comprobante a Cloudinary
router.post('/comprobante', upload.single('comprobante'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó imagen' });
    }

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'nailspa/comprobantes',
          resource_type: 'image',
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({ 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    res.status(500).json({ mensaje: 'Error al subir comprobante', error: error.message });
  }
});

// Registrar pago
router.post('/', async (req, res) => {
  try {
    const {
      citaId,
      clienteId,
      monto,
      montoUSD,
      tasaCambio,
      metodoPago,
      datosPago,
      pagosMixtos,
      comprobante
    } = req.body;
    
    // Verificar que la cita existe
    const cita = await Cita.findById(citaId);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }
    
    // Calcular puntos (1% del monto en USD)
    const puntosGenerados = Math.floor((montoUSD || monto) * 0.1);
    
    const pago = new Pago({
      cita: citaId,
      cliente: clienteId,
      monto,
      montoUSD,
      tasaCambio,
      metodoPago,
      datosPago,
      pagosMixtos,
      comprobante,
      puntosGenerados,
      estado: metodoPago === 'efectivo_bs' || metodoPago === 'efectivo_usd' || metodoPago === 'punto_venta'
        ? 'confirmado' 
        : 'verificando'
    });
    
    await pago.save();
    
    // Si el pago es confirmado automáticamente, actualizar cliente
    if (pago.estado === 'confirmado') {
      await Cliente.findByIdAndUpdate(clienteId, {
        $inc: { 
          puntos: puntosGenerados,
          totalGastado: montoUSD || monto,
          totalCitas: 1
        },
        ultimaVisita: new Date()
      });
      
      // Actualizar estado de la cita
      cita.estado = 'confirmada';
      cita.pago = pago._id;
      await cita.save();
    }
    
    res.status(201).json({
      mensaje: 'Pago registrado',
      pago,
      puntosGenerados
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Verificar pago (admin)
router.patch('/:id/verificar', async (req, res) => {
  try {
    const { estado, notasVerificacion, adminId } = req.body;
    
    const pago = await Pago.findById(req.params.id);
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    
    pago.estado = estado;
    pago.notasVerificacion = notasVerificacion;
    pago.verificadoPor = adminId;
    pago.fechaVerificacion = new Date();
    
    await pago.save();
    
    // Si se confirma, actualizar cliente y cita
    if (estado === 'confirmado') {
      await Cliente.findByIdAndUpdate(pago.cliente, {
        $inc: { 
          puntos: pago.puntosGenerados,
          totalGastado: pago.montoUSD || pago.monto,
          totalCitas: 1
        },
        ultimaVisita: new Date()
      });
      
      await Cita.findByIdAndUpdate(pago.cita, {
        estado: 'confirmada',
        pago: pago._id
      });
    }
    
    res.json({
      mensaje: `Pago ${estado}`,
      pago
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener pagos (admin)
router.get('/', async (req, res) => {
  try {
    const { estado, metodoPago, desde, hasta } = req.query;
    
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (metodoPago) filtro.metodoPago = metodoPago;
    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt.$gte = new Date(desde);
      if (hasta) filtro.createdAt.$lte = new Date(hasta);
    }
    
    const pagos = await Pago.find(filtro)
      .populate('cliente', 'nombre apellido cedula telefono email')
      .populate('cita', 'fechaCita horaInicio horaFin servicios nombreEspecialista estado nombreCliente')
      .sort({ createdAt: -1 });
    
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener pagos de un cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const pagos = await Pago.find({ cliente: req.params.clienteId })
      .populate('cita', 'fechaCita horaInicio servicios')
      .sort({ createdAt: -1 });
    
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Resumen de pagos (admin)
router.get('/resumen', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Pagos de hoy
    const pagosHoy = await Pago.aggregate([
      { $match: { createdAt: { $gte: hoy }, estado: 'confirmado' } },
      { $group: { _id: null, total: { $sum: '$monto' }, cantidad: { $sum: 1 } } }
    ]);
    
    // Pagos del mes
    const pagosMes = await Pago.aggregate([
      { $match: { createdAt: { $gte: inicioMes }, estado: 'confirmado' } },
      { $group: { _id: null, total: { $sum: '$monto' }, cantidad: { $sum: 1 } } }
    ]);
    
    // Por método de pago
    const porMetodo = await Pago.aggregate([
      { $match: { createdAt: { $gte: inicioMes }, estado: 'confirmado' } },
      { $group: { _id: '$metodoPago', total: { $sum: '$monto' }, cantidad: { $sum: 1 } } }
    ]);
    
    // Pendientes de verificar
    const pendientes = await Pago.countDocuments({ estado: 'verificando' });
    
    res.json({
      hoy: pagosHoy[0] || { total: 0, cantidad: 0 },
      mes: pagosMes[0] || { total: 0, cantidad: 0 },
      porMetodo,
      pendientesVerificar: pendientes
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  // Relaciones
  cita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  
  // Montos
  monto: {
    type: Number,
    required: true
  },
  montoUSD: {
    type: Number // Monto en dólares si aplica
  },
  tasaCambio: {
    type: Number // Tasa del día si se paga en bolívares
  },
  
  // Método de pago - Venezuela
  metodoPago: {
    type: String,
    enum: [
      'efectivo_bs',      // Efectivo en Bolívares
      'efectivo_usd',     // Efectivo en Dólares
      'pago_movil',       // Pago Móvil
      'transferencia',    // Transferencia bancaria
      'zelle',            // Zelle
      'binance',          // Binance Pay
      'paypal',           // PayPal
      'punto_venta',      // Punto de venta
      'mixto'             // Pago mixto (varios métodos)
    ],
    required: true
  },
  
  // Detalles del pago móvil/transferencia
  datosPago: {
    banco: String,           // Banco origen
    bancoDestino: String,    // Banco destino
    referencia: String,      // Número de referencia
    telefonoPago: String,    // Teléfono del pago móvil
    cedulaPago: String,      // Cédula del pagador
    emailZelle: String,      // Email de Zelle
    walletBinance: String    // ID Binance
  },
  
  // Para pagos mixtos
  pagosMixtos: [{
    metodo: String,
    monto: Number,
    referencia: String
  }],
  
  // Estado
  estado: {
    type: String,
    enum: ['pendiente', 'verificando', 'confirmado', 'rechazado', 'reembolsado'],
    default: 'pendiente'
  },
  
  // Verificación
  verificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  fechaVerificacion: Date,
  notasVerificacion: String,
  
  // Comprobante
  comprobante: {
    type: String // URL de la imagen del comprobante
  },
  
  // Puntos generados
  puntosGenerados: {
    type: Number,
    default: 0
  },
  
  // Descuentos aplicados
  descuento: {
    tipo: String,       // 'porcentaje', 'monto', 'puntos'
    valor: Number,
    descripcion: String
  }
}, {
  timestamps: true
});

// Índices
pagoSchema.index({ cita: 1 });
pagoSchema.index({ cliente: 1 });
pagoSchema.index({ estado: 1 });
pagoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Pago', pagoSchema);

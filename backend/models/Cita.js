const mongoose = require('mongoose');

const servicioEnCitaSchema = new mongoose.Schema({
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
  nombreServicio: { type: String, required: true },
  precio: { type: Number, required: true },
  duracion: { type: Number, required: true }
}, { _id: false });

const citaSchema = new mongoose.Schema({
  // Cliente
  clienteId: { type: String },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  nombreCliente: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String },
  
  // Fecha y hora
  fechaCita: { type: Date, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String },
  duracionTotal: { type: Number },
  
  // Servicios
  servicios: [servicioEnCitaSchema],
  
  // Asignación
  especialistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialista', required: true },
  nombreEspecialista: { type: String },
  estacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion' },
  
  // Estado
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'en_espera', 'en_progreso', 'completada', 'cancelada', 'no_asistio'],
    default: 'pendiente'
  },
  
  // Pago
  subtotal: { type: Number, default: 0 },
  descuento: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  metodoPago: { type: String, enum: ['efectivo', 'pago_movil', 'transferencia', 'punto_venta', 'zelle', 'pendiente'], default: 'pendiente' },
  pagado: { type: Boolean, default: false },
  referenciaPago: { type: String },
  
  // Notas
  notas: { type: String },
  notasInternas: { type: String },
  
  // Calificación
  calificacion: { type: Number, min: 1, max: 5 },
  comentarioCalificacion: { type: String },
  
  // Origen
  origen: { type: String, enum: ['web', 'telefono', 'presencial', 'whatsapp'], default: 'web' },
  
  // Notificaciones
  recordatorioEnviado: { type: Boolean, default: false },
  fechaRecordatorio: { type: Date },
  facturaEnviada: { type: Boolean, default: false },
  fechaFactura: { type: Date }
}, { timestamps: true });

// Calcular totales antes de guardar
citaSchema.pre('save', function(next) {
  if (this.servicios && this.servicios.length > 0) {
    this.subtotal = this.servicios.reduce((sum, s) => sum + s.precio, 0);
    this.duracionTotal = this.servicios.reduce((sum, s) => sum + s.duracion, 0);
    this.total = this.subtotal - (this.descuento || 0);
    
    // Calcular hora fin
    if (this.horaInicio && this.duracionTotal) {
      const [h, m] = this.horaInicio.split(':').map(Number);
      const totalMin = h * 60 + m + this.duracionTotal;
      const finH = Math.floor(totalMin / 60);
      const finM = totalMin % 60;
      this.horaFin = `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Cita', citaSchema);

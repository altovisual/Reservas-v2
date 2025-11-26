const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  clienteNombre: { type: String, required: true }, // Para mostrar sin necesidad de populate
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
  servicioNombre: { type: String },
  cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita' },
  especialista: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialista' },
  calificacion: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, required: true, trim: true, maxlength: 500 },
  estado: { 
    type: String, 
    enum: ['pendiente', 'aprobada', 'rechazada'], 
    default: 'pendiente' 
  },
  respuesta: { type: String, trim: true }, // Respuesta del admin
  fechaRespuesta: { type: Date }
}, { timestamps: true });

// Índices para búsquedas eficientes
resenaSchema.index({ estado: 1, createdAt: -1 });
resenaSchema.index({ cliente: 1 });
resenaSchema.index({ calificacion: -1 });

module.exports = mongoose.model('Resena', resenaSchema);

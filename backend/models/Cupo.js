const mongoose = require('mongoose');

const cupoSchema = new mongoose.Schema({
  // Fecha específica
  fecha: {
    type: Date,
    required: true
  },
  
  // Hora del cupo
  hora: {
    type: String,
    required: true
  },
  
  // Especialista asignado (opcional, si es por especialista)
  especialista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Especialista'
  },
  
  // Estado del cupo
  estado: {
    type: String,
    enum: ['disponible', 'ocupado', 'bloqueado'],
    default: 'disponible'
  },
  
  // Cita asociada (si está ocupado)
  cita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita'
  },
  
  // Notas (para bloqueos especiales)
  notas: String
}, {
  timestamps: true
});

// Índice compuesto para búsqueda rápida
cupoSchema.index({ fecha: 1, hora: 1, especialista: 1 });
cupoSchema.index({ fecha: 1, estado: 1 });

module.exports = mongoose.model('Cupo', cupoSchema);

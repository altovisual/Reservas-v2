const mongoose = require('mongoose');

const horarioSchema = new mongoose.Schema({
  // Día de la semana (0 = Domingo, 1 = Lunes, etc.)
  diaSemana: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  
  // Nombre del día para mostrar
  nombreDia: {
    type: String,
    enum: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  },
  
  // Si el día está activo para citas
  activo: {
    type: Boolean,
    default: true
  },
  
  // Hora de apertura
  horaApertura: {
    type: String,
    required: true,
    default: '09:00'
  },
  
  // Hora de cierre
  horaCierre: {
    type: String,
    required: true,
    default: '18:00'
  },
  
  // Hora de inicio de almuerzo (opcional)
  inicioAlmuerzo: {
    type: String,
    default: '12:00'
  },
  
  // Hora de fin de almuerzo (opcional)
  finAlmuerzo: {
    type: String,
    default: '13:00'
  },
  
  // Intervalo entre citas en minutos
  intervalo: {
    type: Number,
    default: 30
  },
  
  // Cupos máximos por hora (especialistas disponibles)
  cuposPorHora: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Índice único por día
horarioSchema.index({ diaSemana: 1 }, { unique: true });

module.exports = mongoose.model('Horario', horarioSchema);

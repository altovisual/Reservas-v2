const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  // Datos de identificación
  cedula: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tipoCedula: {
    type: String,
    enum: ['V', 'E', 'J', 'P', 'G'],
    default: 'V'
  },
  
  // Datos personales
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Datos adicionales
  fechaNacimiento: {
    type: Date
  },
  direccion: {
    type: String,
    trim: true
  },
  notas: {
    type: String,
    trim: true
  },
  
  // Preferencias
  preferencias: {
    especialistaFavorito: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Especialista'
    },
    serviciosFavoritos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio'
    }],
    notasPreferencias: String // Alergias, colores preferidos, etc.
  },
  
  // Sistema de fidelización
  puntos: {
    type: Number,
    default: 0
  },
  nivel: {
    type: String,
    enum: ['bronce', 'plata', 'oro', 'platino'],
    default: 'bronce'
  },
  
  // Estadísticas
  totalCitas: {
    type: Number,
    default: 0
  },
  totalGastado: {
    type: Number,
    default: 0
  },
  ultimaVisita: {
    type: Date
  },
  
  // Estado
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
clienteSchema.index({ cedula: 1 });
clienteSchema.index({ telefono: 1 });
clienteSchema.index({ nombre: 'text', apellido: 'text' });

// Método para calcular nivel
clienteSchema.methods.calcularNivel = function() {
  if (this.totalGastado >= 5000) return 'platino';
  if (this.totalGastado >= 2000) return 'oro';
  if (this.totalGastado >= 500) return 'plata';
  return 'bronce';
};

// Pre-save para actualizar nivel
clienteSchema.pre('save', function(next) {
  this.nivel = this.calcularNivel();
  next();
});

module.exports = mongoose.model('Cliente', clienteSchema);

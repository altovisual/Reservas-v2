const mongoose = require('mongoose');

const nivelSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    enum: ['bronce', 'plata', 'oro', 'platino']
  },
  min: {
    type: Number,
    required: true,
    default: 0
  },
  max: {
    type: Number,
    default: null // null significa infinito
  },
  multiplicadorPuntos: {
    type: Number,
    default: 1
  },
  descuentoCumpleanos: {
    type: Number,
    default: 0
  },
  beneficios: [{
    type: String
  }]
});

const configuracionRecompensasSchema = new mongoose.Schema({
  // Configuración general de puntos
  puntoPorDolar: {
    type: Number,
    default: 1,
    min: 0
  },
  valorPunto: {
    type: Number,
    default: 0.01,
    min: 0
  },
  multiplicadorCumpleanos: {
    type: Number,
    default: 2,
    min: 1
  },
  diasValidezPuntos: {
    type: Number,
    default: 365,
    min: 1
  },
  
  // Configuración de niveles
  niveles: {
    type: [nivelSchema],
    default: [
      { 
        nombre: 'bronce', 
        min: 0, 
        max: 500, 
        multiplicadorPuntos: 1,
        descuentoCumpleanos: 0,
        beneficios: ['Acumulación de puntos básica', '1 punto por cada $1'] 
      },
      { 
        nombre: 'plata', 
        min: 500, 
        max: 2000, 
        multiplicadorPuntos: 1.5,
        descuentoCumpleanos: 5,
        beneficios: ['1.5x puntos', '5% descuento en cumpleaños'] 
      },
      { 
        nombre: 'oro', 
        min: 2000, 
        max: 5000, 
        multiplicadorPuntos: 2,
        descuentoCumpleanos: 10,
        beneficios: ['2x puntos', '10% descuento en cumpleaños', 'Prioridad en citas'] 
      },
      { 
        nombre: 'platino', 
        min: 5000, 
        max: null, 
        multiplicadorPuntos: 3,
        descuentoCumpleanos: 15,
        beneficios: ['3x puntos', '15% descuento en cumpleaños', 'Servicios exclusivos', 'Atención VIP'] 
      }
    ]
  },
  
  // Historial de canjes (para reportes)
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Solo debe existir un documento de configuración
configuracionRecompensasSchema.statics.obtenerConfiguracion = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('ConfiguracionRecompensas', configuracionRecompensasSchema);

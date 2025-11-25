const mongoose = require('mongoose');

const estacionSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true },
  nombre: { type: String, required: true },
  tipo: { 
    type: String, 
    enum: ['manicure', 'pedicure', 'facial', 'masajes', 'multiuso'],
    default: 'multiuso'
  },
  estado: {
    type: String,
    enum: ['disponible', 'ocupada', 'mantenimiento', 'reservada'],
    default: 'disponible'
  },
  especialistaActual: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialista' },
  citaActual: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita' },
  categoriasPermitidas: [{ type: String }],
  activa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Estacion', estacionSchema);

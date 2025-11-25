const mongoose = require('mongoose');

const horarioSchema = new mongoose.Schema({
  inicio: { type: String, default: '09:00' },
  fin: { type: String, default: '18:00' },
  trabaja: { type: Boolean, default: true }
}, { _id: false });

const especialistaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  telefono: { type: String },
  email: { type: String, lowercase: true },
  foto: { type: String },
  color: { type: String, default: '#EC4899' },
  especialidades: [{ type: String }],
  horarioTrabajo: {
    lunes: { type: horarioSchema, default: () => ({}) },
    martes: { type: horarioSchema, default: () => ({}) },
    miercoles: { type: horarioSchema, default: () => ({}) },
    jueves: { type: horarioSchema, default: () => ({}) },
    viernes: { type: horarioSchema, default: () => ({}) },
    sabado: { type: horarioSchema, default: () => ({ inicio: '09:00', fin: '14:00', trabaja: true }) },
    domingo: { type: horarioSchema, default: () => ({ trabaja: false }) }
  },
  activo: { type: Boolean, default: true },
  calificacionPromedio: { type: Number, default: 5, min: 1, max: 5 },
  totalResenas: { type: Number, default: 0 },
  citasCompletadas: { type: Number, default: 0 }
}, { timestamps: true });

especialistaSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model('Especialista', especialistaSchema);

const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true, min: 0 },
  duracion: { type: Number, required: true, min: 15 }, // minutos
  imagenUrl: { type: String },
  categoria: {
    type: String,
    required: true,
    enum: ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 
           'Depilación', 'Tratamientos Faciales', 'Masajes', 'Maquillaje',
           'Cejas y Pestañas', 'Tratamientos Corporales', 'Spa', 'Paquetes', 'Otros']
  },
  disponible: { type: Boolean, default: true },
  especialistas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Especialista' }],
  esPaquete: { type: Boolean, default: false },
  serviciosIncluidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' }],
  orden: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Servicio', servicioSchema);

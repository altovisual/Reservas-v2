const mongoose = require('mongoose');

const galeriaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  imagen: { type: String, required: true },
  categoria: {
    type: String,
    required: true,
    enum: ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 
           'French', 'Diseños', 'Depilación', 'Cejas y Pestañas', 'Maquillaje',
           'Tratamientos Faciales', 'Masajes', 'Spa', 'Otros']
  },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // IDs de clientes que dieron like
  especialista: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialista' },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
  activo: { type: Boolean, default: true },
  destacado: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Galeria', galeriaSchema);

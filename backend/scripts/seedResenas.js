require('dotenv').config();
const mongoose = require('mongoose');
const Resena = require('../models/Resena');

const resenas = [
  {
    clienteNombre: 'María González',
    servicioNombre: 'Manicure Gel',
    calificacion: 5,
    comentario: '¡Excelente servicio! El resultado quedó hermoso. Definitivamente volveré.',
    estado: 'aprobada',
    respuesta: '¡Gracias María! Nos alegra que te haya gustado. Te esperamos pronto.'
  },
  {
    clienteNombre: 'Carmen Rodríguez',
    servicioNombre: 'Pedicure Spa',
    calificacion: 5,
    comentario: 'El mejor spa de uñas de la ciudad. Ambiente muy relajante y el pedicure quedó perfecto.',
    estado: 'aprobada'
  },
  {
    clienteNombre: 'Laura Martínez',
    servicioNombre: 'Uñas Acrílicas',
    calificacion: 4,
    comentario: 'Muy buen trabajo, las uñas quedaron hermosas. Súper recomendado.',
    estado: 'aprobada',
    respuesta: 'Gracias por tu visita Laura. ¡Te esperamos pronto!'
  },
  {
    clienteNombre: 'Sofia Pérez',
    servicioNombre: 'Nail Art',
    calificacion: 5,
    comentario: 'Los diseños son increíbles. Muy creativas y detallistas.',
    estado: 'aprobada'
  },
  {
    clienteNombre: 'Patricia Luna',
    servicioNombre: 'French',
    calificacion: 5,
    comentario: 'Perfecto como siempre. El mejor french que me han hecho.',
    estado: 'aprobada'
  },
  {
    clienteNombre: 'Andrea Díaz',
    servicioNombre: 'Extensiones de Pestañas',
    calificacion: 5,
    comentario: 'Quedé encantada con mis pestañas. Se ven muy naturales y duran bastante.',
    estado: 'aprobada'
  },
  {
    clienteNombre: 'Valentina Torres',
    servicioNombre: 'Laminado de Cejas',
    calificacion: 4,
    comentario: 'Muy buen resultado, mis cejas lucen perfectas.',
    estado: 'aprobada'
  },
  {
    clienteNombre: 'Isabella Morales',
    servicioNombre: 'Maquillaje de Novia',
    calificacion: 5,
    comentario: '¡Me sentí como una princesa! El maquillaje duró toda la noche.',
    estado: 'aprobada',
    respuesta: '¡Felicidades por tu boda Isabella! Fue un placer ser parte de tu día especial.'
  }
];

const seedResenas = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nailspa');
    console.log('✅ Conectado a MongoDB');

    // Limpiar reseñas existentes
    await Resena.deleteMany({});
    console.log('🗑️  Reseñas limpiadas');

    // Insertar nuevas reseñas
    await Resena.insertMany(resenas);
    console.log(`✅ ${resenas.length} reseñas agregadas`);

    console.log('\n🎉 Reseñas inicializadas correctamente\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedResenas();

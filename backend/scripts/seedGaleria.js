require('dotenv').config();
const mongoose = require('mongoose');
const Galeria = require('../models/Galeria');

const imagenes = [
  // Manicure
  { 
    titulo: 'Diseño Floral Rosa', 
    descripcion: 'Hermoso diseño con flores delicadas en tonos rosa', 
    categoria: 'Nail Art', 
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    likes: 45,
    destacado: true
  },
  { 
    titulo: 'French Elegante', 
    descripcion: 'Clásico francés con acabado perfecto y brillante', 
    categoria: 'French', 
    imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600',
    likes: 38,
    destacado: true
  },
  { 
    titulo: 'Acrílicas Stiletto', 
    descripcion: 'Uñas acrílicas forma stiletto con diseño elegante', 
    categoria: 'Uñas Acrílicas', 
    imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600',
    likes: 52
  },
  { 
    titulo: 'Gel Tornasol', 
    descripcion: 'Efecto tornasol brillante que cambia con la luz', 
    categoria: 'Manicure', 
    imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600',
    likes: 29
  },
  { 
    titulo: 'Diseño Navideño', 
    descripcion: 'Perfecto para las fiestas decembrinas', 
    categoria: 'Nail Art', 
    imagen: 'https://images.unsplash.com/photo-1610992015732-2449b0dd2b8f?w=600',
    likes: 67,
    destacado: true
  },
  { 
    titulo: 'Manicure Spa Deluxe', 
    descripcion: 'Tratamiento completo de spa con hidratación', 
    categoria: 'Manicure', 
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    likes: 23
  },
  { 
    titulo: 'Pedicure Premium', 
    descripcion: 'Pedicure premium con masaje relajante', 
    categoria: 'Pedicure', 
    imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600',
    likes: 34
  },
  { 
    titulo: 'Arte Abstracto', 
    descripcion: 'Diseño único y moderno con líneas abstractas', 
    categoria: 'Nail Art', 
    imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600',
    likes: 41
  },
  { 
    titulo: 'Degradado Sunset', 
    descripcion: 'Hermosos colores del atardecer en tus uñas', 
    categoria: 'Diseños', 
    imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600',
    likes: 56
  },
  { 
    titulo: 'Glitter Dorado', 
    descripcion: 'Brillo dorado para ocasiones especiales', 
    categoria: 'Diseños', 
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    likes: 48
  },
  { 
    titulo: 'Minimalista Nude', 
    descripcion: 'Elegancia simple con tonos nude', 
    categoria: 'Manicure', 
    imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600',
    likes: 62
  },
  { 
    titulo: 'Uñas en Gel Cristal', 
    descripcion: 'Efecto cristal transparente y brillante', 
    categoria: 'Uñas en Gel', 
    imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600',
    likes: 39
  },
  // Cejas y Pestañas
  { 
    titulo: 'Laminado de Cejas', 
    descripcion: 'Cejas perfectamente definidas y peinadas', 
    categoria: 'Cejas y Pestañas', 
    imagen: 'https://images.unsplash.com/photo-1594359193943-a5d8f1f4e0b1?w=600',
    likes: 73,
    destacado: true
  },
  { 
    titulo: 'Extensiones de Pestañas', 
    descripcion: 'Mirada impactante con extensiones pelo a pelo', 
    categoria: 'Cejas y Pestañas', 
    imagen: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600',
    likes: 89
  },
  { 
    titulo: 'Lifting de Pestañas', 
    descripcion: 'Pestañas naturales con curvatura perfecta', 
    categoria: 'Cejas y Pestañas', 
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
    likes: 54
  },
  // Depilación
  { 
    titulo: 'Depilación con Cera', 
    descripcion: 'Piel suave y libre de vello', 
    categoria: 'Depilación', 
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600',
    likes: 31
  },
  { 
    titulo: 'Diseño de Cejas', 
    descripcion: 'Cejas perfectamente diseñadas para tu rostro', 
    categoria: 'Depilación', 
    imagen: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600',
    likes: 45
  },
  // Maquillaje
  { 
    titulo: 'Maquillaje de Novia', 
    descripcion: 'Look perfecto para tu día especial', 
    categoria: 'Maquillaje', 
    imagen: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600',
    likes: 112,
    destacado: true
  },
  { 
    titulo: 'Maquillaje Social', 
    descripcion: 'Ideal para eventos y ocasiones especiales', 
    categoria: 'Maquillaje', 
    imagen: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
    likes: 67
  },
  // Spa
  { 
    titulo: 'Día de Spa Completo', 
    descripcion: 'Experiencia relajante de pies a cabeza', 
    categoria: 'Spa', 
    imagen: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    likes: 95,
    destacado: true
  },
  { 
    titulo: 'Masaje Relajante', 
    descripcion: 'Libera tensiones y renueva energías', 
    categoria: 'Spa', 
    imagen: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600',
    likes: 78
  }
];

const seedGaleria = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nailspa');
    console.log('✅ Conectado a MongoDB');

    // Limpiar galería existente
    await Galeria.deleteMany({});
    console.log('🗑️  Galería limpiada');

    // Insertar nuevas imágenes
    await Galeria.insertMany(imagenes);
    console.log(`✅ ${imagenes.length} imágenes agregadas a la galería`);

    console.log('\n🎉 Galería inicializada correctamente\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedGaleria();

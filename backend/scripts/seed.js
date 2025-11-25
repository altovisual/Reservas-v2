require('dotenv').config();
const mongoose = require('mongoose');
const Servicio = require('../models/Servicio');
const Especialista = require('../models/Especialista');
const Estacion = require('../models/Estacion');

const servicios = [
  // Manicure
  { nombre: 'Manicure Básico', descripcion: 'Limado, cutículas y esmaltado tradicional', precio: 8, duracion: 30, categoria: 'Manicure' },
  { nombre: 'Manicure Spa', descripcion: 'Manicure básico + exfoliación, mascarilla y masaje', precio: 15, duracion: 45, categoria: 'Manicure' },
  { nombre: 'Manicure Semipermanente', descripcion: 'Esmaltado en gel de larga duración', precio: 18, duracion: 45, categoria: 'Manicure' },
  
  // Pedicure
  { nombre: 'Pedicure Básico', descripcion: 'Limado, cutículas, callos y esmaltado', precio: 12, duracion: 45, categoria: 'Pedicure' },
  { nombre: 'Pedicure Spa', descripcion: 'Pedicure completo + exfoliación y masaje', precio: 20, duracion: 60, categoria: 'Pedicure' },
  { nombre: 'Pedicure Semipermanente', descripcion: 'Pedicure con esmaltado en gel', precio: 22, duracion: 60, categoria: 'Pedicure' },
  
  // Uñas Acrílicas
  { nombre: 'Uñas Acrílicas Set Completo', descripcion: 'Aplicación de uñas acrílicas con diseño', precio: 35, duracion: 90, categoria: 'Uñas Acrílicas' },
  { nombre: 'Relleno Acrílico', descripcion: 'Mantenimiento de uñas acrílicas', precio: 25, duracion: 60, categoria: 'Uñas Acrílicas' },
  { nombre: 'Retiro de Acrílico', descripcion: 'Remoción segura de uñas acrílicas', precio: 15, duracion: 45, categoria: 'Uñas Acrílicas' },
  
  // Uñas en Gel
  { nombre: 'Uñas en Gel Set Completo', descripcion: 'Aplicación de gel builder con diseño', precio: 30, duracion: 75, categoria: 'Uñas en Gel' },
  { nombre: 'Relleno de Gel', descripcion: 'Mantenimiento de uñas en gel', precio: 22, duracion: 50, categoria: 'Uñas en Gel' },
  
  // Nail Art
  { nombre: 'Diseño Simple (10 uñas)', descripcion: 'Diseño básico en todas las uñas', precio: 10, duracion: 30, categoria: 'Nail Art' },
  { nombre: 'Diseño Elaborado (10 uñas)', descripcion: 'Diseño complejo en todas las uñas', precio: 25, duracion: 45, categoria: 'Nail Art' },
  
  // Depilación
  { nombre: 'Depilación Cejas', descripcion: 'Diseño y depilación de cejas con cera', precio: 5, duracion: 15, categoria: 'Depilación' },
  { nombre: 'Depilación Labio Superior', descripcion: 'Depilación con cera', precio: 3, duracion: 15, categoria: 'Depilación' },
  { nombre: 'Depilación Axilas', descripcion: 'Depilación completa de axilas', precio: 8, duracion: 20, categoria: 'Depilación' },
  
  // Cejas y Pestañas
  { nombre: 'Tinte de Cejas', descripcion: 'Coloración de cejas', precio: 8, duracion: 20, categoria: 'Cejas y Pestañas' },
  { nombre: 'Laminado de Cejas', descripcion: 'Alisado y fijación de cejas', precio: 20, duracion: 45, categoria: 'Cejas y Pestañas' },
  { nombre: 'Extensiones de Pestañas', descripcion: 'Aplicación pelo a pelo', precio: 35, duracion: 90, categoria: 'Cejas y Pestañas' },
  { nombre: 'Lifting de Pestañas', descripcion: 'Curvado permanente', precio: 25, duracion: 60, categoria: 'Cejas y Pestañas' },
  
  // Paquetes
  { nombre: 'Paquete Novia', descripcion: 'Manicure + Pedicure Spa + Maquillaje', precio: 80, duracion: 180, categoria: 'Paquetes', esPaquete: true },
  { nombre: 'Paquete Relax', descripcion: 'Manicure Spa + Pedicure Spa', precio: 32, duracion: 105, categoria: 'Paquetes', esPaquete: true },
  { nombre: 'Paquete Express', descripcion: 'Manicure + Pedicure Básico', precio: 18, duracion: 60, categoria: 'Paquetes', esPaquete: true }
];

const especialistas = [
  { nombre: 'María', apellido: 'González', telefono: '04141234567', email: 'maria@nailspa.com', especialidades: ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Nail Art'], color: '#EC4899' },
  { nombre: 'Ana', apellido: 'Rodríguez', telefono: '04241234567', email: 'ana@nailspa.com', especialidades: ['Manicure', 'Pedicure', 'Uñas en Gel'], color: '#8B5CF6' },
  { nombre: 'Carmen', apellido: 'López', telefono: '04121234567', email: 'carmen@nailspa.com', especialidades: ['Depilación', 'Cejas y Pestañas'], color: '#06B6D4' },
  { nombre: 'Laura', apellido: 'Martínez', telefono: '04161234567', email: 'laura@nailspa.com', especialidades: ['Uñas Acrílicas', 'Uñas en Gel', 'Nail Art'], color: '#F59E0B' }
];

const estaciones = [
  { numero: 1, nombre: 'Estación Manicure 1', tipo: 'manicure', categoriasPermitidas: ['Manicure', 'Nail Art'] },
  { numero: 2, nombre: 'Estación Manicure 2', tipo: 'manicure', categoriasPermitidas: ['Manicure', 'Nail Art'] },
  { numero: 3, nombre: 'Estación Pedicure 1', tipo: 'pedicure', categoriasPermitidas: ['Pedicure'] },
  { numero: 4, nombre: 'Estación Pedicure 2', tipo: 'pedicure', categoriasPermitidas: ['Pedicure'] },
  { numero: 5, nombre: 'Cabina Cejas/Pestañas', tipo: 'facial', categoriasPermitidas: ['Cejas y Pestañas', 'Depilación'] },
  { numero: 6, nombre: 'Estación Multiuso', tipo: 'multiuso' }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nailspa');
    console.log('✅ Conectado a MongoDB');

    // Limpiar
    await Servicio.deleteMany({});
    await Especialista.deleteMany({});
    await Estacion.deleteMany({});
    console.log('🗑️  Colecciones limpiadas');

    // Crear
    await Servicio.insertMany(servicios);
    console.log(`✅ ${servicios.length} servicios creados`);

    for (const esp of especialistas) {
      await Especialista.create({
        ...esp,
        horarioTrabajo: {
          lunes: { inicio: '09:00', fin: '18:00', trabaja: true },
          martes: { inicio: '09:00', fin: '18:00', trabaja: true },
          miercoles: { inicio: '09:00', fin: '18:00', trabaja: true },
          jueves: { inicio: '09:00', fin: '18:00', trabaja: true },
          viernes: { inicio: '09:00', fin: '18:00', trabaja: true },
          sabado: { inicio: '09:00', fin: '14:00', trabaja: true },
          domingo: { trabaja: false }
        }
      });
    }
    console.log(`✅ ${especialistas.length} especialistas creados`);

    await Estacion.insertMany(estaciones);
    console.log(`✅ ${estaciones.length} estaciones creadas`);

    console.log('\n🎉 Base de datos inicializada para Nail Spa\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seed();

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const initAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nailspa');
    console.log('✅ Conectado a MongoDB');

    const adminExistente = await Admin.findOne({ email: 'admin@nailspa.com' });
    
    if (adminExistente) {
      console.log('⚠️  Admin ya existe');
    } else {
      await Admin.create({
        nombre: 'Administrador',
        email: 'admin@nailspa.com',
        password: 'admin123',
        rol: 'superadmin'
      });
      console.log('✅ Admin creado');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@nailspa.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

initAdmin();

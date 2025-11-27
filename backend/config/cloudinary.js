const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage para galería
const galeriaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nailspa/galeria',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

// Storage para servicios
const serviciosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nailspa/servicios',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  }
});

// Storage para especialistas
const especialistasStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nailspa/especialistas',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// Multer uploaders
const uploadGaleria = multer({ 
  storage: galeriaStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const uploadServicio = multer({ 
  storage: serviciosStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const uploadEspecialista = multer({ 
  storage: especialistasStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Función para eliminar imagen de Cloudinary
const eliminarImagen = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

// Extraer public_id de una URL de Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  // El public_id está después de 'upload' y la versión (v1234567890)
  const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
  // Remover la extensión del archivo
  return pathAfterUpload.replace(/\.[^/.]+$/, '');
};

module.exports = {
  cloudinary,
  uploadGaleria,
  uploadServicio,
  uploadEspecialista,
  eliminarImagen,
  getPublicIdFromUrl
};

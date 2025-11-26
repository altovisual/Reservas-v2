const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// POST - Subir imagen
router.post('/', upload.single('imagen'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se subió ninguna imagen' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      mensaje: 'Imagen subida exitosamente',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al subir imagen', error: error.message });
  }
});

// DELETE - Eliminar imagen
router.delete('/:filename', (req, res) => {
  try {
    const filepath = path.join(uploadsDir, req.params.filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ mensaje: 'Imagen eliminada' });
    } else {
      res.status(404).json({ mensaje: 'Imagen no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
  }
});

module.exports = router;

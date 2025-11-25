const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const isMatch = await admin.compararPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'nailspa_secret_2024',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar token
router.get('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nailspa_secret_2024');
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.activo) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true, admin: { id: admin._id, nombre: admin.nombre, email: admin.email, rol: admin.rol } });
  } catch (error) {
    res.status(401).json({ success: false });
  }
});

module.exports = router;

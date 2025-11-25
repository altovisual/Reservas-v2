const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protegerRuta = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nailspa_secret_2024');
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.activo) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

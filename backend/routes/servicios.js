const express = require('express');
const router = express.Router();
const Servicio = require('../models/Servicio');
const { protegerRuta } = require('../middleware/auth');

// GET - Todos los servicios
router.get('/', async (req, res) => {
  try {
    const { categoria, disponible } = req.query;
    let filtro = {};
    if (categoria) filtro.categoria = categoria;
    if (disponible !== undefined) filtro.disponible = disponible === 'true';

    const servicios = await Servicio.find(filtro)
      .populate('especialistas', 'nombre apellido color')
      .sort({ orden: 1, categoria: 1 });
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener servicios', error: error.message });
  }
});

// GET - Categorías
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Servicio.distinct('categoria', { disponible: true });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Un servicio
router.get('/:id', async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).populate('especialistas', 'nombre apellido color');
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Crear servicio (protegido)
router.post('/', protegerRuta, async (req, res) => {
  try {
    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear', error: error.message });
  }
});

// PUT - Actualizar servicio (protegido)
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!servicio) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(servicio);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error', error: error.message });
  }
});

// DELETE - Eliminar servicio (protegido)
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Servicio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// PATCH - Toggle disponibilidad
router.patch('/:id/disponibilidad', protegerRuta, async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    servicio.disponible = !servicio.disponible;
    await servicio.save();
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Estacion = require('../models/Estacion');
const { protegerRuta } = require('../middleware/auth');

// GET - Todas las estaciones
router.get('/', protegerRuta, async (req, res) => {
  try {
    const estaciones = await Estacion.find()
      .populate('especialistaActual', 'nombre apellido')
      .populate('citaActual', 'nombreCliente horaInicio horaFin')
      .sort({ numero: 1 });
    res.json(estaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Crear estación
router.post('/', protegerRuta, async (req, res) => {
  try {
    const estacion = await Estacion.create(req.body);
    res.status(201).json(estacion);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error', error: error.message });
  }
});

// PUT - Actualizar estación
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const estacion = await Estacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(estacion);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error', error: error.message });
  }
});

// DELETE - Eliminar estación
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Estacion.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Ocupar estación
router.post('/:id/ocupar', protegerRuta, async (req, res) => {
  try {
    const { especialistaId, citaId } = req.body;
    const estacion = await Estacion.findByIdAndUpdate(req.params.id, {
      estado: 'ocupada',
      especialistaActual: especialistaId,
      citaActual: citaId
    }, { new: true });
    res.json(estacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Liberar estación
router.post('/:id/liberar', protegerRuta, async (req, res) => {
  try {
    const estacion = await Estacion.findByIdAndUpdate(req.params.id, {
      estado: 'disponible',
      especialistaActual: null,
      citaActual: null
    }, { new: true });
    res.json(estacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Resena = require('../models/Resena');
const Cliente = require('../models/Cliente');
const Servicio = require('../models/Servicio');

// Obtener reseñas (públicas solo aprobadas, admin todas)
router.get('/', async (req, res) => {
  try {
    const { estado, limit, clienteId } = req.query;
    let query = {};
    
    // Si viene estado específico, filtramos
    if (estado) {
      query.estado = estado;
    }
    
    // Si es un cliente buscando sus propias reseñas
    if (clienteId) {
      query.cliente = clienteId;
    }
    
    let consulta = Resena.find(query)
      .populate('servicio', 'nombre')
      .populate('especialista', 'nombre')
      .sort({ createdAt: -1 });
    
    if (limit) {
      consulta = consulta.limit(parseInt(limit));
    }
    
    const resenas = await consulta;
    
    // Calcular estadísticas solo de aprobadas
    const aprobadas = await Resena.find({ estado: 'aprobada' });
    const total = aprobadas.length;
    const suma = aprobadas.reduce((acc, r) => acc + r.calificacion, 0);
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    aprobadas.forEach(r => distribucion[r.calificacion]++);
    
    res.json({
      resenas,
      stats: {
        promedio: total > 0 ? (suma / total).toFixed(1) : '0.0',
        total,
        distribucion
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reseñas', error: error.message });
  }
});

// Crear nueva reseña (cliente)
router.post('/', async (req, res) => {
  try {
    const { clienteId, servicioId, calificacion, comentario, citaId, especialistaId } = req.body;
    
    // Validar cliente
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Obtener nombre del servicio si existe
    let servicioNombre = '';
    if (servicioId) {
      const servicio = await Servicio.findById(servicioId);
      servicioNombre = servicio?.nombre || '';
    }
    
    const resena = new Resena({
      cliente: clienteId,
      clienteNombre: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
      servicio: servicioId || null,
      servicioNombre,
      cita: citaId || null,
      especialista: especialistaId || null,
      calificacion,
      comentario,
      estado: 'pendiente' // Las reseñas requieren aprobación
    });
    
    await resena.save();
    
    res.status(201).json({ 
      success: true, 
      mensaje: '¡Gracias por tu reseña! Será publicada después de ser revisada.',
      resena 
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear reseña', error: error.message });
  }
});

// Obtener una reseña por ID
router.get('/:id', async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id)
      .populate('cliente', 'nombre apellido')
      .populate('servicio', 'nombre')
      .populate('especialista', 'nombre');
    
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }
    res.json(resena);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reseña', error: error.message });
  }
});

// Actualizar estado de reseña (admin - aprobar/rechazar)
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado, respuesta } = req.body;
    
    const updateData = { estado };
    if (respuesta) {
      updateData.respuesta = respuesta;
      updateData.fechaRespuesta = new Date();
    }
    
    const resena = await Resena.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }
    
    res.json({ success: true, resena });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar reseña', error: error.message });
  }
});

// Responder a una reseña (admin)
router.patch('/:id/responder', async (req, res) => {
  try {
    const { respuesta } = req.body;
    
    const resena = await Resena.findByIdAndUpdate(
      req.params.id,
      { respuesta, fechaRespuesta: new Date() },
      { new: true }
    );
    
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }
    
    res.json({ success: true, resena });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al responder reseña', error: error.message });
  }
});

// Eliminar reseña (admin)
router.delete('/:id', async (req, res) => {
  try {
    const resena = await Resena.findByIdAndDelete(req.params.id);
    if (!resena) {
      return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    }
    res.json({ mensaje: 'Reseña eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar reseña', error: error.message });
  }
});

module.exports = router;

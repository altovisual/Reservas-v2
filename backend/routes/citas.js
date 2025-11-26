const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');
const Servicio = require('../models/Servicio');
const Especialista = require('../models/Especialista');
const { protegerRuta } = require('../middleware/auth');

// GET - Todas las citas (protegido)
router.get('/', protegerRuta, async (req, res) => {
  try {
    const { fecha, estado, especialista } = req.query;
    let filtro = {};

    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      filtro.fechaCita = { $gte: inicio, $lte: fin };
    }
    if (estado) filtro.estado = estado;
    if (especialista) filtro.especialistaId = especialista;

    const citas = await Cita.find(filtro)
      .populate('especialistaId', 'nombre apellido color')
      .sort({ horaInicio: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Citas de hoy (protegido)
router.get('/hoy', protegerRuta, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const citas = await Cita.find({
      fechaCita: { $gte: hoy, $lt: manana }
    }).populate('especialistaId', 'nombre apellido color').sort({ horaInicio: 1 });

    const stats = {
      total: citas.length,
      pendientes: citas.filter(c => c.estado === 'pendiente').length,
      confirmadas: citas.filter(c => c.estado === 'confirmada').length,
      enProgreso: citas.filter(c => c.estado === 'en_progreso').length,
      completadas: citas.filter(c => c.estado === 'completada').length,
      ingresos: citas.filter(c => c.pagado).reduce((sum, c) => sum + c.total, 0)
    };

    res.json({ citas, stats });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Citas de un cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const clienteId = req.params.clienteId;
    
    // Buscar por clienteId (string) o cliente (ObjectId)
    const citas = await Cita.find({
      $or: [
        { clienteId: clienteId },
        { cliente: clienteId }
      ]
    })
      .populate('especialistaId', 'nombre apellido color')
      .populate('servicios.servicioId', 'nombre precio duracion imagen')
      .sort({ fechaCita: -1 });
    
    res.json(citas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Una cita
router.get('/:id', async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate('especialistaId', 'nombre apellido color telefono');
    if (!cita) return res.status(404).json({ mensaje: 'No encontrada' });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Crear cita
router.post('/', async (req, res) => {
  try {
    const { servicios, especialistaId, clienteId, ...citaData } = req.body;

    // Obtener info de servicios
    const serviciosInfo = await Promise.all(
      servicios.map(async (s) => {
        const servicio = await Servicio.findById(s.servicioId);
        return {
          servicioId: servicio._id,
          nombreServicio: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion
        };
      })
    );

    // Obtener nombre del especialista
    const especialista = await Especialista.findById(especialistaId);

    // Preparar datos de la cita
    const datosCita = {
      ...citaData,
      clienteId: clienteId, // Guardar como string
      servicios: serviciosInfo,
      especialistaId,
      nombreEspecialista: `${especialista.nombre} ${especialista.apellido}`
    };

    // Si el clienteId es un ObjectId válido de MongoDB, también guardarlo en cliente
    if (clienteId && clienteId.match(/^[0-9a-fA-F]{24}$/)) {
      datosCita.cliente = clienteId;
    }

    const cita = await Cita.create(datosCita);

    // Emitir evento de nueva cita
    const io = req.app.get('io');
    if (io) io.emit('nuevaCita', cita);

    res.status(201).json(cita);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear cita', error: error.message });
  }
});

// PATCH - Cambiar estado
router.patch('/:id/estado', protegerRuta, async (req, res) => {
  try {
    const { estado } = req.body;
    const cita = await Cita.findByIdAndUpdate(req.params.id, { estado }, { new: true });

    // Si se completa, actualizar stats del especialista
    if (estado === 'completada') {
      await Especialista.findByIdAndUpdate(cita.especialistaId, {
        $inc: { citasCompletadas: 1 }
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('citaActualizada', cita);

    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Cancelar cita
router.post('/:id/cancelar', async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'No encontrada' });

    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
      return res.status(400).json({ mensaje: 'No se puede cancelar' });
    }

    cita.estado = 'cancelada';
    cita.notasInternas = req.body.motivo || 'Cancelada';
    await cita.save();

    const io = req.app.get('io');
    if (io) io.emit('citaCancelada', cita);

    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Confirmar pago
router.post('/:id/pago', protegerRuta, async (req, res) => {
  try {
    const { metodoPago, referenciaPago } = req.body;
    const cita = await Cita.findByIdAndUpdate(req.params.id, {
      pagado: true,
      metodoPago,
      referenciaPago
    }, { new: true });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Calificar cita
router.post('/:id/calificar', async (req, res) => {
  try {
    const { calificacion, comentario } = req.body;
    const cita = await Cita.findByIdAndUpdate(req.params.id, {
      calificacion,
      comentarioCalificacion: comentario
    }, { new: true });

    // Actualizar promedio del especialista
    const citasCalificadas = await Cita.find({
      especialistaId: cita.especialistaId,
      calificacion: { $exists: true }
    });
    const promedio = citasCalificadas.reduce((sum, c) => sum + c.calificacion, 0) / citasCalificadas.length;

    await Especialista.findByIdAndUpdate(cita.especialistaId, {
      calificacionPromedio: promedio.toFixed(1),
      totalResenas: citasCalificadas.length
    });

    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Reagendar cita
router.post('/:id/reagendar', async (req, res) => {
  try {
    const { fechaCita, horaInicio, horaFin, especialistaId } = req.body;
    
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }
    
    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
      return res.status(400).json({ mensaje: 'No se puede reagendar esta cita' });
    }
    
    // Verificar disponibilidad del nuevo horario
    const citaExistente = await Cita.findOne({
      _id: { $ne: cita._id },
      especialistaId: especialistaId || cita.especialistaId,
      fechaCita: new Date(fechaCita),
      estado: { $nin: ['cancelada'] },
      $or: [
        { horaInicio: { $lt: horaFin, $gte: horaInicio } },
        { horaFin: { $gt: horaInicio, $lte: horaFin } },
        { horaInicio: { $lte: horaInicio }, horaFin: { $gte: horaFin } }
      ]
    });
    
    if (citaExistente) {
      return res.status(400).json({ mensaje: 'El horario seleccionado no está disponible' });
    }
    
    // Actualizar la cita
    cita.fechaCita = new Date(fechaCita);
    cita.horaInicio = horaInicio;
    cita.horaFin = horaFin;
    if (especialistaId) {
      cita.especialistaId = especialistaId;
      const especialista = await Especialista.findById(especialistaId);
      cita.nombreEspecialista = `${especialista.nombre} ${especialista.apellido}`;
    }
    cita.estado = 'pendiente'; // Volver a pendiente para reconfirmar
    
    await cita.save();
    
    const io = req.app.get('io');
    if (io) io.emit('citaReagendada', cita);
    
    res.json({ mensaje: 'Cita reagendada exitosamente', cita });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reagendar', error: error.message });
  }
});

module.exports = router;

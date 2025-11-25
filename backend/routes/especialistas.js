const express = require('express');
const router = express.Router();
const Especialista = require('../models/Especialista');
const Cita = require('../models/Cita');
const { protegerRuta } = require('../middleware/auth');

// GET - Todos los especialistas
router.get('/', async (req, res) => {
  try {
    const { activo } = req.query;
    let filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';

    const especialistas = await Especialista.find(filtro).sort({ nombre: 1 });
    res.json(especialistas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Un especialista
router.get('/:id', async (req, res) => {
  try {
    const especialista = await Especialista.findById(req.params.id);
    if (!especialista) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(especialista);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Disponibilidad de un especialista
router.get('/:id/disponibilidad', async (req, res) => {
  try {
    const { fecha, duracion = 60 } = req.query;
    const especialista = await Especialista.findById(req.params.id);
    if (!especialista) return res.status(404).json({ mensaje: 'No encontrado' });

    const fechaDate = new Date(fecha);
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fechaDate.getDay()];
    const horarioDia = especialista.horarioTrabajo[diaSemana];

    if (!horarioDia?.trabaja) {
      return res.json({ horasDisponibles: [], mensaje: 'No trabaja este día' });
    }

    // Obtener citas del día
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const citasDelDia = await Cita.find({
      especialistaId: req.params.id,
      fechaCita: { $gte: inicioDia, $lte: finDia },
      estado: { $nin: ['cancelada', 'no_asistio'] }
    });

    // Generar slots disponibles
    const horasDisponibles = [];
    const [inicioH, inicioM] = horarioDia.inicio.split(':').map(Number);
    const [finH, finM] = horarioDia.fin.split(':').map(Number);
    const duracionNum = parseInt(duracion);

    for (let h = inicioH; h < finH || (h === finH && 0 < finM); h++) {
      for (let m = (h === inicioH ? inicioM : 0); m < 60; m += 30) {
        if (h === finH && m >= finM) break;

        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const finSlotMin = h * 60 + m + duracionNum;
        const finSlotH = Math.floor(finSlotMin / 60);
        const finSlotM = finSlotMin % 60;
        const horaFinStr = `${String(finSlotH).padStart(2, '0')}:${String(finSlotM).padStart(2, '0')}`;

        // Verificar si no hay conflicto con citas existentes
        const hayConflicto = citasDelDia.some(cita => {
          const citaInicio = cita.horaInicio;
          const citaFin = cita.horaFin;
          return (horaStr < citaFin && horaFinStr > citaInicio);
        });

        if (!hayConflicto && finSlotMin <= finH * 60 + finM) {
          horasDisponibles.push({ hora: horaStr, horaFin: horaFinStr });
        }
      }
    }

    res.json({ horasDisponibles });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// POST - Crear especialista (protegido)
router.post('/', protegerRuta, async (req, res) => {
  try {
    const especialista = await Especialista.create(req.body);
    res.status(201).json(especialista);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error', error: error.message });
  }
});

// PUT - Actualizar especialista (protegido)
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const especialista = await Especialista.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(especialista);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error', error: error.message });
  }
});

// DELETE - Eliminar especialista (protegido)
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    const citasPendientes = await Cita.countDocuments({
      especialistaId: req.params.id,
      estado: { $in: ['pendiente', 'confirmada'] }
    });
    if (citasPendientes > 0) {
      return res.status(400).json({ mensaje: 'Tiene citas pendientes' });
    }
    await Especialista.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// PATCH - Toggle activo
router.patch('/:id/activo', protegerRuta, async (req, res) => {
  try {
    const esp = await Especialista.findById(req.params.id);
    esp.activo = !esp.activo;
    await esp.save();
    res.json(esp);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// PATCH - Actualizar horario
router.patch('/:id/horario', protegerRuta, async (req, res) => {
  try {
    const esp = await Especialista.findByIdAndUpdate(
      req.params.id,
      { horarioTrabajo: req.body.horarioTrabajo },
      { new: true }
    );
    res.json(esp);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

module.exports = router;

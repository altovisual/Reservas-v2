const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');
const Servicio = require('../models/Servicio');
const Especialista = require('../models/Especialista');
const { protegerRuta } = require('../middleware/auth');

// GET - TODAS las citas sin filtro (protegido)
router.get('/todas', protegerRuta, async (req, res) => {
  try {
    const citas = await Cita.find({})
      .populate('especialistaId', 'nombre apellido color')
      .populate('cliente', 'nombre apellido telefono')
      .sort({ fechaCita: -1, horaInicio: 1 });
    
    console.log(`Total citas en BD: ${citas.length}`);
    res.json(citas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ mensaje: 'Error', error: error.message });
  }
});

// GET - Citas con filtros opcionales (protegido)
router.get('/', protegerRuta, async (req, res) => {
  try {
    const { fecha, estado, especialista } = req.query;
    let filtro = {};

    if (fecha) {
      const inicio = new Date(fecha + 'T00:00:00');
      const fin = new Date(fecha + 'T23:59:59.999');
      filtro.fechaCita = { $gte: inicio, $lte: fin };
    }
    if (estado) filtro.estado = estado;
    if (especialista) filtro.especialistaId = especialista;

    const citas = await Cita.find(filtro)
      .populate('especialistaId', 'nombre apellido color')
      .populate('cliente', 'nombre apellido telefono')
      .sort({ fechaCita: 1, horaInicio: 1 });
    
    res.json(citas);
  } catch (error) {
    console.error('Error:', error);
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

    // Obtener citas de hoy
    const citas = await Cita.find({
      fechaCita: { $gte: hoy, $lt: manana }
    }).populate('especialistaId', 'nombre apellido color').sort({ horaInicio: 1 });

    // Obtener pagos de hoy
    const Pago = require('../models/Pago');
    const pagosHoy = await Pago.find({
      createdAt: { $gte: hoy, $lt: manana },
      estado: 'confirmado'
    });
    
    // Obtener todas las citas para estadísticas generales
    const todasLasCitas = await Cita.find({});
    const todosLosPagos = await Pago.find({ estado: 'confirmado' });

    const ingresosHoy = pagosHoy.reduce((sum, p) => sum + (p.monto || 0), 0);
    const ingresosTotales = todosLosPagos.reduce((sum, p) => sum + (p.monto || 0), 0);

    const stats = {
      total: todasLasCitas.length,
      citasHoy: citas.length,
      pendientes: citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length,
      enProgreso: citas.filter(c => c.estado === 'en_progreso').length,
      completadas: todasLasCitas.filter(c => c.estado === 'completada').length,
      ingresos: ingresosHoy,
      ingresosTotales: ingresosTotales,
      promedioPorCita: todasLasCitas.length > 0 ? Math.round(ingresosTotales / todasLasCitas.filter(c => c.pagado).length) || 0 : 0
    };

    res.json({ citas, stats });
  } catch (error) {
    console.error('Error en /hoy:', error);
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
    const { servicios, especialistaId, clienteId, fechaCita, horaInicio, ...citaData } = req.body;

    console.log('Creando cita:', { fechaCita, horaInicio, especialistaId, clienteId });

    // Obtener info de servicios y calcular duración total
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
    
    const duracionTotal = serviciosInfo.reduce((sum, s) => sum + (s.duracion || 30), 0);

    // Obtener nombre del especialista
    const especialista = await Especialista.findById(especialistaId);
    
    // ===== VALIDACIÓN DE CONFLICTOS =====
    // Verificar que el especialista no tenga otra cita en ese horario
    const fechaInicio = new Date(fechaCita + 'T00:00:00');
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    
    const citasEspecialista = await Cita.find({
      especialistaId,
      fechaCita: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $nin: ['cancelada', 'no_asistio'] }
    });
    
    // Calcular minutos de la nueva cita
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const inicioNuevaCita = horaI * 60 + minI;
    const finNuevaCita = inicioNuevaCita + duracionTotal;
    
    // Buscar conflictos
    const conflicto = citasEspecialista.find(cita => {
      const [hCita, mCita] = cita.horaInicio.split(':').map(Number);
      const inicioCitaExistente = hCita * 60 + mCita;
      const finCitaExistente = inicioCitaExistente + (cita.duracionTotal || 60);
      
      // Hay conflicto si los rangos se superponen
      return (inicioNuevaCita < finCitaExistente && finNuevaCita > inicioCitaExistente);
    });
    
    if (conflicto) {
      return res.status(400).json({ 
        mensaje: `El especialista ya tiene una cita a las ${conflicto.horaInicio}`,
        conflicto: {
          horaInicio: conflicto.horaInicio,
          cliente: conflicto.nombreCliente,
          servicio: conflicto.servicios?.[0]?.nombreServicio
        }
      });
    }
    // ===== FIN VALIDACIÓN =====

    // Parsear la fecha correctamente
    let fechaCitaParsed;
    if (typeof fechaCita === 'string') {
      // Si es string ISO o fecha simple, parsear
      if (fechaCita.includes('T')) {
        fechaCitaParsed = new Date(fechaCita);
      } else {
        // Formato YYYY-MM-DD, agregar hora para evitar problemas de timezone
        fechaCitaParsed = new Date(fechaCita + 'T12:00:00');
      }
    } else {
      fechaCitaParsed = new Date(fechaCita);
    }

    // Preparar datos de la cita
    const datosCita = {
      ...citaData,
      horaInicio,
      fechaCita: fechaCitaParsed,
      clienteId: clienteId,
      servicios: serviciosInfo,
      especialistaId,
      nombreEspecialista: `${especialista.nombre} ${especialista.apellido}`,
      duracionTotal
    };

    // Si el clienteId es un ObjectId válido de MongoDB, también guardarlo en cliente
    if (clienteId && clienteId.match(/^[0-9a-fA-F]{24}$/)) {
      datosCita.cliente = clienteId;
    }

    console.log('Datos de cita a guardar:', datosCita);

    const cita = await Cita.create(datosCita);

    console.log('Cita creada:', cita._id, 'Fecha:', cita.fechaCita);

    // Emitir evento de nueva cita
    const io = req.app.get('io');
    if (io) {
      io.emit('nuevaCita', cita);
      console.log('Evento nuevaCita emitido');
    }

    res.status(201).json(cita);
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(400).json({ mensaje: 'Error al crear cita', error: error.message });
  }
});

// PATCH - Cambiar estado
router.patch('/:id/estado', protegerRuta, async (req, res) => {
  try {
    const { estado } = req.body;
    const cita = await Cita.findByIdAndUpdate(req.params.id, { estado }, { new: true });

    // Si se completa, actualizar stats del especialista y puntos del cliente
    if (estado === 'completada') {
      await Especialista.findByIdAndUpdate(cita.especialistaId, {
        $inc: { citasCompletadas: 1 }
      });

      // Actualizar puntos y estadísticas del cliente
      const Cliente = require('../models/Cliente');
      const clienteId = cita.clienteId || cita.cliente;
      if (clienteId) {
        // 1 punto por cada $1 gastado
        const puntosGanados = Math.floor(cita.total || 0);
        await Cliente.findByIdAndUpdate(clienteId, {
          $inc: { 
            puntos: puntosGanados,
            totalCitas: 1,
            totalGastado: cita.total || 0
          },
          ultimaVisita: new Date()
        });
        console.log(`✨ Cliente ${clienteId} ganó ${puntosGanados} puntos`);
      }
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

// PATCH - Reasignar cita a otro especialista
router.patch('/:id/reasignar', protegerRuta, async (req, res) => {
  try {
    const { especialistaId } = req.body;
    
    if (!especialistaId) {
      return res.status(400).json({ mensaje: 'Se requiere especialistaId' });
    }
    
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }
    
    // Solo se pueden reasignar citas pendientes, confirmadas o en progreso
    if (!['pendiente', 'confirmada', 'en_progreso'].includes(cita.estado)) {
      return res.status(400).json({ mensaje: 'No se puede reasignar esta cita' });
    }
    
    // Obtener el nuevo especialista
    const nuevoEspecialista = await Especialista.findById(especialistaId);
    if (!nuevoEspecialista) {
      return res.status(404).json({ mensaje: 'Especialista no encontrado' });
    }
    
    if (!nuevoEspecialista.activo) {
      return res.status(400).json({ mensaje: 'El especialista no está activo' });
    }
    
    // Verificar que el nuevo especialista no tenga conflicto de horario
    const fechaInicio = new Date(cita.fechaCita);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    
    const citasEspecialista = await Cita.find({
      especialistaId,
      fechaCita: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $nin: ['cancelada', 'no_asistio'] },
      _id: { $ne: cita._id } // Excluir la cita actual
    });
    
    const [horaI, minI] = cita.horaInicio.split(':').map(Number);
    const inicioCita = horaI * 60 + minI;
    const finCita = inicioCita + (cita.duracionTotal || 60);
    
    const conflicto = citasEspecialista.find(c => {
      const [hC, mC] = c.horaInicio.split(':').map(Number);
      const inicioC = hC * 60 + mC;
      const finC = inicioC + (c.duracionTotal || 60);
      return (inicioCita < finC && finCita > inicioC);
    });
    
    if (conflicto) {
      return res.status(400).json({ 
        mensaje: `${nuevoEspecialista.nombre} ya tiene una cita a las ${conflicto.horaInicio}`,
        conflicto: {
          horaInicio: conflicto.horaInicio,
          cliente: conflicto.nombreCliente
        }
      });
    }
    
    // Guardar especialista anterior para el historial
    const especialistaAnterior = cita.nombreEspecialista;
    
    // Actualizar la cita
    cita.especialistaId = especialistaId;
    cita.nombreEspecialista = `${nuevoEspecialista.nombre} ${nuevoEspecialista.apellido}`;
    cita.notasInternas = `${cita.notasInternas || ''}\n[Reasignada de ${especialistaAnterior} a ${cita.nombreEspecialista}]`.trim();
    
    await cita.save();
    
    // Emitir evento
    const io = req.app.get('io');
    if (io) {
      io.emit('citaReasignada', {
        cita,
        especialistaAnterior,
        especialistaNuevo: cita.nombreEspecialista
      });
    }
    
    console.log(`✅ Cita ${cita._id} reasignada de ${especialistaAnterior} a ${cita.nombreEspecialista}`);
    
    res.json({
      mensaje: 'Cita reasignada exitosamente',
      cita,
      especialistaAnterior,
      especialistaNuevo: cita.nombreEspecialista
    });
    
  } catch (error) {
    console.error('Error reasignando cita:', error);
    res.status(500).json({ mensaje: 'Error al reasignar', error: error.message });
  }
});

// POST - Confirmar pago
router.post('/:id/pago', protegerRuta, async (req, res) => {
  try {
    const { metodoPago, referenciaPago, monto } = req.body;
    const Pago = require('../models/Pago');
    
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }
    
    // Calcular monto total si no viene
    const montoTotal = monto || cita.total || cita.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0;
    
    // Normalizar método de pago
    let metodoNormalizado = metodoPago || 'efectivo_bs';
    if (metodoNormalizado === 'efectivo') metodoNormalizado = 'efectivo_bs';
    
    // Crear registro de pago
    const pago = new Pago({
      cita: cita._id,
      cliente: cita.cliente || cita.clienteId,
      monto: montoTotal,
      metodoPago: metodoNormalizado,
      datosPago: { referencia: referenciaPago },
      estado: 'confirmado',
      fechaVerificacion: new Date()
    });
    
    await pago.save();
    
    // Actualizar cita
    cita.pagado = true;
    cita.metodoPago = metodoPago;
    cita.referenciaPago = referenciaPago;
    cita.pago = pago._id;
    await cita.save();
    
    res.json({ cita, pago });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
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

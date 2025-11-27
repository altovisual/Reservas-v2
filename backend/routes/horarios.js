const express = require('express');
const router = express.Router();
const Horario = require('../models/Horario');
const Cupo = require('../models/Cupo');
const Cita = require('../models/Cita');
const Especialista = require('../models/Especialista');

// Nombres de días
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// GET - Obtener todos los horarios configurados
router.get('/', async (req, res) => {
  try {
    let horarios = await Horario.find().sort({ diaSemana: 1 });
    
    // Si no hay horarios, crear los por defecto
    if (horarios.length === 0) {
      const horariosDefault = [];
      for (let i = 0; i < 7; i++) {
        horariosDefault.push({
          diaSemana: i,
          nombreDia: DIAS_SEMANA[i],
          activo: i !== 0, // Domingo cerrado por defecto
          horaApertura: '09:00',
          horaCierre: '18:00',
          inicioAlmuerzo: '12:00',
          finAlmuerzo: '13:00',
          intervalo: 30,
          cuposPorHora: 3
        });
      }
      horarios = await Horario.insertMany(horariosDefault);
    }
    
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// PUT - Actualizar horario de un día
router.put('/:diaSemana', async (req, res) => {
  try {
    const diaSemana = parseInt(req.params.diaSemana);
    
    // Validar que sea un día válido
    if (isNaN(diaSemana) || diaSemana < 0 || diaSemana > 6) {
      return res.status(400).json({ mensaje: 'Día de semana inválido' });
    }
    
    const datosHorario = {
      diaSemana,
      nombreDia: DIAS_SEMANA[diaSemana],
      activo: req.body.activo ?? true,
      horaApertura: req.body.horaApertura || '09:00',
      horaCierre: req.body.horaCierre || '18:00',
      inicioAlmuerzo: req.body.inicioAlmuerzo || '12:00',
      finAlmuerzo: req.body.finAlmuerzo || '13:00',
      intervalo: req.body.intervalo || 30,
      cuposPorHora: req.body.cuposPorHora || 3
    };
    
    const horario = await Horario.findOneAndUpdate(
      { diaSemana },
      datosHorario,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(horario);
  } catch (error) {
    console.error('Error guardando horario:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Crear/actualizar todos los horarios de una vez
router.post('/bulk', async (req, res) => {
  try {
    const { horarios } = req.body;
    
    const resultados = [];
    for (const h of horarios) {
      const horario = await Horario.findOneAndUpdate(
        { diaSemana: h.diaSemana },
        {
          ...h,
          nombreDia: DIAS_SEMANA[h.diaSemana]
        },
        { new: true, upsert: true }
      );
      resultados.push(horario);
    }
    
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Obtener cupos disponibles para una fecha
router.get('/cupos/:fecha', async (req, res) => {
  try {
    const fechaParam = req.params.fecha;
    const fecha = new Date(fechaParam + 'T00:00:00');
    
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ 
        disponible: false, 
        mensaje: 'Fecha inválida',
        cupos: [] 
      });
    }
    
    const diaSemana = fecha.getDay();
    
    // Obtener configuración del día
    let horario = await Horario.findOne({ diaSemana });
    
    // Si no existe el horario, crear uno por defecto
    if (!horario) {
      // Crear horarios por defecto si no existen
      const horariosDefault = [];
      for (let i = 0; i < 7; i++) {
        horariosDefault.push({
          diaSemana: i,
          nombreDia: DIAS_SEMANA[i],
          activo: i !== 0,
          horaApertura: '09:00',
          horaCierre: '18:00',
          inicioAlmuerzo: '12:00',
          finAlmuerzo: '13:00',
          intervalo: 30,
          cuposPorHora: 3
        });
      }
      await Horario.insertMany(horariosDefault);
      horario = horariosDefault[diaSemana];
    }
    
    if (!horario.activo) {
      return res.json({ 
        disponible: false, 
        mensaje: 'Este día no está disponible para citas',
        cupos: [] 
      });
    }
    
    // Obtener especialistas activos
    const especialistas = await Especialista.find({ activo: true });
    
    // Obtener citas existentes para esa fecha
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    const citasExistentes = await Cita.find({
      fechaCita: { $gte: fecha, $lte: fechaFin },
      estado: { $nin: ['cancelada'] }
    });
    
    // Generar cupos
    const cupos = [];
    const [horaAp, minAp] = horario.horaApertura.split(':').map(Number);
    const [horaCi, minCi] = horario.horaCierre.split(':').map(Number);
    const [horaAlmI, minAlmI] = horario.inicioAlmuerzo.split(':').map(Number);
    const [horaAlmF, minAlmF] = horario.finAlmuerzo.split(':').map(Number);
    
    let horaActual = horaAp * 60 + minAp;
    const horaFinal = horaCi * 60 + minCi;
    const almuerzoInicio = horaAlmI * 60 + minAlmI;
    const almuerzoFin = horaAlmF * 60 + minAlmF;
    
    while (horaActual < horaFinal) {
      // Saltar hora de almuerzo
      if (horaActual >= almuerzoInicio && horaActual < almuerzoFin) {
        horaActual = almuerzoFin;
        continue;
      }
      
      const horaStr = `${Math.floor(horaActual / 60).toString().padStart(2, '0')}:${(horaActual % 60).toString().padStart(2, '0')}`;
      
      // Contar cuántas citas hay en esta hora
      const citasEnHora = citasExistentes.filter(c => c.horaInicio === horaStr);
      const cuposDisponibles = horario.cuposPorHora - citasEnHora.length;
      
      // Verificar si ya pasó la hora (para hoy)
      const ahora = new Date();
      const esHoy = fecha.toDateString() === ahora.toDateString();
      const horaActualReal = ahora.getHours() * 60 + ahora.getMinutes();
      const yaPaso = esHoy && horaActual <= horaActualReal;
      
      cupos.push({
        hora: horaStr,
        disponibles: yaPaso ? 0 : cuposDisponibles,
        total: horario.cuposPorHora,
        ocupados: citasEnHora.length,
        estado: yaPaso ? 'pasado' : (cuposDisponibles > 0 ? 'disponible' : 'ocupado')
      });
      
      horaActual += horario.intervalo;
    }
    
    res.json({
      disponible: true,
      fecha: fecha,
      horario: {
        apertura: horario.horaApertura,
        cierre: horario.horaCierre,
        almuerzo: `${horario.inicioAlmuerzo} - ${horario.finAlmuerzo}`
      },
      cupos
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Bloquear un cupo específico
router.post('/bloquear', async (req, res) => {
  try {
    const { fecha, hora, motivo } = req.body;
    
    const cupo = await Cupo.findOneAndUpdate(
      { fecha: new Date(fecha), hora },
      { estado: 'bloqueado', notas: motivo },
      { new: true, upsert: true }
    );
    
    res.json({ mensaje: 'Cupo bloqueado', cupo });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Desbloquear un cupo
router.post('/desbloquear', async (req, res) => {
  try {
    const { fecha, hora } = req.body;
    
    await Cupo.findOneAndDelete({ fecha: new Date(fecha), hora, estado: 'bloqueado' });
    
    res.json({ mensaje: 'Cupo desbloqueado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Disponibilidad por especialista para una fecha
// Retorna los horarios disponibles de cada especialista
router.get('/disponibilidad/:fecha', async (req, res) => {
  try {
    const fechaParam = req.params.fecha;
    const { duracion = 60 } = req.query; // Duración del servicio en minutos
    const duracionMin = parseInt(duracion);
    
    const fecha = new Date(fechaParam + 'T00:00:00');
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ mensaje: 'Fecha inválida' });
    }
    
    const diaSemana = fecha.getDay();
    const diasNombre = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaKey = diasNombre[diaSemana];
    
    // Obtener horario general del spa
    let horarioSpa = await Horario.findOne({ diaSemana });
    if (!horarioSpa || !horarioSpa.activo) {
      return res.json({ 
        disponible: false, 
        mensaje: 'El spa está cerrado este día',
        especialistas: [] 
      });
    }
    
    // Obtener especialistas activos
    const especialistas = await Especialista.find({ activo: true });
    
    // Obtener citas existentes para esa fecha (no canceladas)
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    const citasExistentes = await Cita.find({
      fechaCita: { $gte: fecha, $lte: fechaFin },
      estado: { $nin: ['cancelada', 'no_asistio'] }
    });
    
    // Hora actual para validar si ya pasó
    const ahora = new Date();
    const esHoy = fecha.toDateString() === ahora.toDateString();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    
    // Generar disponibilidad por especialista
    const resultado = especialistas.map(esp => {
      const horarioEsp = esp.horarioTrabajo?.[diaKey];
      
      // Si el especialista no trabaja este día
      if (!horarioEsp || !horarioEsp.trabaja) {
        return {
          especialista: {
            _id: esp._id,
            nombre: esp.nombre,
            apellido: esp.apellido,
            nombreCompleto: `${esp.nombre} ${esp.apellido}`,
            foto: esp.foto,
            color: esp.color,
            especialidades: esp.especialidades
          },
          trabaja: false,
          horarios: []
        };
      }
      
      // Obtener horario del especialista
      const [horaIni, minIni] = horarioEsp.inicio.split(':').map(Number);
      const [horaFin, minFin] = horarioEsp.fin.split(':').map(Number);
      const inicioMin = horaIni * 60 + minIni;
      const finMin = horaFin * 60 + minFin;
      
      // Horario de almuerzo del spa
      const [horaAlmI, minAlmI] = horarioSpa.inicioAlmuerzo.split(':').map(Number);
      const [horaAlmF, minAlmF] = horarioSpa.finAlmuerzo.split(':').map(Number);
      const almuerzoIni = horaAlmI * 60 + minAlmI;
      const almuerzoFin = horaAlmF * 60 + minAlmF;
      
      // Citas de este especialista
      const citasEsp = citasExistentes.filter(c => 
        c.especialistaId?.toString() === esp._id.toString()
      );
      
      // Generar slots disponibles
      const horarios = [];
      const intervalo = horarioSpa.intervalo || 30;
      
      for (let minuto = inicioMin; minuto + duracionMin <= finMin; minuto += intervalo) {
        // Saltar hora de almuerzo
        if (minuto >= almuerzoIni && minuto < almuerzoFin) continue;
        if (minuto + duracionMin > almuerzoIni && minuto < almuerzoFin) continue;
        
        const horaStr = `${Math.floor(minuto / 60).toString().padStart(2, '0')}:${(minuto % 60).toString().padStart(2, '0')}`;
        const finSlot = minuto + duracionMin;
        const horaFinStr = `${Math.floor(finSlot / 60).toString().padStart(2, '0')}:${(finSlot % 60).toString().padStart(2, '0')}`;
        
        // Verificar si ya pasó (para hoy)
        if (esHoy && minuto <= minutosActuales) {
          continue; // No mostrar horarios pasados
        }
        
        // Verificar si hay conflicto con citas existentes
        const tieneConflicto = citasEsp.some(cita => {
          const [hCita, mCita] = cita.horaInicio.split(':').map(Number);
          const inicioCita = hCita * 60 + mCita;
          const finCita = inicioCita + (cita.duracionTotal || 60);
          
          // Hay conflicto si los rangos se superponen
          return (minuto < finCita && finSlot > inicioCita);
        });
        
        if (!tieneConflicto) {
          horarios.push({
            hora: horaStr,
            horaFin: horaFinStr,
            disponible: true
          });
        }
      }
      
      return {
        especialista: {
          _id: esp._id,
          nombre: esp.nombre,
          apellido: esp.apellido,
          nombreCompleto: `${esp.nombre} ${esp.apellido}`,
          foto: esp.foto,
          color: esp.color,
          especialidades: esp.especialidades,
          calificacion: esp.calificacionPromedio
        },
        trabaja: true,
        horarioTrabajo: `${horarioEsp.inicio} - ${horarioEsp.fin}`,
        horariosDisponibles: horarios.length,
        horarios
      };
    });
    
    res.json({
      fecha: fechaParam,
      diaSemana: DIAS_SEMANA[diaSemana],
      horarioSpa: {
        apertura: horarioSpa.horaApertura,
        cierre: horarioSpa.horaCierre,
        almuerzo: `${horarioSpa.inicioAlmuerzo} - ${horarioSpa.finAlmuerzo}`
      },
      duracionServicio: duracionMin,
      especialistas: resultado.filter(e => e.trabaja),
      especialistasNoDisponibles: resultado.filter(e => !e.trabaja)
    });
    
  } catch (error) {
    console.error('Error en disponibilidad:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Verificar si un especialista está disponible en una hora específica
router.get('/verificar-disponibilidad', async (req, res) => {
  try {
    const { fecha, hora, especialistaId, duracion = 60 } = req.query;
    
    if (!fecha || !hora || !especialistaId) {
      return res.status(400).json({ 
        disponible: false, 
        mensaje: 'Faltan parámetros: fecha, hora, especialistaId' 
      });
    }
    
    const fechaObj = new Date(fecha + 'T00:00:00');
    const fechaFin = new Date(fechaObj);
    fechaFin.setHours(23, 59, 59, 999);
    
    const [horaI, minI] = hora.split(':').map(Number);
    const inicioSolicitado = horaI * 60 + minI;
    const finSolicitado = inicioSolicitado + parseInt(duracion);
    
    // Buscar citas del especialista en esa fecha
    const citasEsp = await Cita.find({
      especialistaId,
      fechaCita: { $gte: fechaObj, $lte: fechaFin },
      estado: { $nin: ['cancelada', 'no_asistio'] }
    });
    
    // Verificar conflictos
    const conflicto = citasEsp.find(cita => {
      const [hCita, mCita] = cita.horaInicio.split(':').map(Number);
      const inicioCita = hCita * 60 + mCita;
      const finCita = inicioCita + (cita.duracionTotal || 60);
      
      return (inicioSolicitado < finCita && finSolicitado > inicioCita);
    });
    
    if (conflicto) {
      return res.json({
        disponible: false,
        mensaje: `El especialista tiene una cita de ${conflicto.horaInicio} a ${conflicto.horaInicio}`,
        conflicto: {
          horaInicio: conflicto.horaInicio,
          cliente: conflicto.nombreCliente
        }
      });
    }
    
    res.json({ disponible: true });
    
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Resumen de disponibilidad del mes
router.get('/resumen/:mes/:anio', async (req, res) => {
  try {
    const { mes, anio } = req.params;
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    
    // Obtener horarios
    const horarios = await Horario.find();
    const horariosMap = {};
    horarios.forEach(h => horariosMap[h.diaSemana] = h);
    
    // Obtener citas del mes
    const citas = await Cita.find({
      fechaCita: { $gte: primerDia, $lte: ultimoDia },
      estado: { $nin: ['cancelada'] }
    });
    
    // Generar resumen por día
    const resumen = [];
    const fecha = new Date(primerDia);
    
    while (fecha <= ultimoDia) {
      const diaSemana = fecha.getDay();
      const horario = horariosMap[diaSemana];
      
      if (horario && horario.activo) {
        const fechaStr = fecha.toISOString().split('T')[0];
        const citasDelDia = citas.filter(c => 
          c.fechaCita.toISOString().split('T')[0] === fechaStr
        );
        
        // Calcular cupos totales del día
        const [horaAp, minAp] = horario.horaApertura.split(':').map(Number);
        const [horaCi, minCi] = horario.horaCierre.split(':').map(Number);
        const [horaAlmI] = horario.inicioAlmuerzo.split(':').map(Number);
        const [horaAlmF] = horario.finAlmuerzo.split(':').map(Number);
        
        const horasDisponibles = ((horaCi - horaAp) - (horaAlmF - horaAlmI)) * (60 / horario.intervalo);
        const cuposTotales = horasDisponibles * horario.cuposPorHora;
        
        resumen.push({
          fecha: fechaStr,
          diaSemana: horario.nombreDia,
          cuposTotales: Math.floor(cuposTotales),
          cuposOcupados: citasDelDia.length,
          cuposDisponibles: Math.floor(cuposTotales) - citasDelDia.length,
          porcentajeOcupacion: Math.round((citasDelDia.length / cuposTotales) * 100)
        });
      } else {
        resumen.push({
          fecha: fecha.toISOString().split('T')[0],
          diaSemana: DIAS_SEMANA[diaSemana],
          cerrado: true
        });
      }
      
      fecha.setDate(fecha.getDate() + 1);
    }
    
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

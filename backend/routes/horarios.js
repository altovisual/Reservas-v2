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
    const { diaSemana } = req.params;
    const horario = await Horario.findOneAndUpdate(
      { diaSemana: parseInt(diaSemana) },
      { ...req.body, nombreDia: DIAS_SEMANA[parseInt(diaSemana)] },
      { new: true, upsert: true }
    );
    res.json(horario);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Obtener cupos disponibles para una fecha
router.get('/cupos/:fecha', async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);
    fecha.setHours(0, 0, 0, 0);
    
    const diaSemana = fecha.getDay();
    
    // Obtener configuración del día
    const horario = await Horario.findOne({ diaSemana });
    
    if (!horario || !horario.activo) {
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

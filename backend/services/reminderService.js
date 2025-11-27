const cron = require('node-cron');
const Cita = require('../models/Cita');
const { enviarRecordatorio } = require('./emailService');

// Set para trackear citas a las que ya se envió recordatorio
const recordatoriosEnviados = new Set();

// Verificar citas próximas y enviar recordatorios
const verificarCitasProximas = async () => {
  try {
    const ahora = new Date();
    const en20Minutos = new Date(ahora.getTime() + 20 * 60 * 1000);
    const en25Minutos = new Date(ahora.getTime() + 25 * 60 * 1000);
    
    // Buscar citas que empiezan en los próximos 20-25 minutos
    const hoy = ahora.toISOString().split('T')[0];
    
    const citas = await Cita.find({
      fechaCita: {
        $gte: new Date(hoy),
        $lt: new Date(new Date(hoy).getTime() + 24 * 60 * 60 * 1000)
      },
      estado: { $in: ['pendiente', 'confirmada'] },
      email: { $exists: true, $ne: '' }
    });

    for (const cita of citas) {
      // Crear fecha/hora de la cita
      const [horas, minutos] = cita.horaInicio.split(':').map(Number);
      const fechaHoraCita = new Date(cita.fechaCita);
      fechaHoraCita.setHours(horas, minutos, 0, 0);
      
      // Verificar si la cita está en el rango de 20-25 minutos
      const diferenciaMs = fechaHoraCita.getTime() - ahora.getTime();
      const diferenciaMinutos = diferenciaMs / (60 * 1000);
      
      // Si está entre 18 y 22 minutos (ventana de 4 minutos para no perder ninguna)
      if (diferenciaMinutos >= 18 && diferenciaMinutos <= 22) {
        const citaId = cita._id.toString();
        
        // Verificar si ya se envió recordatorio
        if (!recordatoriosEnviados.has(citaId)) {
          console.log(`⏰ Enviando recordatorio para cita ${citaId} - ${cita.nombreCliente} a las ${cita.horaInicio}`);
          
          const enviado = await enviarRecordatorio(cita);
          
          if (enviado) {
            recordatoriosEnviados.add(citaId);
            
            // Actualizar cita para marcar que se envió recordatorio
            await Cita.findByIdAndUpdate(citaId, {
              recordatorioEnviado: true,
              fechaRecordatorio: new Date()
            });
          }
        }
      }
    }
    
    // Limpiar recordatorios antiguos (más de 24 horas)
    // Esto evita que el Set crezca indefinidamente
    if (recordatoriosEnviados.size > 1000) {
      recordatoriosEnviados.clear();
    }
    
  } catch (error) {
    console.error('Error verificando citas próximas:', error.message);
  }
};

// Iniciar el servicio de recordatorios
const iniciarServicioRecordatorios = () => {
  console.log('🔔 Servicio de recordatorios iniciado');
  
  // Ejecutar cada minuto para verificar citas próximas
  cron.schedule('* * * * *', () => {
    verificarCitasProximas();
  });
  
  // También ejecutar inmediatamente al iniciar
  verificarCitasProximas();
};

module.exports = {
  iniciarServicioRecordatorios,
  verificarCitasProximas
};

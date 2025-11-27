const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Cita = require('../models/Cita');
const Pago = require('../models/Pago');
const Especialista = require('../models/Especialista');

// GET - Obtener reportes
router.get('/', async (req, res) => {
  try {
    const { periodo } = req.query;
    
    // Calcular fechas según el periodo
    const ahora = new Date();
    let fechaInicio, fechaAnteriorInicio, fechaAnteriorFin;
    
    switch(periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fechaAnteriorInicio = new Date(fechaInicio);
        fechaAnteriorInicio.setDate(fechaAnteriorInicio.getDate() - 1);
        fechaAnteriorFin = new Date(fechaInicio);
        break;
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        fechaAnteriorInicio = new Date(fechaInicio);
        fechaAnteriorInicio.setDate(fechaAnteriorInicio.getDate() - 7);
        fechaAnteriorFin = new Date(fechaInicio);
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fechaAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        fechaAnteriorFin = new Date(fechaInicio);
        break;
      case 'año':
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        fechaAnteriorInicio = new Date(ahora.getFullYear() - 1, 0, 1);
        fechaAnteriorFin = new Date(fechaInicio);
        break;
      default:
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        fechaAnteriorInicio = new Date(fechaInicio);
        fechaAnteriorInicio.setDate(fechaAnteriorInicio.getDate() - 7);
        fechaAnteriorFin = new Date(fechaInicio);
    }

    console.log('📊 Reportes - Periodo:', periodo);
    console.log('📊 Fecha inicio:', fechaInicio);
    console.log('📊 Fecha fin:', ahora);

    // Obtener TODAS las citas primero para debug
    const todasLasCitas = await Cita.find({});
    console.log('📊 Total citas en BD:', todasLasCitas.length);
    
    if (todasLasCitas.length > 0) {
      console.log('📊 Ejemplo fecha cita:', todasLasCitas[0].fechaCita);
    }

    // Filtrar citas por periodo
    let citas = todasLasCitas.filter(cita => {
      const fechaCita = new Date(cita.fechaCita);
      const createdAt = new Date(cita.createdAt);
      return (fechaCita >= fechaInicio && fechaCita <= ahora) || 
             (createdAt >= fechaInicio && createdAt <= ahora);
    });
    
    console.log('📊 Citas en periodo:', citas.length);
    
    // Si es "hoy" y no hay citas, mostrar todas para que el reporte no esté vacío
    if (periodo === 'hoy' && citas.length === 0) {
      // Buscar citas de los últimos 30 días para mostrar algo
      const hace30Dias = new Date(ahora);
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      citas = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaCita);
        return fechaCita >= hace30Dias;
      });
      console.log('📊 Mostrando citas de últimos 30 días:', citas.length);
    }

    // Obtener citas del periodo anterior para comparación
    const citasAnteriores = todasLasCitas.filter(cita => {
      const fechaCita = new Date(cita.fechaCita);
      return fechaCita >= fechaAnteriorInicio && fechaCita < fechaAnteriorFin;
    });

    // Calcular estadísticas de citas
    const citasStats = {
      total: citas.length,
      completadas: citas.filter(c => c.estado === 'completada').length,
      canceladas: citas.filter(c => c.estado === 'cancelada').length,
      pendientes: citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length
    };

    // Calcular ingresos
    const ingresosActuales = citas
      .filter(c => c.estado === 'completada' || c.pagado)
      .reduce((sum, c) => sum + (c.total || 0), 0);

    const ingresosAnteriores = citasAnteriores
      .filter(c => c.estado === 'completada' || c.pagado)
      .reduce((sum, c) => sum + (c.total || 0), 0);

    // Ingresos por día (últimos 7 días)
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const ingresosPorDia = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(ahora);
      fecha.setDate(ahora.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      const citasDelDia = citas.filter(c => {
        const fechaCita = new Date(c.fechaCita);
        return fechaCita >= fecha && fechaCita <= fechaFin && (c.estado === 'completada' || c.pagado);
      });
      
      const montoDelDia = citasDelDia.reduce((sum, c) => sum + (c.total || 0), 0);
      
      ingresosPorDia.push({
        dia: diasSemana[fecha.getDay()],
        monto: montoDelDia
      });
    }

    // Servicios populares
    const serviciosMap = {};
    citas.forEach(cita => {
      if (cita.servicios && cita.servicios.length > 0) {
        cita.servicios.forEach(servicio => {
          const nombre = servicio.nombreServicio || servicio.nombre || 'Sin nombre';
          if (!serviciosMap[nombre]) {
            serviciosMap[nombre] = { nombre, cantidad: 0, ingresos: 0 };
          }
          serviciosMap[nombre].cantidad++;
          serviciosMap[nombre].ingresos += servicio.precio || 0;
        });
      }
    });
    
    const serviciosPopulares = Object.values(serviciosMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Top especialistas
    const especialistasMap = {};
    citas.filter(c => c.estado === 'completada').forEach(cita => {
      const nombre = cita.nombreEspecialista || 'Sin asignar';
      const id = cita.especialistaId || nombre;
      if (!especialistasMap[id]) {
        especialistasMap[id] = { 
          nombre, 
          citas: 0, 
          ingresos: 0, 
          calificaciones: [],
          calificacion: 0 
        };
      }
      especialistasMap[id].citas++;
      especialistasMap[id].ingresos += cita.total || 0;
      if (cita.calificacion) {
        especialistasMap[id].calificaciones.push(cita.calificacion);
      }
    });

    // Calcular calificación promedio
    Object.values(especialistasMap).forEach(esp => {
      if (esp.calificaciones.length > 0) {
        esp.calificacion = (esp.calificaciones.reduce((a, b) => a + b, 0) / esp.calificaciones.length).toFixed(1);
      } else {
        esp.calificacion = 0;
      }
      delete esp.calificaciones;
    });

    const especialistasTop = Object.values(especialistasMap)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    // Horarios populares
    const horariosMap = {};
    citas.forEach(cita => {
      const hora = cita.horaInicio || '00:00';
      if (!horariosMap[hora]) {
        horariosMap[hora] = { hora, citas: 0 };
      }
      horariosMap[hora].citas++;
    });

    const horariosPopulares = Object.values(horariosMap)
      .sort((a, b) => b.citas - a.citas)
      .slice(0, 8);

    res.json({
      ingresos: {
        total: ingresosActuales,
        anterior: ingresosAnteriores,
        porDia: ingresosPorDia
      },
      citas: citasStats,
      serviciosPopulares,
      especialistasTop,
      horariosPopulares
    });

  } catch (error) {
    console.error('Error en reportes:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Exportar reportes (CSV estructurado)
router.get('/exportar', async (req, res) => {
  try {
    const { periodo } = req.query;
    
    const ahora = new Date();
    let fechaInicio, nombrePeriodo;
    
    switch(periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        nombrePeriodo = 'Hoy';
        break;
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        nombrePeriodo = 'Última Semana';
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        nombrePeriodo = ahora.toLocaleDateString('es', { month: 'long', year: 'numeric' });
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        nombrePeriodo = `Año ${ahora.getFullYear()}`;
    }

    // Obtener todas las citas - usar TODAS para el CSV
    const todasLasCitas = await Cita.find({}).sort({ fechaCita: -1 });
    
    // Usar todas las citas disponibles
    const citas = todasLasCitas;
    
    // Actualizar nombre del periodo
    if (todasLasCitas.length > 0) {
      const fechaMasAntigua = new Date(Math.min(...todasLasCitas.map(c => new Date(c.fechaCita))));
      const fechaMasReciente = new Date(Math.max(...todasLasCitas.map(c => new Date(c.fechaCita))));
      nombrePeriodo = `${fechaMasAntigua.toLocaleDateString('es')} - ${fechaMasReciente.toLocaleDateString('es')}`;
    }

    // Calcular métricas
    const totalCitas = citas.length;
    const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
    const citasCanceladas = citas.filter(c => c.estado === 'cancelada').length;
    const citasPendientes = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado)).length;
    const citasPagadas = citas.filter(c => c.pagado).length;
    
    const ingresosTotales = citas.filter(c => c.pagado || c.estado === 'completada').reduce((sum, c) => sum + (c.total || 0), 0);
    const ingresosPagados = citas.filter(c => c.pagado).reduce((sum, c) => sum + (c.total || 0), 0);
    const ingresosPendientes = citas.filter(c => !c.pagado && c.estado === 'completada').reduce((sum, c) => sum + (c.total || 0), 0);
    
    const tasaExito = totalCitas > 0 ? ((citasCompletadas / totalCitas) * 100).toFixed(1) : 0;
    const tasaCancelacion = totalCitas > 0 ? ((citasCanceladas / totalCitas) * 100).toFixed(1) : 0;
    const ticketPromedio = citasCompletadas > 0 ? (ingresosTotales / citasCompletadas).toFixed(2) : 0;

    // Servicios más vendidos
    const serviciosMap = {};
    citas.forEach(cita => {
      cita.servicios?.forEach(servicio => {
        const nombre = servicio.nombreServicio || 'Sin nombre';
        if (!serviciosMap[nombre]) {
          serviciosMap[nombre] = { cantidad: 0, ingresos: 0 };
        }
        serviciosMap[nombre].cantidad++;
        serviciosMap[nombre].ingresos += servicio.precio || 0;
      });
    });
    const serviciosOrdenados = Object.entries(serviciosMap)
      .sort((a, b) => b[1].cantidad - a[1].cantidad);

    // Especialistas
    const especialistasMap = {};
    citas.filter(c => c.estado === 'completada').forEach(cita => {
      const nombre = cita.nombreEspecialista || 'Sin asignar';
      if (!especialistasMap[nombre]) {
        especialistasMap[nombre] = { citas: 0, ingresos: 0 };
      }
      especialistasMap[nombre].citas++;
      especialistasMap[nombre].ingresos += cita.total || 0;
    });
    const especialistasOrdenados = Object.entries(especialistasMap)
      .sort((a, b) => b[1].ingresos - a[1].ingresos);

    // Ingresos por día
    const ingresosPorDia = {};
    citas.filter(c => c.pagado || c.estado === 'completada').forEach(cita => {
      const fecha = new Date(cita.fechaCita).toLocaleDateString('es');
      if (!ingresosPorDia[fecha]) {
        ingresosPorDia[fecha] = { citas: 0, ingresos: 0 };
      }
      ingresosPorDia[fecha].citas++;
      ingresosPorDia[fecha].ingresos += cita.total || 0;
    });

    // Métodos de pago
    const metodosPago = {};
    citas.filter(c => c.pagado).forEach(cita => {
      const metodo = cita.metodoPago || 'No especificado';
      if (!metodosPago[metodo]) {
        metodosPago[metodo] = { cantidad: 0, monto: 0 };
      }
      metodosPago[metodo].cantidad++;
      metodosPago[metodo].monto += cita.total || 0;
    });

    // Generar CSV estructurado
    const fechaGeneracion = new Date().toLocaleString('es');
    let csv = '';
    
    // Encabezado del reporte
    csv += '═══════════════════════════════════════════════════════════════\n';
    csv += 'REPORTE DE NAIL SPA\n';
    csv += '═══════════════════════════════════════════════════════════════\n';
    csv += `Periodo: ${nombrePeriodo}\n`;
    csv += `Fecha de generación: ${fechaGeneracion}\n`;
    csv += `Desde: ${fechaInicio.toLocaleDateString('es')}\n`;
    csv += `Hasta: ${ahora.toLocaleDateString('es')}\n`;
    csv += '\n';

    // Resumen ejecutivo
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'RESUMEN EJECUTIVO\n';
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += `Total de Citas,${totalCitas}\n`;
    csv += `Citas Completadas,${citasCompletadas}\n`;
    csv += `Citas Canceladas,${citasCanceladas}\n`;
    csv += `Citas Pendientes,${citasPendientes}\n`;
    csv += `Tasa de Éxito,${tasaExito}%\n`;
    csv += `Tasa de Cancelación,${tasaCancelacion}%\n`;
    csv += '\n';

    // Métricas financieras
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'MÉTRICAS FINANCIERAS\n';
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += `Ingresos Totales,$${ingresosTotales.toFixed(2)}\n`;
    csv += `Ingresos Cobrados,$${ingresosPagados.toFixed(2)}\n`;
    csv += `Ingresos Pendientes,$${ingresosPendientes.toFixed(2)}\n`;
    csv += `Ticket Promedio,$${ticketPromedio}\n`;
    csv += `Citas Pagadas,${citasPagadas} de ${citasCompletadas}\n`;
    csv += '\n';

    // Servicios más vendidos
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'TOP SERVICIOS\n';
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'Servicio,Cantidad,Ingresos\n';
    serviciosOrdenados.slice(0, 10).forEach(([nombre, data]) => {
      csv += `${nombre},${data.cantidad},$${data.ingresos.toFixed(2)}\n`;
    });
    csv += '\n';

    // Rendimiento por especialista
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'RENDIMIENTO POR ESPECIALISTA\n';
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'Especialista,Citas Completadas,Ingresos Generados\n';
    especialistasOrdenados.forEach(([nombre, data]) => {
      csv += `${nombre},${data.citas},$${data.ingresos.toFixed(2)}\n`;
    });
    csv += '\n';

    // Métodos de pago
    if (Object.keys(metodosPago).length > 0) {
      csv += '───────────────────────────────────────────────────────────────\n';
      csv += 'MÉTODOS DE PAGO\n';
      csv += '───────────────────────────────────────────────────────────────\n';
      csv += 'Método,Transacciones,Monto Total\n';
      Object.entries(metodosPago).forEach(([metodo, data]) => {
        csv += `${metodo},${data.cantidad},$${data.monto.toFixed(2)}\n`;
      });
      csv += '\n';
    }

    // Ingresos por día
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'INGRESOS POR DÍA\n';
    csv += '───────────────────────────────────────────────────────────────\n';
    csv += 'Fecha,Citas,Ingresos\n';
    Object.entries(ingresosPorDia)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .forEach(([fecha, data]) => {
        csv += `${fecha},${data.citas},$${data.ingresos.toFixed(2)}\n`;
      });
    csv += '\n';

    // Detalle de citas
    csv += '═══════════════════════════════════════════════════════════════\n';
    csv += 'DETALLE DE CITAS\n';
    csv += '═══════════════════════════════════════════════════════════════\n';
    csv += 'Fecha,Hora,Cliente,Teléfono,Servicios,Total,Estado,Pagado,Especialista\n';
    
    citas.forEach(cita => {
      const fecha = new Date(cita.fechaCita).toLocaleDateString('es');
      const servicios = cita.servicios?.map(s => s.nombreServicio).join(' + ') || '';
      const estado = cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1).replace('_', ' ');
      csv += `${fecha},${cita.horaInicio},"${cita.nombreCliente}",${cita.telefono},"${servicios}",$${cita.total || 0},${estado},${cita.pagado ? 'Sí' : 'No'},${cita.nombreEspecialista || 'N/A'}\n`;
    });

    csv += '\n═══════════════════════════════════════════════════════════════\n';
    csv += 'FIN DEL REPORTE\n';
    csv += '═══════════════════════════════════════════════════════════════\n';

    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_NailSpa_${periodo}_${Date.now()}.csv`);
    res.send(BOM + csv);

  } catch (error) {
    console.error('Error exportando:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Exportar reportes en PDF
router.get('/exportar-pdf', async (req, res) => {
  try {
    const { periodo } = req.query;
    
    const ahora = new Date();
    let fechaInicio, nombrePeriodo;
    
    switch(periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        nombrePeriodo = 'Hoy';
        break;
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        nombrePeriodo = 'Última Semana';
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        nombrePeriodo = ahora.toLocaleDateString('es', { month: 'long', year: 'numeric' });
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        nombrePeriodo = `Año ${ahora.getFullYear()}`;
    }

    // Obtener todas las citas - usar TODAS para el reporte
    const todasLasCitas = await Cita.find({}).sort({ fechaCita: -1 });
    
    // Usar todas las citas disponibles para el PDF
    const citas = todasLasCitas;
    
    // Actualizar nombre del periodo si usamos todas
    if (todasLasCitas.length > 0) {
      const fechaMasAntigua = new Date(Math.min(...todasLasCitas.map(c => new Date(c.fechaCita))));
      const fechaMasReciente = new Date(Math.max(...todasLasCitas.map(c => new Date(c.fechaCita))));
      nombrePeriodo = `${fechaMasAntigua.toLocaleDateString('es')} - ${fechaMasReciente.toLocaleDateString('es')}`;
    }

    // Calcular métricas
    const totalCitas = citas.length;
    const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
    const citasCanceladas = citas.filter(c => c.estado === 'cancelada').length;
    const citasPendientes = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado)).length;
    const citasEnProgreso = citas.filter(c => c.estado === 'en_progreso').length;
    const citasPagadas = citas.filter(c => c.pagado).length;
    
    const ingresosTotales = citas.filter(c => c.pagado || c.estado === 'completada').reduce((sum, c) => sum + (c.total || 0), 0);
    const ingresosPagados = citas.filter(c => c.pagado).reduce((sum, c) => sum + (c.total || 0), 0);
    const ingresosPendientes = citas.filter(c => !c.pagado && c.estado === 'completada').reduce((sum, c) => sum + (c.total || 0), 0);
    
    const tasaExito = totalCitas > 0 ? ((citasCompletadas / totalCitas) * 100).toFixed(1) : 0;
    const tasaCancelacion = totalCitas > 0 ? ((citasCanceladas / totalCitas) * 100).toFixed(1) : 0;
    const ticketPromedio = citasCompletadas > 0 ? (ingresosTotales / citasCompletadas).toFixed(2) : 0;

    // Servicios más vendidos
    const serviciosMap = {};
    citas.forEach(cita => {
      cita.servicios?.forEach(servicio => {
        const nombre = servicio.nombreServicio || 'Sin nombre';
        if (!serviciosMap[nombre]) {
          serviciosMap[nombre] = { cantidad: 0, ingresos: 0 };
        }
        serviciosMap[nombre].cantidad++;
        serviciosMap[nombre].ingresos += servicio.precio || 0;
      });
    });
    const serviciosOrdenados = Object.entries(serviciosMap).sort((a, b) => b[1].cantidad - a[1].cantidad);

    // Especialistas
    const especialistasMap = {};
    citas.filter(c => c.estado === 'completada').forEach(cita => {
      const nombre = cita.nombreEspecialista || 'Sin asignar';
      if (!especialistasMap[nombre]) {
        especialistasMap[nombre] = { citas: 0, ingresos: 0 };
      }
      especialistasMap[nombre].citas++;
      especialistasMap[nombre].ingresos += cita.total || 0;
    });
    const especialistasOrdenados = Object.entries(especialistasMap).sort((a, b) => b[1].ingresos - a[1].ingresos);

    // Ingresos por día
    const ingresosPorDia = {};
    citas.filter(c => c.pagado || c.estado === 'completada').forEach(cita => {
      const fecha = new Date(cita.fechaCita).toLocaleDateString('es');
      if (!ingresosPorDia[fecha]) {
        ingresosPorDia[fecha] = { citas: 0, ingresos: 0 };
      }
      ingresosPorDia[fecha].citas++;
      ingresosPorDia[fecha].ingresos += cita.total || 0;
    });

    // Métodos de pago
    const metodosPago = {};
    citas.filter(c => c.pagado).forEach(cita => {
      const metodo = cita.metodoPago || 'No especificado';
      if (!metodosPago[metodo]) {
        metodosPago[metodo] = { cantidad: 0, monto: 0 };
      }
      metodosPago[metodo].cantidad++;
      metodosPago[metodo].monto += cita.total || 0;
    });

    // Crear PDF
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_NailSpa_${periodo}_${Date.now()}.pdf`);
    
    doc.pipe(res);

    // Colores
    const colorPrimario = '#10B981';
    const colorSecundario = '#059669';
    const colorTexto = '#1F2937';
    const colorGris = '#6B7280';
    const colorFondo = '#F3F4F6';

    // ============ PÁGINA 1: PORTADA Y RESUMEN ============
    
    // Header con fondo
    doc.rect(0, 0, 612, 120).fill(colorPrimario);
    
    // Logo/Título
    doc.fontSize(32).fillColor('white').font('Helvetica-Bold')
       .text('NAIL SPA', 50, 35, { align: 'center' });
    doc.fontSize(14).fillColor('white').font('Helvetica')
       .text('Reporte de Gestión', 50, 75, { align: 'center' });

    // Info del reporte
    doc.fillColor(colorTexto);
    doc.fontSize(11).font('Helvetica')
       .text(`Periodo: ${nombrePeriodo}`, 50, 140)
       .text(`Generado: ${ahora.toLocaleString('es')}`, 50, 155)
       .text(`Desde: ${fechaInicio.toLocaleDateString('es')} hasta ${ahora.toLocaleDateString('es')}`, 50, 170);

    // Línea separadora
    doc.moveTo(50, 195).lineTo(562, 195).stroke(colorPrimario);

    // ============ RESUMEN EJECUTIVO ============
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('RESUMEN EJECUTIVO', 50, 215);

    // Cards de métricas principales
    const cardY = 245;
    const cardWidth = 120;
    const cardHeight = 70;
    const cardSpacing = 10;

    // Card 1: Total Citas
    doc.rect(50, cardY, cardWidth, cardHeight).fill(colorFondo);
    doc.fontSize(24).font('Helvetica-Bold').fillColor(colorPrimario).text(totalCitas.toString(), 55, cardY + 15, { width: cardWidth - 10, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(colorGris).text('Total Citas', 55, cardY + 45, { width: cardWidth - 10, align: 'center' });

    // Card 2: Completadas
    doc.rect(50 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight).fill(colorFondo);
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#10B981').text(citasCompletadas.toString(), 55 + cardWidth + cardSpacing, cardY + 15, { width: cardWidth - 10, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(colorGris).text('Completadas', 55 + cardWidth + cardSpacing, cardY + 45, { width: cardWidth - 10, align: 'center' });

    // Card 3: Canceladas
    doc.rect(50 + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight).fill(colorFondo);
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#EF4444').text(citasCanceladas.toString(), 55 + (cardWidth + cardSpacing) * 2, cardY + 15, { width: cardWidth - 10, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(colorGris).text('Canceladas', 55 + (cardWidth + cardSpacing) * 2, cardY + 45, { width: cardWidth - 10, align: 'center' });

    // Card 4: Tasa Éxito
    doc.rect(50 + (cardWidth + cardSpacing) * 3, cardY, cardWidth, cardHeight).fill(colorFondo);
    doc.fontSize(24).font('Helvetica-Bold').fillColor(colorPrimario).text(`${tasaExito}%`, 55 + (cardWidth + cardSpacing) * 3, cardY + 15, { width: cardWidth - 10, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(colorGris).text('Tasa de Éxito', 55 + (cardWidth + cardSpacing) * 3, cardY + 45, { width: cardWidth - 10, align: 'center' });

    // ============ MÉTRICAS FINANCIERAS ============
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('MÉTRICAS FINANCIERAS', 50, 340);

    // Tabla de finanzas
    const finY = 370;
    doc.rect(50, finY, 512, 25).fill(colorPrimario);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white')
       .text('Concepto', 60, finY + 8)
       .text('Valor', 450, finY + 8, { width: 100, align: 'right' });

    const finanzas = [
      ['Ingresos Totales', `$${ingresosTotales.toFixed(2)}`],
      ['Ingresos Cobrados', `$${ingresosPagados.toFixed(2)}`],
      ['Ingresos Pendientes', `$${ingresosPendientes.toFixed(2)}`],
      ['Ticket Promedio', `$${ticketPromedio}`],
      ['Citas Pagadas', `${citasPagadas} de ${citasCompletadas}`]
    ];

    finanzas.forEach((row, i) => {
      const rowY = finY + 25 + (i * 22);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 22).fill('#F9FAFB');
      doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
         .text(row[0], 60, rowY + 6)
         .text(row[1], 450, rowY + 6, { width: 100, align: 'right' });
    });

    // ============ TOP SERVICIOS ============
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('TOP SERVICIOS', 50, 510);

    const servY = 540;
    doc.rect(50, servY, 512, 25).fill(colorPrimario);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white')
       .text('#', 60, servY + 8)
       .text('Servicio', 90, servY + 8)
       .text('Cantidad', 350, servY + 8, { width: 80, align: 'center' })
       .text('Ingresos', 450, servY + 8, { width: 100, align: 'right' });

    serviciosOrdenados.slice(0, 5).forEach((item, i) => {
      const rowY = servY + 25 + (i * 22);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 22).fill('#F9FAFB');
      doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
         .text((i + 1).toString(), 60, rowY + 6)
         .text(item[0], 90, rowY + 6)
         .text(item[1].cantidad.toString(), 350, rowY + 6, { width: 80, align: 'center' })
         .text(`$${item[1].ingresos.toFixed(2)}`, 450, rowY + 6, { width: 100, align: 'right' });
    });

    // Pie de página
    doc.fontSize(8).fillColor(colorGris)
       .text('Página 1 de 3', 50, 730, { align: 'center', width: 512 });

    // ============ PÁGINA 2: ESPECIALISTAS Y MÉTODOS DE PAGO ============
    doc.addPage();

    // Header
    doc.rect(0, 0, 612, 60).fill(colorPrimario);
    doc.fontSize(18).fillColor('white').font('Helvetica-Bold')
       .text('NAIL SPA - Reporte de Gestión', 50, 22, { align: 'center' });

    // RENDIMIENTO POR ESPECIALISTA
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('RENDIMIENTO POR ESPECIALISTA', 50, 85);

    const espY = 115;
    doc.rect(50, espY, 512, 25).fill(colorPrimario);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white')
       .text('#', 60, espY + 8)
       .text('Especialista', 90, espY + 8)
       .text('Citas', 350, espY + 8, { width: 80, align: 'center' })
       .text('Ingresos', 450, espY + 8, { width: 100, align: 'right' });

    especialistasOrdenados.slice(0, 8).forEach((item, i) => {
      const rowY = espY + 25 + (i * 22);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 22).fill('#F9FAFB');
      doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
         .text((i + 1).toString(), 60, rowY + 6)
         .text(item[0], 90, rowY + 6)
         .text(item[1].citas.toString(), 350, rowY + 6, { width: 80, align: 'center' })
         .text(`$${item[1].ingresos.toFixed(2)}`, 450, rowY + 6, { width: 100, align: 'right' });
    });

    // MÉTODOS DE PAGO
    const metY = 340;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('MÉTODOS DE PAGO', 50, metY);

    doc.rect(50, metY + 30, 512, 25).fill(colorPrimario);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white')
       .text('Método', 60, metY + 38)
       .text('Transacciones', 300, metY + 38, { width: 100, align: 'center' })
       .text('Monto Total', 450, metY + 38, { width: 100, align: 'right' });

    Object.entries(metodosPago).forEach((item, i) => {
      const rowY = metY + 55 + (i * 22);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 22).fill('#F9FAFB');
      const nombreMetodo = item[0] === 'efectivo_bs' ? 'Efectivo Bs' : 
                          item[0] === 'efectivo_usd' ? 'Efectivo USD' :
                          item[0] === 'pago_movil' ? 'Pago Móvil' :
                          item[0] === 'transferencia' ? 'Transferencia' : item[0];
      doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
         .text(nombreMetodo, 60, rowY + 6)
         .text(item[1].cantidad.toString(), 300, rowY + 6, { width: 100, align: 'center' })
         .text(`$${item[1].monto.toFixed(2)}`, 450, rowY + 6, { width: 100, align: 'right' });
    });

    // INGRESOS POR DÍA
    const diaY = 500;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('INGRESOS POR DÍA', 50, diaY);

    doc.rect(50, diaY + 30, 512, 25).fill(colorPrimario);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white')
       .text('Fecha', 60, diaY + 38)
       .text('Citas', 300, diaY + 38, { width: 100, align: 'center' })
       .text('Ingresos', 450, diaY + 38, { width: 100, align: 'right' });

    const diasOrdenados = Object.entries(ingresosPorDia).sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 7);
    diasOrdenados.forEach((item, i) => {
      const rowY = diaY + 55 + (i * 22);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 22).fill('#F9FAFB');
      doc.fontSize(10).font('Helvetica').fillColor(colorTexto)
         .text(item[0], 60, rowY + 6)
         .text(item[1].citas.toString(), 300, rowY + 6, { width: 100, align: 'center' })
         .text(`$${item[1].ingresos.toFixed(2)}`, 450, rowY + 6, { width: 100, align: 'right' });
    });

    // Pie de página
    doc.fontSize(8).fillColor(colorGris)
       .text('Página 2 de 3', 50, 730, { align: 'center', width: 512 });

    // ============ PÁGINA 3: DETALLE DE CITAS ============
    doc.addPage();

    // Header
    doc.rect(0, 0, 612, 60).fill(colorPrimario);
    doc.fontSize(18).fillColor('white').font('Helvetica-Bold')
       .text('NAIL SPA - Detalle de Citas', 50, 22, { align: 'center' });

    doc.fontSize(16).font('Helvetica-Bold').fillColor(colorPrimario)
       .text('DETALLE DE CITAS', 50, 85);

    // Tabla de citas
    const citaY = 115;
    doc.rect(50, citaY, 512, 25).fill(colorPrimario);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('white')
       .text('Fecha', 55, citaY + 9)
       .text('Hora', 105, citaY + 9)
       .text('Cliente', 145, citaY + 9)
       .text('Servicios', 260, citaY + 9)
       .text('Total', 400, citaY + 9)
       .text('Estado', 450, citaY + 9)
       .text('Pagado', 510, citaY + 9);

    citas.slice(0, 25).forEach((cita, i) => {
      const rowY = citaY + 25 + (i * 20);
      if (i % 2 === 0) doc.rect(50, rowY, 512, 20).fill('#F9FAFB');
      
      const fecha = new Date(cita.fechaCita).toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
      const servicios = cita.servicios?.map(s => s.nombreServicio).join(', ') || '';
      const estado = cita.estado === 'completada' ? 'Completada' : 
                    cita.estado === 'cancelada' ? 'Cancelada' :
                    cita.estado === 'pendiente' ? 'Pendiente' :
                    cita.estado === 'confirmada' ? 'Confirmada' : cita.estado;
      
      doc.fontSize(7).font('Helvetica').fillColor(colorTexto)
         .text(fecha, 55, rowY + 6)
         .text(cita.horaInicio || '', 105, rowY + 6)
         .text((cita.nombreCliente || '').substring(0, 18), 145, rowY + 6)
         .text(servicios.substring(0, 25), 260, rowY + 6)
         .text(`$${cita.total || 0}`, 400, rowY + 6)
         .text(estado, 450, rowY + 6)
         .text(cita.pagado ? 'Sí' : 'No', 520, rowY + 6);
    });

    // Resumen al final
    const resY = 650;
    doc.rect(50, resY, 512, 50).fill(colorFondo);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(colorTexto)
       .text('RESUMEN FINAL', 60, resY + 10);
    doc.fontSize(9).font('Helvetica').fillColor(colorGris)
       .text(`Total de citas en el periodo: ${totalCitas}`, 60, resY + 28)
       .text(`Ingresos totales: $${ingresosTotales.toFixed(2)}`, 250, resY + 28)
       .text(`Tasa de éxito: ${tasaExito}%`, 450, resY + 28);

    // Pie de página
    doc.fontSize(8).fillColor(colorGris)
       .text('Página 3 de 3', 50, 730, { align: 'center', width: 512 });

    // Footer final
    doc.fontSize(8).fillColor(colorGris)
       .text('Reporte generado automáticamente por el sistema Nail Spa', 50, 745, { align: 'center', width: 512 });

    doc.end();

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const ConfiguracionRecompensas = require('../models/ConfiguracionRecompensas');
const Cliente = require('../models/Cliente');

// Obtener configuración de recompensas
router.get('/configuracion', async (req, res) => {
  try {
    const config = await ConfiguracionRecompensas.obtenerConfiguracion();
    res.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Actualizar configuración de recompensas
router.put('/configuracion', async (req, res) => {
  try {
    const { 
      puntoPorDolar, 
      valorPunto, 
      multiplicadorCumpleanos, 
      diasValidezPuntos,
      niveles 
    } = req.body;

    let config = await ConfiguracionRecompensas.findOne();
    
    if (!config) {
      config = new ConfiguracionRecompensas(req.body);
    } else {
      if (puntoPorDolar !== undefined) config.puntoPorDolar = puntoPorDolar;
      if (valorPunto !== undefined) config.valorPunto = valorPunto;
      if (multiplicadorCumpleanos !== undefined) config.multiplicadorCumpleanos = multiplicadorCumpleanos;
      if (diasValidezPuntos !== undefined) config.diasValidezPuntos = diasValidezPuntos;
      if (niveles) config.niveles = niveles;
    }

    await config.save();
    res.json({ mensaje: 'Configuración actualizada', config });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener estadísticas del sistema de recompensas
router.get('/estadisticas', async (req, res) => {
  try {
    const config = await ConfiguracionRecompensas.obtenerConfiguracion();
    const clientes = await Cliente.find({ activo: true });

    // Función para determinar nivel
    const getNivel = (totalGastado) => {
      for (let i = config.niveles.length - 1; i >= 0; i--) {
        if (totalGastado >= config.niveles[i].min) {
          return config.niveles[i].nombre;
        }
      }
      return 'bronce';
    };

    const estadisticas = {
      totalClientes: clientes.length,
      clientesPorNivel: {
        bronce: clientes.filter(c => getNivel(c.totalGastado || 0) === 'bronce').length,
        plata: clientes.filter(c => getNivel(c.totalGastado || 0) === 'plata').length,
        oro: clientes.filter(c => getNivel(c.totalGastado || 0) === 'oro').length,
        platino: clientes.filter(c => getNivel(c.totalGastado || 0) === 'platino').length
      },
      totalPuntosCirculacion: clientes.reduce((sum, c) => sum + (c.puntos || 0), 0),
      totalGastadoClientes: clientes.reduce((sum, c) => sum + (c.totalGastado || 0), 0),
      valorPuntosEnDescuentos: clientes.reduce((sum, c) => sum + (c.puntos || 0), 0) * config.valorPunto
    };

    res.json(estadisticas);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Historial de movimientos de puntos de un cliente
router.get('/historial/:clienteId', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Por ahora retornamos el historial básico
    // En el futuro se puede implementar un modelo separado para historial de puntos
    res.json({
      cliente: {
        _id: cliente._id,
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        nivel: cliente.nivel,
        totalGastado: cliente.totalGastado
      },
      historial: [] // Aquí iría el historial detallado
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Agregar puntos manualmente a un cliente
router.post('/agregar-puntos', async (req, res) => {
  try {
    const { clienteId, puntos, motivo } = req.body;

    if (!clienteId || !puntos || !motivo) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    cliente.puntos = (cliente.puntos || 0) + puntos;
    await cliente.save();

    res.json({
      mensaje: `${puntos} puntos agregados correctamente`,
      cliente: {
        _id: cliente._id,
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        nivel: cliente.nivel
      }
    });
  } catch (error) {
    console.error('Error agregando puntos:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Canjear puntos de un cliente
router.post('/canjear-puntos', async (req, res) => {
  try {
    const { clienteId, puntos, motivo } = req.body;

    if (!clienteId || !puntos || !motivo) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if ((cliente.puntos || 0) < puntos) {
      return res.status(400).json({ mensaje: 'Puntos insuficientes' });
    }

    const config = await ConfiguracionRecompensas.obtenerConfiguracion();
    const descuento = puntos * config.valorPunto;

    cliente.puntos = (cliente.puntos || 0) - puntos;
    await cliente.save();

    res.json({
      mensaje: `${puntos} puntos canjeados correctamente`,
      descuento,
      cliente: {
        _id: cliente._id,
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        nivel: cliente.nivel
      }
    });
  } catch (error) {
    console.error('Error canjeando puntos:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Recalcular niveles de todos los clientes
router.post('/recalcular-niveles', async (req, res) => {
  try {
    const clientes = await Cliente.find({ activo: true });
    let actualizados = 0;

    for (const cliente of clientes) {
      const nivelAnterior = cliente.nivel;
      cliente.nivel = cliente.calcularNivel();
      
      if (nivelAnterior !== cliente.nivel) {
        await cliente.save();
        actualizados++;
      }
    }

    res.json({
      mensaje: `Niveles recalculados`,
      clientesActualizados: actualizados,
      totalClientes: clientes.length
    });
  } catch (error) {
    console.error('Error recalculando niveles:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

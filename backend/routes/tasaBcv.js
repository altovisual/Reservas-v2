const express = require('express');
const router = express.Router();

// Cache para la tasa BCV
let tasaCache = {
  tasa: null,
  fecha: null,
  ultimaActualizacion: null
};

// Función para obtener la tasa BCV desde la API
const obtenerTasaBCV = async () => {
  try {
    // Usar la API gratuita de DolarApi.com
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    
    if (!response.ok) {
      throw new Error('Error al obtener tasa BCV');
    }
    
    const data = await response.json();
    
    // Actualizar cache
    tasaCache = {
      tasa: data.promedio || data.precio,
      fecha: data.fechaActualizacion || new Date().toISOString(),
      ultimaActualizacion: new Date(),
      fuente: 'BCV Oficial',
      moneda: 'VES'
    };
    
    console.log(`✅ Tasa BCV actualizada: ${tasaCache.tasa} Bs/$`);
    return tasaCache;
    
  } catch (error) {
    console.error('Error obteniendo tasa BCV:', error.message);
    
    // Si hay cache, devolverla aunque esté desactualizada
    if (tasaCache.tasa) {
      return { ...tasaCache, error: 'Usando cache - API no disponible' };
    }
    
    // Tasa de respaldo (actualizar manualmente si es necesario)
    return {
      tasa: 50.00, // Tasa de respaldo
      fecha: new Date().toISOString(),
      ultimaActualizacion: new Date(),
      fuente: 'Respaldo manual',
      moneda: 'VES',
      error: 'API no disponible - usando tasa de respaldo'
    };
  }
};

// Actualizar tasa automáticamente cada 30 minutos
const iniciarActualizacionAutomatica = () => {
  // Actualizar inmediatamente al iniciar
  obtenerTasaBCV();
  
  // Luego cada 30 minutos
  setInterval(() => {
    obtenerTasaBCV();
  }, 30 * 60 * 1000); // 30 minutos
};

// Iniciar actualización automática
iniciarActualizacionAutomatica();

// GET - Obtener tasa actual
router.get('/', async (req, res) => {
  try {
    // Si el cache tiene más de 1 hora, actualizar
    const unaHora = 60 * 60 * 1000;
    const cacheExpirado = !tasaCache.ultimaActualizacion || 
      (new Date() - tasaCache.ultimaActualizacion) > unaHora;
    
    if (cacheExpirado || !tasaCache.tasa) {
      await obtenerTasaBCV();
    }
    
    res.json(tasaCache);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Forzar actualización
router.get('/actualizar', async (req, res) => {
  try {
    const tasa = await obtenerTasaBCV();
    res.json({ mensaje: 'Tasa actualizada', ...tasa });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Establecer tasa manual (por si la API falla)
router.post('/manual', async (req, res) => {
  try {
    const { tasa } = req.body;
    
    if (!tasa || isNaN(tasa)) {
      return res.status(400).json({ mensaje: 'Tasa inválida' });
    }
    
    tasaCache = {
      tasa: parseFloat(tasa),
      fecha: new Date().toISOString(),
      ultimaActualizacion: new Date(),
      fuente: 'Manual',
      moneda: 'VES'
    };
    
    console.log(`📝 Tasa BCV establecida manualmente: ${tasaCache.tasa} Bs/$`);
    res.json({ mensaje: 'Tasa actualizada manualmente', ...tasaCache });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Convertir monto de USD a VES
router.get('/convertir', async (req, res) => {
  try {
    const { monto } = req.query;
    
    if (!monto || isNaN(monto)) {
      return res.status(400).json({ mensaje: 'Monto inválido' });
    }
    
    // Asegurar que tenemos tasa actualizada
    if (!tasaCache.tasa) {
      await obtenerTasaBCV();
    }
    
    const montoUSD = parseFloat(monto);
    const montoVES = montoUSD * tasaCache.tasa;
    
    res.json({
      montoUSD,
      montoVES: Math.round(montoVES * 100) / 100,
      tasa: tasaCache.tasa,
      fecha: tasaCache.fecha
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

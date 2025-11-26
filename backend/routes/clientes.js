const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Cita = require('../models/Cita');

// Buscar cliente por cédula o teléfono (para login del cliente)
router.post('/buscar', async (req, res) => {
  try {
    const { cedula, telefono } = req.body;
    
    let cliente = null;
    
    if (cedula) {
      cliente = await Cliente.findOne({ cedula: cedula.trim() });
    } else if (telefono) {
      cliente = await Cliente.findOne({ telefono: telefono.trim() });
    }
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado', existe: false });
    }
    
    // Obtener historial de citas
    const citas = await Cita.find({ cliente: cliente._id })
      .populate('especialista', 'nombre apellido')
      .sort({ fechaCita: -1 })
      .limit(10);
    
    res.json({
      existe: true,
      cliente,
      historialCitas: citas
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Registrar nuevo cliente
router.post('/registrar', async (req, res) => {
  try {
    const { cedula, tipoCedula, nombre, apellido, telefono, email, fechaNacimiento, notas } = req.body;
    
    // Verificar si ya existe
    const existente = await Cliente.findOne({ 
      $or: [{ cedula }, { telefono }] 
    });
    
    if (existente) {
      if (existente.cedula === cedula) {
        return res.status(400).json({ mensaje: 'Ya existe un cliente con esta cédula' });
      }
      if (existente.telefono === telefono) {
        return res.status(400).json({ mensaje: 'Ya existe un cliente con este teléfono' });
      }
    }
    
    const cliente = new Cliente({
      cedula,
      tipoCedula: tipoCedula || 'V',
      nombre,
      apellido,
      telefono,
      email,
      fechaNacimiento,
      notas
    });
    
    await cliente.save();
    
    res.status(201).json({
      mensaje: 'Cliente registrado exitosamente',
      cliente
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener todos los clientes (admin)
router.get('/', async (req, res) => {
  try {
    const { busqueda, nivel, activo } = req.query;
    
    let filtro = {};
    
    if (busqueda) {
      filtro.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { apellido: { $regex: busqueda, $options: 'i' } },
        { cedula: { $regex: busqueda, $options: 'i' } },
        { telefono: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    if (nivel) filtro.nivel = nivel;
    if (activo !== undefined) filtro.activo = activo === 'true';
    
    const clientes = await Cliente.find(filtro)
      .sort({ createdAt: -1 });
    
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate('preferencias.especialistaFavorito', 'nombre apellido')
      .populate('preferencias.serviciosFavoritos', 'nombre precio');
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Obtener historial completo
    const citas = await Cita.find({ cliente: cliente._id })
      .populate('especialista', 'nombre apellido')
      .populate('servicios.servicio', 'nombre precio')
      .sort({ fechaCita: -1 });
    
    res.json({
      cliente,
      historialCitas: citas
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Agregar puntos al cliente
router.post('/:id/puntos', async (req, res) => {
  try {
    const { puntos, motivo } = req.body;
    
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    cliente.puntos += puntos;
    await cliente.save();
    
    res.json({
      mensaje: `${puntos} puntos agregados`,
      puntosActuales: cliente.puntos,
      nivel: cliente.nivel
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Canjear puntos
router.post('/:id/canjear-puntos', async (req, res) => {
  try {
    const { puntos } = req.body;
    
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    if (cliente.puntos < puntos) {
      return res.status(400).json({ mensaje: 'Puntos insuficientes' });
    }
    
    cliente.puntos -= puntos;
    await cliente.save();
    
    // Calcular descuento (1 punto = $0.01)
    const descuento = puntos * 0.01;
    
    res.json({
      mensaje: `${puntos} puntos canjeados`,
      descuento,
      puntosRestantes: cliente.puntos
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Obtener favoritos del cliente
router.get('/:id/favoritos', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate('preferencias.serviciosFavoritos', 'nombre precio duracion imagen categoria');
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente.preferencias?.serviciosFavoritos || []);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Agregar/quitar servicio de favoritos
router.post('/:id/favoritos', async (req, res) => {
  try {
    const { servicioId } = req.body;
    
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    if (!cliente.preferencias) {
      cliente.preferencias = { serviciosFavoritos: [] };
    }
    
    const index = cliente.preferencias.serviciosFavoritos.indexOf(servicioId);
    
    if (index > -1) {
      // Quitar de favoritos
      cliente.preferencias.serviciosFavoritos.splice(index, 1);
      await cliente.save();
      res.json({ mensaje: 'Eliminado de favoritos', esFavorito: false });
    } else {
      // Agregar a favoritos
      cliente.preferencias.serviciosFavoritos.push(servicioId);
      await cliente.save();
      res.json({ mensaje: 'Agregado a favoritos', esFavorito: true });
    }
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

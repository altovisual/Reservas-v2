const express = require('express');
const router = express.Router();
const Galeria = require('../models/Galeria');

// Obtener todas las imágenes
router.get('/', async (req, res) => {
  try {
    const { categoria, limit, destacado } = req.query;
    let query = { activo: true };
    
    if (categoria && categoria !== 'todas') {
      query.categoria = categoria;
    }
    if (destacado === 'true') {
      query.destacado = true;
    }
    
    let consulta = Galeria.find(query)
      .populate('especialista', 'nombre')
      .sort({ createdAt: -1 });
    
    if (limit) {
      consulta = consulta.limit(parseInt(limit));
    }
    
    const imagenes = await consulta;
    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener galería', error: error.message });
  }
});

// Obtener categorías disponibles
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Galeria.distinct('categoria', { activo: true });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
  }
});

// Obtener una imagen por ID
router.get('/:id', async (req, res) => {
  try {
    const imagen = await Galeria.findById(req.params.id)
      .populate('especialista', 'nombre');
    if (!imagen) {
      return res.status(404).json({ mensaje: 'Imagen no encontrada' });
    }
    res.json(imagen);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener imagen', error: error.message });
  }
});

// Dar/quitar like a una imagen
router.post('/:id/like', async (req, res) => {
  try {
    const { clienteId } = req.body;
    const imagen = await Galeria.findById(req.params.id);
    
    if (!imagen) {
      return res.status(404).json({ mensaje: 'Imagen no encontrada' });
    }
    
    const yaLeDioLike = imagen.likedBy.includes(clienteId);
    
    if (yaLeDioLike) {
      // Quitar like
      imagen.likedBy = imagen.likedBy.filter(id => id !== clienteId);
      imagen.likes = Math.max(0, imagen.likes - 1);
    } else {
      // Dar like
      imagen.likedBy.push(clienteId);
      imagen.likes += 1;
    }
    
    await imagen.save();
    
    res.json({ 
      success: true, 
      liked: !yaLeDioLike, 
      likes: imagen.likes 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar like', error: error.message });
  }
});

// Crear nueva imagen (admin)
router.post('/', async (req, res) => {
  try {
    const imagen = new Galeria(req.body);
    await imagen.save();
    res.status(201).json(imagen);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear imagen', error: error.message });
  }
});

// Actualizar imagen (admin)
router.put('/:id', async (req, res) => {
  try {
    const imagen = await Galeria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!imagen) {
      return res.status(404).json({ mensaje: 'Imagen no encontrada' });
    }
    res.json(imagen);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar imagen', error: error.message });
  }
});

// Eliminar imagen (admin)
router.delete('/:id', async (req, res) => {
  try {
    const imagen = await Galeria.findByIdAndDelete(req.params.id);
    if (!imagen) {
      return res.status(404).json({ mensaje: 'Imagen no encontrada' });
    }
    res.json({ mensaje: 'Imagen eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar imagen', error: error.message });
  }
});

module.exports = router;

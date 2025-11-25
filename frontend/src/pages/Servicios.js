import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, Search, ChevronRight, Heart, Sparkles, Calendar } from 'lucide-react';
import api from '../services/api';

const categoriaIconos = {
  'Manicure': '💅', 'Pedicure': '🦶', 'Uñas Acrílicas': '✨', 'Uñas en Gel': '💎',
  'Nail Art': '🎨', 'Depilación': '🌸', 'Cejas y Pestañas': '👁️', 'Paquetes': '🎁'
};

const Servicios = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [servRes, catRes] = await Promise.all([
        api.get('/servicios'),
        api.get('/servicios/categorias')
      ]);
      setServicios(servRes.data);
      setCategorias(['Todos', ...catRes.data]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviciosFiltrados = servicios.filter(s => {
    const coincideCategoria = categoriaActiva === 'Todos' || s.categoria === categoriaActiva;
    const coincideBusqueda = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> Nail Spa
            </h1>
            <p className="text-pink-100 mt-1">Reserva tu cita online</p>
          </div>
          <button
            onClick={() => navigate('/mis-citas')}
            className="bg-white/20 p-3 rounded-full"
          >
            <Calendar className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="px-4 mt-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                categoriaActiva === cat
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 shadow'
              }`}
            >
              <span>{categoriaIconos[cat] || '✨'}</span>
              <span className="text-sm font-medium">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <div className="px-4 py-4 space-y-4 pb-24">
        {serviciosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron servicios</div>
        ) : (
          serviciosFiltrados.map(servicio => (
            <div
              key={servicio._id}
              onClick={() => navigate(`/reservar/${servicio._id}`)}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-3xl">
                  {categoriaIconos[servicio.categoria] || '✨'}
                </div>
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-gray-800">{servicio.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{servicio.descripcion}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" /> {servicio.duracion} min
                    </span>
                    <span className="text-pink-600 font-bold">${servicio.precio}</span>
                  </div>
                </div>
                <div className="flex items-center pr-4">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón Admin */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate('/admin/login')}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg"
        >
          👤
        </button>
      </div>
    </div>
  );
};

export default Servicios;

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight, Scissors, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const GestionServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure' });

  const categorias = ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 'Depilación', 'Cejas y Pestañas', 'Paquetes'];

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarServicio = async () => {
    try {
      if (modal === 'nuevo') {
        await api.post('/servicios', form);
      } else {
        await api.put(`/servicios/${modal}`, form);
      }
      setModal(null);
      cargarServicios();
    } catch (error) {
      alert('Error al guardar');
    }
  };

  const eliminarServicio = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await api.delete(`/servicios/${id}`);
      cargarServicios();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const toggleDisponibilidad = async (id) => {
    try {
      await api.patch(`/servicios/${id}/disponibilidad`);
      cargarServicios();
    } catch (error) {
      alert('Error');
    }
  };

  const abrirEditar = (servicio) => {
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      duracion: servicio.duracion,
      categoria: servicio.categoria
    });
    setModal(servicio._id);
  };

  if (loading) {
    return (
      <AdminLayout title="Gestión de Servicios" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Servicios" subtitle="Administra el catálogo de servicios">
      {/* Header con botón */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {servicios.length} servicios registrados
        </div>
        <button
          onClick={() => { setForm({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure' }); setModal('nuevo'); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </button>
      </div>

      {/* Grid de servicios */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servicios.map(servicio => (
          <div key={servicio._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${servicio.disponible ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                    <Scissors className={`w-5 h-5 ${servicio.disponible ? 'text-emerald-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{servicio.nombre}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{servicio.categoria}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleDisponibilidad(servicio._id)}
                  className="flex-shrink-0"
                >
                  {servicio.disponible ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {servicio.descripcion && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{servicio.descripcion}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" /> {servicio.duracion} min
                  </span>
                  <span className="flex items-center gap-1 text-lg font-bold text-emerald-600">
                    <DollarSign className="w-4 h-4" />{servicio.precio}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => abrirEditar(servicio)} 
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => eliminarServicio(servicio._id)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'nuevo' ? 'Nuevo Servicio' : 'Editar Servicio'}
              </h2>
              <button 
                onClick={() => setModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre del servicio"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea
                  placeholder="Descripción del servicio"
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.precio}
                    onChange={(e) => setForm({...form, precio: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración (min)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={form.duracion}
                    onChange={(e) => setForm({...form, duracion: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({...form, categoria: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarServicio}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default GestionServicios;

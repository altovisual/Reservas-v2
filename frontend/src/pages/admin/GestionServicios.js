import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

const GestionServicios = () => {
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-2">Gestión de Servicios</h1>
      </div>

      <div className="p-4">
        <button
          onClick={() => { setForm({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure' }); setModal('nuevo'); }}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </button>

        <div className="space-y-3">
          {servicios.map(servicio => (
            <div key={servicio._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{servicio.nombre}</h3>
                  <p className="text-sm text-gray-500">{servicio.categoria}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" /> {servicio.duracion} min
                    </span>
                    <span className="flex items-center gap-1 text-pink-600 font-bold">
                      <DollarSign className="w-4 h-4" /> {servicio.precio}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleDisponibilidad(servicio._id)}>
                    {servicio.disponible ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <button onClick={() => abrirEditar(servicio)} className="p-2 text-blue-500">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => eliminarServicio(servicio._id)} className="p-2 text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">
              {modal === 'nuevo' ? 'Nuevo Servicio' : 'Editar Servicio'}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value})}
                className="w-full p-3 border rounded-xl"
              />
              <textarea
                placeholder="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({...form, descripcion: e.target.value})}
                className="w-full p-3 border rounded-xl"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Precio $"
                  value={form.precio}
                  onChange={(e) => setForm({...form, precio: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                />
                <input
                  type="number"
                  placeholder="Duración (min)"
                  value={form.duracion}
                  onChange={(e) => setForm({...form, duracion: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <select
                value={form.categoria}
                onChange={(e) => setForm({...form, categoria: e.target.value})}
                className="w-full p-3 border rounded-xl"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 border rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={guardarServicio}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionServicios;

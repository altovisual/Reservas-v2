import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Star, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

const especialidades = ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 'Depilación', 'Cejas y Pestañas'];
const colores = ['#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444'];

const GestionEspecialistas = () => {
  const navigate = useNavigate();
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', especialidades: [], color: '#EC4899' });

  useEffect(() => {
    cargarEspecialistas();
  }, []);

  const cargarEspecialistas = async () => {
    try {
      const response = await api.get('/especialistas');
      setEspecialistas(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarEspecialista = async () => {
    try {
      if (modal === 'nuevo') {
        await api.post('/especialistas', form);
      } else {
        await api.put(`/especialistas/${modal}`, form);
      }
      setModal(null);
      cargarEspecialistas();
    } catch (error) {
      alert('Error al guardar');
    }
  };

  const eliminarEspecialista = async (id) => {
    if (!window.confirm('¿Eliminar este especialista?')) return;
    try {
      await api.delete(`/especialistas/${id}`);
      cargarEspecialistas();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al eliminar');
    }
  };

  const toggleActivo = async (id) => {
    try {
      await api.patch(`/especialistas/${id}/activo`);
      cargarEspecialistas();
    } catch (error) {
      alert('Error');
    }
  };

  const abrirEditar = (esp) => {
    setForm({
      nombre: esp.nombre,
      apellido: esp.apellido,
      telefono: esp.telefono || '',
      email: esp.email || '',
      especialidades: esp.especialidades || [],
      color: esp.color || '#EC4899'
    });
    setModal(esp._id);
  };

  const toggleEspecialidad = (esp) => {
    const nuevas = form.especialidades.includes(esp)
      ? form.especialidades.filter(e => e !== esp)
      : [...form.especialidades, esp];
    setForm({...form, especialidades: nuevas});
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
        <h1 className="text-xl font-bold mt-2">Gestión de Especialistas</h1>
      </div>

      <div className="p-4">
        <button
          onClick={() => { setForm({ nombre: '', apellido: '', telefono: '', email: '', especialidades: [], color: '#EC4899' }); setModal('nuevo'); }}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-5 h-5" /> Nuevo Especialista
        </button>

        <div className="space-y-3">
          {especialistas.map(esp => (
            <div key={esp._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: esp.color || '#EC4899' }}
                >
                  {esp.nombre[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{esp.nombre} {esp.apellido}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{esp.calificacionPromedio || 5}</span>
                    {esp.telefono && (
                      <>
                        <span>•</span>
                        <Phone className="w-4 h-4" />
                        <span>{esp.telefono}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {esp.especialidades?.slice(0, 3).map(e => (
                      <span key={e} className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActivo(esp._id)}>
                    {esp.activo ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <button onClick={() => abrirEditar(esp)} className="p-2 text-blue-500">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => eliminarEspecialista(esp._id)} className="p-2 text-red-500">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-bold mb-4">
              {modal === 'nuevo' ? 'Nuevo Especialista' : 'Editar Especialista'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={(e) => setForm({...form, apellido: e.target.value})}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <input
                type="tel"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm({...form, telefono: e.target.value})}
                className="w-full p-3 border rounded-xl"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full p-3 border rounded-xl"
              />
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {colores.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {especialidades.map(esp => (
                    <button
                      key={esp}
                      onClick={() => toggleEspecialidad(esp)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        form.especialidades.includes(esp)
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-3 border rounded-xl">
                Cancelar
              </button>
              <button
                onClick={guardarEspecialista}
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

export default GestionEspecialistas;

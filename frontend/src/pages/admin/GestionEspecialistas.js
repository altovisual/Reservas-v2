import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Phone, ToggleLeft, ToggleRight, Mail, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const especialidadesLista = ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 'Depilación', 'Cejas y Pestañas'];
const colores = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

const GestionEspecialistas = () => {
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', especialidades: [], color: '#10B981' });

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
      color: esp.color || '#10B981'
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
      <AdminLayout title="Gestión de Especialistas" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Especialistas" subtitle="Administra el equipo de trabajo">
      {/* Header con botón */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {especialistas.length} especialistas registrados
        </div>
        <button
          onClick={() => { setForm({ nombre: '', apellido: '', telefono: '', email: '', especialidades: [], color: '#10B981' }); setModal('nuevo'); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nuevo Especialista
        </button>
      </div>

      {/* Grid de especialistas */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {especialistas.map(esp => (
          <div key={esp._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: esp.color || '#10B981' }}
                >
                  {esp.nombre[0]}{esp.apellido?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{esp.nombre} {esp.apellido}</h3>
                    <button 
                      onClick={() => toggleActivo(esp._id)}
                      className="flex-shrink-0 ml-2"
                    >
                      {esp.activo ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-300" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{esp.calificacionPromedio || '5.0'}</span>
                    <span className="text-gray-300 mx-1">•</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${esp.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {esp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="mt-4 space-y-2">
                {esp.telefono && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {esp.telefono}
                  </p>
                )}
                {esp.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-gray-400" /> {esp.email}
                  </p>
                )}
              </div>

              {/* Especialidades */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {esp.especialidades?.slice(0, 4).map(e => (
                  <span key={e} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{e}</span>
                ))}
                {esp.especialidades?.length > 4 && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs">+{esp.especialidades.length - 4}</span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => abrirEditar(esp)} 
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminarEspecialista(esp._id)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'nuevo' ? 'Nuevo Especialista' : 'Editar Especialista'}
              </h2>
              <button 
                onClick={() => setModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={(e) => setForm({...form, apellido: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color identificador</label>
                <div className="flex gap-2">
                  {colores.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      className={`w-9 h-9 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {especialidadesLista.map(esp => (
                    <button
                      key={esp}
                      onClick={() => toggleEspecialidad(esp)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        form.especialidades.includes(esp)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
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
                onClick={guardarEspecialista}
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

export default GestionEspecialistas;

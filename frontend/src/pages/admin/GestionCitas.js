import React, { useState, useEffect } from 'react';
import { User, Phone, Check, X, Play, RefreshCw, DollarSign, Calendar, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const estadoConfig = {
  pendiente: { color: 'bg-amber-50 text-amber-600 border border-amber-200', label: 'Pendiente' },
  confirmada: { color: 'bg-blue-50 text-blue-600 border border-blue-200', label: 'Confirmada' },
  en_progreso: { color: 'bg-purple-50 text-purple-600 border border-purple-200', label: 'En Progreso' },
  completada: { color: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Completada' },
  cancelada: { color: 'bg-red-50 text-red-600 border border-red-200', label: 'Cancelada' }
};

const GestionCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarCitas();
    // eslint-disable-next-line
  }, [filtroFecha]);

  const cargarCitas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/citas', { params: { fecha: filtroFecha } });
      setCitas(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await api.patch(`/citas/${citaId}/estado`, { estado: nuevoEstado });
      cargarCitas();
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  const confirmarPago = async (citaId) => {
    try {
      await api.post(`/citas/${citaId}/pago`, { metodoPago: 'efectivo' });
      cargarCitas();
    } catch (error) {
      alert('Error');
    }
  };

  return (
    <AdminLayout title="Gestión de Citas" subtitle="Administra las citas del día">
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={cargarCitas} 
              className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No hay citas para esta fecha</p>
          <p className="text-gray-400 text-sm mt-1">Selecciona otra fecha para ver las citas</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {citas.map(cita => {
            const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
            
            return (
              <div key={cita._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-emerald-600">{cita.horaInicio}</span>
                      </div>
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${cita.total}</p>
                      {cita.pagado ? (
                        <span className="text-xs text-emerald-600 font-medium">✓ Pagado</span>
                      ) : (
                        <span className="text-xs text-gray-400">Pendiente pago</span>
                      )}
                    </div>
                  </div>

                  {/* Cliente info */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> {cita.nombreCliente}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> {cita.telefono}
                    </p>
                    <p className="text-sm text-gray-600">
                      {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                    </p>
                    <p className="text-sm text-gray-400">
                      Especialista: <span className="text-gray-600">{cita.nombreEspecialista}</span>
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {cita.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => cambiarEstado(cita._id, 'confirmada')}
                          className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Confirmar
                        </button>
                        <button
                          onClick={() => cambiarEstado(cita._id, 'cancelada')}
                          className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {cita.estado === 'confirmada' && (
                      <button
                        onClick={() => cambiarEstado(cita._id, 'en_progreso')}
                        className="flex-1 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-purple-100 transition-colors"
                      >
                        <Play className="w-4 h-4" /> Iniciar servicio
                      </button>
                    )}
                    {cita.estado === 'en_progreso' && (
                      <button
                        onClick={() => cambiarEstado(cita._id, 'completada')}
                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Completar
                      </button>
                    )}
                    {cita.estado === 'completada' && !cita.pagado && (
                      <button
                        onClick={() => confirmarPago(cita._id)}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors"
                      >
                        <DollarSign className="w-4 h-4" /> Registrar Pago
                      </button>
                    )}
                    {cita.estado === 'completada' && cita.pagado && (
                      <div className="flex-1 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm font-medium text-center">
                        Cita finalizada
                      </div>
                    )}
                    {cita.estado === 'cancelada' && (
                      <div className="flex-1 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm font-medium text-center">
                        Cita cancelada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default GestionCitas;

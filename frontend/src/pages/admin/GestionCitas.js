import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Check, X, Play, RefreshCw, DollarSign } from 'lucide-react';
import api from '../../services/api';

const estadoConfig = {
  pendiente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  confirmada: { color: 'bg-blue-100 text-blue-800', label: 'Confirmada' },
  en_progreso: { color: 'bg-pink-100 text-pink-800', label: 'En Progreso' },
  completada: { color: 'bg-green-100 text-green-800', label: 'Completada' },
  cancelada: { color: 'bg-red-100 text-red-800', label: 'Cancelada' }
};

const GestionCitas = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-2">Gestión de Citas</h1>
      </div>

      <div className="p-4">
        {/* Filtro fecha */}
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="flex-1 p-3 bg-white rounded-xl shadow"
          />
          <button onClick={cargarCitas} className="p-3 bg-white rounded-xl shadow">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
          </div>
        ) : citas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay citas para esta fecha</div>
        ) : (
          <div className="space-y-3">
            {citas.map(cita => {
              const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
              
              return (
                <div key={cita._id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-pink-600">{cita.horaInicio}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <h3 className="font-semibold mt-1 flex items-center gap-2">
                          <User className="w-4 h-4" /> {cita.nombreCliente}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {cita.telefono}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Especialista: {cita.nombreEspecialista}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-pink-600">${cita.total}</p>
                        {cita.pagado ? (
                          <span className="text-xs text-green-600">✓ Pagado</span>
                        ) : (
                          <span className="text-xs text-gray-400">Pendiente</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {cita.estado === 'pendiente' && (
                        <>
                          <button
                            onClick={() => cambiarEstado(cita._id, 'confirmada')}
                            className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Confirmar
                          </button>
                          <button
                            onClick={() => cambiarEstado(cita._id, 'cancelada')}
                            className="py-2 px-4 bg-red-100 text-red-700 rounded-lg text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {cita.estado === 'confirmada' && (
                        <button
                          onClick={() => cambiarEstado(cita._id, 'en_progreso')}
                          className="flex-1 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <Play className="w-4 h-4" /> Iniciar
                        </button>
                      )}
                      {cita.estado === 'en_progreso' && (
                        <button
                          onClick={() => cambiarEstado(cita._id, 'completada')}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Completar
                        </button>
                      )}
                      {cita.estado === 'completada' && !cita.pagado && (
                        <button
                          onClick={() => confirmarPago(cita._id)}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          <DollarSign className="w-4 h-4" /> Registrar Pago
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCitas;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Star, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const estadoConfig = {
  pendiente: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, texto: 'Pendiente' },
  confirmada: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, texto: 'Confirmada' },
  en_progreso: { color: 'bg-pink-100 text-pink-700', icon: Clock, texto: 'En progreso' },
  completada: { color: 'bg-green-100 text-green-700', icon: CheckCircle, texto: 'Completada' },
  cancelada: { color: 'bg-red-100 text-red-700', icon: XCircle, texto: 'Cancelada' }
};

const MisCitas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(location.state?.mensaje || null);

  const clienteId = localStorage.getItem('clienteId');

  useEffect(() => {
    if (clienteId) {
      cargarCitas();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [clienteId]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const cargarCitas = async () => {
    try {
      const response = await api.get(`/citas/cliente/${clienteId}`);
      setCitas(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarCita = async (citaId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta cita?')) return;
    try {
      await api.post(`/citas/${citaId}/cancelar`);
      cargarCitas();
    } catch (error) {
      alert('Error al cancelar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
        <button onClick={() => navigate('/servicios')} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-2">Mis Citas</h1>
      </div>

      {/* Mensaje éxito */}
      {mensaje && (
        <div className="mx-4 mt-4 p-4 bg-green-100 text-green-700 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {mensaje}
        </div>
      )}

      <div className="p-4 space-y-4">
        {!clienteId ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tienes citas aún</p>
            <button
              onClick={() => navigate('/servicios')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full"
            >
              Reservar ahora
            </button>
          </div>
        ) : citas.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tienes citas registradas</p>
          </div>
        ) : (
          citas.map(cita => {
            const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
            const IconoEstado = config.icon;
            const fecha = new Date(cita.fechaCita);
            
            return (
              <div key={cita._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                        <User className="w-4 h-4" />
                        <span>{cita.nombreEspecialista}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${config.color}`}>
                      <IconoEstado className="w-3 h-3" /> {config.texto}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {fecha.toLocaleDateString('es')}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {cita.horaInicio}
                    </span>
                    <span className="font-bold text-pink-600">${cita.total}</span>
                  </div>

                  {['pendiente', 'confirmada'].includes(cita.estado) && (
                    <button
                      onClick={() => cancelarCita(cita._id)}
                      className="mt-3 w-full py-2 border border-red-300 text-red-500 rounded-lg text-sm"
                    >
                      Cancelar cita
                    </button>
                  )}

                  {cita.estado === 'completada' && !cita.calificacion && (
                    <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">¿Cómo fue tu experiencia?</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} className="text-2xl">
                            <Star className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MisCitas;

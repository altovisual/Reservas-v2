import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Star, CheckCircle, XCircle, AlertCircle, ArrowLeft, MessageSquare, AlertTriangle, X, MapPin, Phone, DollarSign, Scissors, RefreshCw } from 'lucide-react';
import api from '../services/api';

const estadoConfig = {
  pendiente: { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: AlertCircle, texto: 'Pendiente', descripcion: 'Esperando confirmación' },
  confirmada: { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: CheckCircle, texto: 'Confirmada', descripcion: 'Tu cita está confirmada' },
  en_progreso: { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Clock, texto: 'En progreso', descripcion: 'Servicio en curso' },
  completada: { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle, texto: 'Completada', descripcion: 'Servicio finalizado' },
  cancelada: { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, texto: 'Cancelada', descripcion: 'Cita cancelada' }
};

const MisCitas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(location.state?.mensaje || null);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [modalCalificar, setModalCalificar] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);

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

  // Resetear scroll del modal cuando se abre
  useEffect(() => {
    if (modalDetalle && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [modalDetalle]);

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

  const cancelarCita = async () => {
    if (!modalCancelar) return;
    setCancelando(true);
    try {
      await api.post(`/citas/${modalCancelar._id}/cancelar`);
      setModalCancelar(null);
      setMensaje('Cita cancelada exitosamente');
      cargarCitas();
    } catch (error) {
      alert('Error al cancelar');
    } finally {
      setCancelando(false);
    }
  };

  const enviarCalificacion = async () => {
    if (!modalCalificar || calificacion === 0) return;
    setEnviandoResena(true);
    try {
      await api.post(`/citas/${modalCalificar._id}/calificar`, {
        calificacion,
        comentario
      });
      setModalCalificar(null);
      setCalificacion(0);
      setComentario('');
      setMensaje('¡Gracias por tu reseña!');
      cargarCitas();
    } catch (error) {
      alert('Error al enviar reseña');
    } finally {
      setEnviandoResena(false);
    }
  };

  const abrirModalCalificar = (cita, estrellas = 0) => {
    setModalCalificar(cita);
    setCalificacion(estrellas);
    setComentario('');
  };

  // Filtrar citas
  const citasFiltradas = citas.filter(cita => {
    if (filtro === 'todas') return true;
    if (filtro === 'proximas') return ['pendiente', 'confirmada'].includes(cita.estado);
    return cita.estado === filtro;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 pb-6">
        <button onClick={() => navigate('/servicios')} className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-3">Mis Citas</h1>
        <p className="text-emerald-100 text-sm mt-1">Historial y próximas citas</p>
      </div>

      {/* Filtros */}
      {citas.length > 0 && (
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {[
              { key: 'todas', label: 'Todas' },
              { key: 'proximas', label: 'Próximas' },
              { key: 'completada', label: 'Completadas' },
              { key: 'cancelada', label: 'Canceladas' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filtro === f.key
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'bg-white/20 text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje éxito */}
      {mensaje && (
        <div className="mx-4 mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-medium">{mensaje}</span>
        </div>
      )}

      <div className="p-4 pb-24 space-y-4">
        {!clienteId ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg">No tienes citas aún</p>
            <p className="text-gray-400 text-sm mt-1">Reserva tu primera cita ahora</p>
            <button
              onClick={() => navigate('/servicios')}
              className="mt-6 px-8 py-3 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
            >
              Reservar ahora
            </button>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg">No tienes citas registradas</p>
            <button
              onClick={() => navigate('/servicios')}
              className="mt-6 px-8 py-3 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
            >
              Reservar cita
            </button>
          </div>
        ) : (
          citasFiltradas.map(cita => {
            const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
            const IconoEstado = config.icon;
            const fecha = new Date(cita.fechaCita);
            
            return (
              <div 
                key={cita._id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setModalDetalle(cita)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-500 text-sm">
                        <User className="w-4 h-4" />
                        <span>{cita.nombreEspecialista}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border ${config.color}`}>
                      <IconoEstado className="w-3.5 h-3.5" /> {config.texto}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fecha</p>
                        <p className="text-sm font-medium">{fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Hora</p>
                        <p className="text-sm font-medium">{cita.horaInicio}</p>
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-bold text-emerald-600">${cita.total}</p>
                    </div>
                  </div>

                  {['pendiente', 'confirmada'].includes(cita.estado) && (
                    <button
                      onClick={() => setModalCancelar(cita)}
                      className="mt-4 w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Cancelar cita
                    </button>
                  )}

                  {cita.estado === 'completada' && !cita.calificacion && (
                    <div 
                      className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-800">¿Cómo fue tu experiencia?</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {[1,2,3,4,5].map(n => (
                          <button 
                            key={n} 
                            className="p-2 hover:scale-110 transition-transform"
                            onClick={() => abrirModalCalificar(cita, n)}
                          >
                            <Star className="w-8 h-8 text-gray-300 hover:text-amber-400 hover:fill-amber-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cita.estado === 'completada' && cita.calificacion && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(n => (
                            <Star 
                              key={n} 
                              className={`w-5 h-5 ${n <= cita.calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-amber-700 font-medium">Tu calificación</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmación para cancelar */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Cancelar cita?</h3>
              <p className="text-gray-500 mt-2">
                Estás a punto de cancelar tu cita de
              </p>
              <p className="font-semibold text-gray-900 mt-1">
                {modalCancelar.servicios?.[0]?.servicio?.nombre || modalCancelar.nombreServicio || 'Servicio'}
              </p>
            </div>

            {/* Info de la cita */}
            <div className="mx-6 p-4 bg-gray-50 rounded-2xl mb-6">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(modalCancelar.fechaCita).toLocaleDateString('es', { 
                      weekday: 'long', day: 'numeric', month: 'long' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{modalCancelar.horaInicio}</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalCancelar(null)}
                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={cancelarCita}
                disabled={cancelando}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelando ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" /> Sí, cancelar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de cita - Full Screen */}
      {modalDetalle && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setModalDetalle(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header con estado - Coloreado */}
            {(() => {
              const config = estadoConfig[modalDetalle.estado] || estadoConfig.pendiente;
              const IconoEstado = config.icon;
              const bgColor = modalDetalle.estado === 'completada' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                              modalDetalle.estado === 'confirmada' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                              modalDetalle.estado === 'cancelada' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                              modalDetalle.estado === 'en_progreso' ? 'bg-gradient-to-r from-purple-500 to-violet-500' :
                              'bg-gradient-to-r from-amber-500 to-orange-500';
              return (
                <div className={`${bgColor} text-white p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                        <IconoEstado className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-xl">{config.texto}</p>
                        <p className="text-sm text-white/80">{config.descripcion}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setModalDetalle(null)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  {/* Servicio principal */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-white/70 text-sm">Servicio</p>
                    <p className="font-semibold text-lg">
                      {modalDetalle.servicios?.map(s => s.nombreServicio).join(', ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Contenido scrolleable */}
            <div ref={modalRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Fecha y hora - Primero para mejor visibilidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Fecha</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(modalDetalle.fechaCita).toLocaleDateString('es', { 
                      weekday: 'short', day: 'numeric', month: 'short' 
                    })}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Hora</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{modalDetalle.horaInicio}</p>
                </div>
              </div>

              {/* Servicios */}
              {modalDetalle.servicios && modalDetalle.servicios.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Scissors className="w-3 h-3" /> Servicios
                  </h4>
                  <div className="space-y-2">
                    {modalDetalle.servicios.map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-900 text-sm">{s.nombreServicio}</span>
                        <span className="text-emerald-600 font-semibold text-sm">${s.precio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Especialista */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Especialista</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {modalDetalle.nombreEspecialista || modalDetalle.especialistaId?.nombre || 'Por asignar'}
                </p>
              </div>

              {/* Ubicación */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs">Ubicación</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Nail Spa</p>
                <p className="text-xs text-gray-500">San Felipe, Yaracuy</p>
              </div>

              {/* Total */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Total a pagar</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">${modalDetalle.total}</span>
                </div>
              </div>

              {/* Notas */}
              {modalDetalle.notas && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-1">Notas:</p>
                  <p className="text-sm text-amber-700">{modalDetalle.notas}</p>
                </div>
              )}
            </div>

            {/* Acciones - Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 space-y-2 bg-gray-50">
              {['pendiente', 'confirmada'].includes(modalDetalle.estado) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setModalDetalle(null);
                      navigate('/reservar', { 
                        state: { 
                          reagendar: true, 
                          citaId: modalDetalle._id,
                          servicios: modalDetalle.servicios,
                          especialistaId: modalDetalle.especialista
                        }
                      });
                    }}
                    className="flex-1 py-3.5 bg-blue-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" /> Reagendar
                  </button>
                  <button
                    onClick={() => {
                      setModalDetalle(null);
                      setModalCancelar(modalDetalle);
                    }}
                    className="flex-1 py-3.5 bg-white border border-red-200 text-red-500 rounded-2xl font-semibold hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {modalDetalle.estado === 'completada' && !modalDetalle.calificacion && (
                <button
                  onClick={() => {
                    setModalDetalle(null);
                    abrirModalCalificar(modalDetalle, 0);
                  }}
                  className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
                >
                  <Star className="w-5 h-5" /> Calificar experiencia
                </button>
              )}
              {modalDetalle.estado === 'confirmada' && (
                <a
                  href={`tel:+580000000000`}
                  className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                >
                  <Phone className="w-5 h-5" /> Llamar al spa
                </a>
              )}
              <button
                onClick={() => setModalDetalle(null)}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calificación */}
      {modalCalificar && (
        <div 
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          onClick={() => setModalCalificar(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">¿Cómo fue tu experiencia?</h3>
              <p className="text-emerald-100 text-sm mt-1">
                {modalCalificar.servicios?.map(s => s.nombreServicio).join(', ')}
              </p>
            </div>

            {/* Estrellas */}
            <div className="p-6">
              <div className="flex justify-center gap-2 mb-6">
                {[1,2,3,4,5].map(n => (
                  <button 
                    key={n}
                    onClick={() => setCalificacion(n)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`w-10 h-10 transition-colors ${
                        n <= calificacion 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-300 hover:text-amber-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              {calificacion > 0 && (
                <p className="text-center text-gray-600 mb-4">
                  {calificacion === 5 ? '¡Excelente! 🎉' : 
                   calificacion === 4 ? '¡Muy bien! 😊' :
                   calificacion === 3 ? 'Bien 👍' :
                   calificacion === 2 ? 'Regular 😐' : 'Necesita mejorar 😕'}
                </p>
              )}

              {/* Comentario */}
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia (opcional)"
                className="w-full p-4 border border-gray-200 rounded-2xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700"
              />
            </div>

            {/* Botones */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalCalificar(null)}
                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviarCalificacion}
                disabled={calificacion === 0 || enviandoResena}
                className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviandoResena ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Star className="w-5 h-5" /> Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisCitas;

import React, { useState, useEffect, useCallback } from 'react';
import { User, Phone, Check, X, Play, RefreshCw, DollarSign, Calendar, Search, ChevronLeft, ChevronRight, List, CalendarDays, Clock, Scissors, FileText, CreditCard, AlertTriangle, Timer, Activity, ArrowRightLeft, Users } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { useTasaBcv } from '../../context/TasaBcvContext';

// Componente para mostrar el contador de retraso
const ContadorRetraso = ({ fechaCita, horaInicio, estado }) => {
  const [retraso, setRetraso] = useState(null);

  useEffect(() => {
    // Solo mostrar para citas pendientes o confirmadas
    if (!['pendiente', 'confirmada'].includes(estado)) {
      setRetraso(null);
      return;
    }

    const calcularRetraso = () => {
      const ahora = new Date();
      const [horas, minutos] = horaInicio.split(':').map(Number);
      const fechaCitaObj = new Date(fechaCita);
      fechaCitaObj.setHours(horas, minutos, 0, 0);

      const diferencia = ahora - fechaCitaObj;
      
      // Si la diferencia es positiva, hay retraso
      if (diferencia > 0) {
        const minutosRetraso = Math.floor(diferencia / 60000);
        const horasRetraso = Math.floor(minutosRetraso / 60);
        const mins = minutosRetraso % 60;
        const segs = Math.floor((diferencia % 60000) / 1000);
        
        setRetraso({
          total: minutosRetraso,
          horas: horasRetraso,
          minutos: mins,
          segundos: segs,
          texto: horasRetraso > 0 
            ? `${horasRetraso}h ${mins}m ${segs}s`
            : `${mins}m ${segs}s`
        });
      } else {
        // Tiempo restante para la cita
        const minutosRestantes = Math.abs(Math.floor(diferencia / 60000));
        if (minutosRestantes <= 30) {
          setRetraso({
            total: -minutosRestantes,
            texto: `En ${minutosRestantes} min`,
            proximo: true
          });
        } else {
          setRetraso(null);
        }
      }
    };

    calcularRetraso();
    const interval = setInterval(calcularRetraso, 1000);

    return () => clearInterval(interval);
  }, [fechaCita, horaInicio, estado]);

  if (!retraso) return null;

  if (retraso.proximo) {
    return (
      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-medium">
        <Clock className="w-3 h-3" />
        {retraso.texto}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
      retraso.total > 15 
        ? 'text-red-600 bg-red-50 animate-pulse' 
        : 'text-amber-600 bg-amber-50'
    }`}>
      <AlertTriangle className="w-3 h-3" />
      <span>Retraso: {retraso.texto}</span>
    </div>
  );
};

const estadoConfig = {
  pendiente: { color: 'bg-amber-50 text-amber-600 border border-amber-200', label: 'Pendiente', dotColor: 'bg-amber-500' },
  confirmada: { color: 'bg-blue-50 text-blue-600 border border-blue-200', label: 'Confirmada', dotColor: 'bg-blue-500' },
  en_progreso: { color: 'bg-purple-50 text-purple-600 border border-purple-200', label: 'En Progreso', dotColor: 'bg-purple-500' },
  completada: { color: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Completada', dotColor: 'bg-emerald-500' },
  cancelada: { color: 'bg-red-50 text-red-600 border border-red-200', label: 'Cancelada', dotColor: 'bg-red-500' }
};

const GestionCitas = () => {
  const { tasa, formatearBs } = useTasaBcv();
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  const [citasFiltradas, setCitasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('timeline'); // Por defecto timeline
  const [mesActual, setMesActual] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [horaActual, setHoraActual] = useState(new Date());
  
  // Estados para reasignar especialista
  const [modalReasignar, setModalReasignar] = useState(false);
  const [citaAReasignar, setCitaAReasignar] = useState(null);
  const [especialistas, setEspecialistas] = useState([]);
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState(null);
  const [reasignando, setReasignando] = useState(false);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Cargar especialistas
  useEffect(() => {
    const cargarEspecialistas = async () => {
      try {
        const response = await api.get('/especialistas');
        setEspecialistas(response.data.filter(e => e.activo));
      } catch (error) {
        console.error('Error cargando especialistas:', error);
      }
    };
    cargarEspecialistas();
  }, []);

  const cargarTodasLasCitas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/citas/todas');
      setTodasLasCitas(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTodasLasCitas();
  }, [cargarTodasLasCitas]);

  useEffect(() => {
    let filtradas = [...todasLasCitas];
    
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(c => 
        c.nombreCliente?.toLowerCase().includes(busquedaLower) ||
        c.telefono?.includes(busqueda) ||
        c.nombreEspecialista?.toLowerCase().includes(busquedaLower)
      );
    }
    
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(c => c.estado === filtroEstado);
    }
    
    if (fechaSeleccionada) {
      filtradas = filtradas.filter(c => {
        const fechaCita = new Date(c.fechaCita).toDateString();
        return fechaCita === fechaSeleccionada.toDateString();
      });
    }
    
    filtradas.sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
    setCitasFiltradas(filtradas);
  }, [todasLasCitas, busqueda, filtroEstado, fechaSeleccionada]);

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await api.patch(`/citas/${citaId}/estado`, { estado: nuevoEstado });
      cargarTodasLasCitas();
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  const confirmarPago = async (citaId) => {
    try {
      await api.post(`/citas/${citaId}/pago`, { metodoPago: 'efectivo' });
      cargarTodasLasCitas();
    } catch (error) {
      alert('Error');
    }
  };

  // Abrir modal de reasignación
  const abrirModalReasignar = (cita) => {
    setCitaAReasignar(cita);
    setEspecialistaSeleccionado(null);
    setModalReasignar(true);
  };

  // Reasignar cita a otro especialista
  const reasignarCita = async () => {
    if (!especialistaSeleccionado || !citaAReasignar) return;
    
    setReasignando(true);
    try {
      await api.patch(`/citas/${citaAReasignar._id}/reasignar`, {
        especialistaId: especialistaSeleccionado._id
      });
      
      setModalReasignar(false);
      setCitaAReasignar(null);
      setEspecialistaSeleccionado(null);
      cargarTodasLasCitas();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al reasignar cita');
    } finally {
      setReasignando(false);
    }
  };

  const cambiarMes = (direccion) => {
    setMesActual(prev => {
      const nuevo = new Date(prev);
      nuevo.setMonth(nuevo.getMonth() + direccion);
      return nuevo;
    });
  };

  const generarCalendario = () => {
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const dias = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), i);
      // Filtrar citas del día excluyendo completadas y canceladas
      const citasDelDia = todasLasCitas.filter(c => {
        const fechaCita = new Date(c.fechaCita);
        const esDelDia = fechaCita.toDateString() === fecha.toDateString();
        // Solo mostrar citas activas (pendientes, confirmadas, en_progreso)
        const esActiva = !['completada', 'cancelada', 'no_asistio'].includes(c.estado);
        return esDelDia && esActiva;
      });
      dias.push({ dia: i, fecha, citas: citasDelDia });
    }
    
    return dias;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <AdminLayout title="Gestión de Citas" subtitle="Administra todas las citas">
      {/* Filtros y controles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente, teléfono..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          {/* Filtro estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
          
          {/* Toggle vista */}
          <div className="flex gap-2">
            <button
              onClick={() => setVista('timeline')}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                vista === 'timeline' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-5 h-5" /> Timeline
            </button>
            <button
              onClick={() => { setVista('lista'); setFechaSeleccionada(null); }}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                vista === 'lista' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" /> Lista
            </button>
            <button
              onClick={() => setVista('calendario')}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                vista === 'calendario' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CalendarDays className="w-5 h-5" /> Calendario
            </button>
            <button
              onClick={cargarTodasLasCitas}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats rápidos */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-500">Total:</span>
            <span className="ml-1 font-semibold">{todasLasCitas.length}</span>
          </div>
          <div className="text-sm">
            <span className="text-amber-500">Pendientes:</span>
            <span className="ml-1 font-semibold">{todasLasCitas.filter(c => c.estado === 'pendiente').length}</span>
          </div>
          <div className="text-sm">
            <span className="text-blue-500">Confirmadas:</span>
            <span className="ml-1 font-semibold">{todasLasCitas.filter(c => c.estado === 'confirmada').length}</span>
          </div>
          <div className="text-sm">
            <span className="text-emerald-500">Completadas:</span>
            <span className="ml-1 font-semibold">{todasLasCitas.filter(c => c.estado === 'completada').length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : vista === 'timeline' ? (
        /* Vista Timeline - Citas de hoy con hora actual */
        <div className="space-y-4">
          {/* Header con hora actual */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Hora actual</p>
                <p className="text-4xl font-bold font-mono">
                  {horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-emerald-100 mt-1">
                  {horaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <Activity className="w-5 h-5" />
                  <span className="font-semibold">
                    {todasLasCitas.filter(c => {
                      const hoy = new Date().toDateString();
                      return new Date(c.fechaCita).toDateString() === hoy && c.estado === 'en_progreso';
                    }).length} en progreso
                  </span>
                </div>
                <p className="text-emerald-100 text-sm mt-2">
                  {todasLasCitas.filter(c => {
                    const hoy = new Date().toDateString();
                    return new Date(c.fechaCita).toDateString() === hoy && ['pendiente', 'confirmada'].includes(c.estado);
                  }).length} citas pendientes hoy
                </p>
              </div>
            </div>
          </div>

          {/* Timeline de citas del día */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Timer className="w-5 h-5 text-emerald-500" />
                Timeline de Hoy
              </h3>
              <span className="text-sm text-gray-500">
                Ordenado por hora
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {(() => {
                const hoy = new Date().toDateString();
                const citasHoy = todasLasCitas
                  .filter(c => new Date(c.fechaCita).toDateString() === hoy)
                  .sort((a, b) => {
                    const [hA, mA] = a.horaInicio.split(':').map(Number);
                    const [hB, mB] = b.horaInicio.split(':').map(Number);
                    return (hA * 60 + mA) - (hB * 60 + mB);
                  });

                if (citasHoy.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay citas programadas para hoy</p>
                    </div>
                  );
                }

                return citasHoy.map(cita => {
                  const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
                  const [horaI, minI] = cita.horaInicio.split(':').map(Number);
                  const duracion = cita.duracionTotal || 60;
                  const horaFinMin = horaI * 60 + minI + duracion;
                  const horaFin = `${Math.floor(horaFinMin / 60).toString().padStart(2, '0')}:${(horaFinMin % 60).toString().padStart(2, '0')}`;
                  
                  // Calcular estado temporal
                  const ahora = horaActual.getHours() * 60 + horaActual.getMinutes();
                  const inicioMin = horaI * 60 + minI;
                  const finMin = horaFinMin;
                  
                  let estadoTemporal = 'pendiente';
                  let tiempoInfo = '';
                  let tiempoColor = 'text-gray-500';
                  
                  if (cita.estado === 'completada' || cita.estado === 'cancelada') {
                    estadoTemporal = cita.estado;
                    tiempoInfo = cita.estado === 'completada' ? 'Finalizada' : 'Cancelada';
                  } else if (ahora < inicioMin) {
                    const faltan = inicioMin - ahora;
                    tiempoInfo = `Inicia en ${faltan} min`;
                    tiempoColor = faltan <= 15 ? 'text-amber-600' : 'text-blue-600';
                    estadoTemporal = 'proximo';
                  } else if (ahora >= inicioMin && ahora < finMin) {
                    const transcurrido = ahora - inicioMin;
                    const restante = finMin - ahora;
                    tiempoInfo = `${transcurrido} min transcurridos • ${restante} min restantes`;
                    tiempoColor = 'text-purple-600';
                    estadoTemporal = 'en_curso';
                  } else {
                    const retraso = ahora - finMin;
                    tiempoInfo = `Debió terminar hace ${retraso} min`;
                    tiempoColor = 'text-red-600';
                    estadoTemporal = 'retrasada';
                  }

                  return (
                    <div 
                      key={cita._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        estadoTemporal === 'en_curso' ? 'bg-purple-50 border-l-4 border-purple-500' :
                        estadoTemporal === 'retrasada' ? 'bg-red-50 border-l-4 border-red-500' :
                        estadoTemporal === 'proximo' && tiempoColor === 'text-amber-600' ? 'bg-amber-50 border-l-4 border-amber-500' :
                        ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Hora */}
                        <div className="text-center min-w-[80px]">
                          <p className="text-2xl font-bold text-gray-900">{cita.horaInicio}</p>
                          <p className="text-xs text-gray-500">hasta {horaFin}</p>
                          <div className="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                            {duracion} min
                          </div>
                        </div>

                        {/* Línea de tiempo visual */}
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${config.dotColor}`}></div>
                          <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                        </div>

                        {/* Info de la cita */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{cita.nombreCliente}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Scissors className="w-3 h-3" />
                                {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {cita.nombreEspecialista}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>

                          {/* Tiempo info */}
                          <div className={`mt-2 flex items-center gap-2 ${tiempoColor} text-sm font-medium`}>
                            <Clock className="w-4 h-4" />
                            {tiempoInfo}
                          </div>

                          {/* Barra de progreso para citas en curso */}
                          {estadoTemporal === 'en_curso' && (
                            <div className="mt-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 transition-all duration-1000"
                                  style={{ width: `${Math.min(100, ((ahora - inicioMin) / duracion) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Acciones rápidas */}
                          {!['completada', 'cancelada'].includes(cita.estado) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {cita.estado === 'pendiente' && (
                                <button
                                  onClick={() => cambiarEstado(cita._id, 'confirmada')}
                                  className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Confirmar
                                </button>
                              )}
                              {cita.estado === 'confirmada' && (
                                <button
                                  onClick={() => cambiarEstado(cita._id, 'en_progreso')}
                                  className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200 flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" /> Iniciar
                                </button>
                              )}
                              {cita.estado === 'en_progreso' && (
                                <>
                                  <button
                                    onClick={() => cambiarEstado(cita._id, 'completada')}
                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-200 flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Completar
                                  </button>
                                  {!cita.pagado && (
                                    <button
                                      onClick={() => confirmarPago(cita._id)}
                                      className="px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-200 flex items-center gap-1"
                                    >
                                      <DollarSign className="w-3 h-3" /> Cobrar ${cita.total}
                                    </button>
                                  )}
                                </>
                              )}
                              {/* Botón reasignar */}
                              <button
                                onClick={() => abrirModalReasignar(cita)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3 h-3" /> Reasignar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">${cita.total}</p>
                          {tasa && <p className="text-xs text-gray-400">{formatearBs(cita.total)}</p>}
                          {cita.pagado && (
                            <span className="text-xs text-emerald-500 flex items-center gap-1 justify-end">
                              <Check className="w-3 h-3" /> Pagado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      ) : vista === 'calendario' ? (
        /* Vista Calendario */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold capitalize">
              {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
              <div key={dia} className="text-center text-sm font-medium text-gray-500 py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
            {generarCalendario().map((item, index) => (
              <div key={index} className="min-h-[100px]">
                {item ? (
                  <button
                    onClick={() => {
                      setFechaSeleccionada(item.fecha);
                      setVista('lista');
                    }}
                    className={`w-full h-full p-2 rounded-xl text-left transition-all hover:bg-emerald-50 ${
                      item.fecha.toDateString() === new Date().toDateString() 
                        ? 'bg-emerald-100 border-2 border-emerald-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{item.dia}</div>
                    {item.citas.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {item.citas.slice(0, 3).map((cita, i) => (
                          <div 
                            key={i} 
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${estadoConfig[cita.estado]?.color || 'bg-gray-100'}`}
                          >
                            {cita.horaInicio} - {cita.nombreCliente?.split(' ')[0]}
                          </div>
                        ))}
                        {item.citas.length > 3 && (
                          <div className="text-xs text-gray-500">+{item.citas.length - 3} más</div>
                        )}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vista Lista */
        <>
          {fechaSeleccionada && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-gray-600">Mostrando citas del:</span>
              <span className="font-semibold text-emerald-600">
                {fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button 
                onClick={() => setFechaSeleccionada(null)}
                className="ml-2 text-sm text-red-500 hover:text-red-600"
              >
                Ver todas
              </button>
            </div>
          )}
          
          {citasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay citas</p>
              <p className="text-gray-400 text-sm mt-1">
                {fechaSeleccionada ? 'No hay citas para esta fecha' : 'No se encontraron citas con los filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {citasFiltradas.map(cita => {
                const config = estadoConfig[cita.estado] || estadoConfig.pendiente;
                
                return (
                  <div 
                    key={cita._id} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setCitaSeleccionada(cita)}
                  >
                    <div className="p-5">
                      {/* Header con fecha */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-emerald-50 rounded-xl p-2 min-w-[60px]">
                            <div className="text-xs text-emerald-600 font-medium">
                              {formatearFecha(cita.fechaCita)}
                            </div>
                            <div className="text-lg font-bold text-emerald-700">{cita.horaInicio}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <ContadorRetraso 
                              fechaCita={cita.fechaCita} 
                              horaInicio={cita.horaInicio} 
                              estado={cita.estado} 
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">${cita.total}</p>
                          {tasa && <p className="text-xs text-gray-400">{formatearBs(cita.total)}</p>}
                          {cita.pagado ? (
                            <span className="text-xs text-emerald-600 font-medium">✓ Pagado</span>
                          ) : (
                            <span className="text-xs text-gray-400">Pendiente</span>
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
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cita.nombreEspecialista}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        {cita.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(cita._id, 'confirmada')}
                              className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-100"
                            >
                              <Check className="w-4 h-4" /> Confirmar
                            </button>
                            <button
                              onClick={() => cambiarEstado(cita._id, 'cancelada')}
                              className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {cita.estado === 'confirmada' && (
                          <button
                            onClick={() => cambiarEstado(cita._id, 'en_progreso')}
                            className="flex-1 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-purple-100"
                          >
                            <Play className="w-4 h-4" /> Iniciar
                          </button>
                        )}
                        {cita.estado === 'en_progreso' && (
                          <button
                            onClick={() => cambiarEstado(cita._id, 'completada')}
                            className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-100"
                          >
                            <Check className="w-4 h-4" /> Completar
                          </button>
                        )}
                        {cita.estado === 'completada' && !cita.pagado && (
                          <button
                            onClick={() => confirmarPago(cita._id)}
                            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-600"
                          >
                            <DollarSign className="w-4 h-4" /> Pago
                          </button>
                        )}
                        {(cita.estado === 'completada' && cita.pagado) && (
                          <div className="flex-1 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm text-center">
                            Finalizada
                          </div>
                        )}
                        {cita.estado === 'cancelada' && (
                          <div className="flex-1 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm text-center">
                            Cancelada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal detalle de cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCitaSeleccionada(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detalle de la Cita</h3>
                <p className="text-sm text-gray-500">ID: {citaSeleccionada._id?.slice(-8)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${estadoConfig[citaSeleccionada.estado]?.color}`}>
                  {estadoConfig[citaSeleccionada.estado]?.label}
                </span>
                <button onClick={() => setCitaSeleccionada(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Fecha y Hora */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-emerald-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha y Hora
                  </h4>
                  <ContadorRetraso 
                    fechaCita={citaSeleccionada.fechaCita} 
                    horaInicio={citaSeleccionada.horaInicio} 
                    estado={citaSeleccionada.estado} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-emerald-600">Fecha</p>
                    <p className="font-semibold text-emerald-900">
                      {new Date(citaSeleccionada.fechaCita).toLocaleDateString('es', { 
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600">Horario</p>
                    <p className="font-semibold text-emerald-900">
                      {citaSeleccionada.horaInicio} - {citaSeleccionada.horaFin || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Nombre</p>
                    <p className="font-semibold text-blue-900">{citaSeleccionada.nombreCliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Teléfono</p>
                    <p className="font-semibold text-blue-900 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {citaSeleccionada.telefono}
                    </p>
                  </div>
                  {citaSeleccionada.email && (
                    <div className="col-span-2">
                      <p className="text-sm text-blue-600">Email</p>
                      <p className="font-semibold text-blue-900">{citaSeleccionada.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Servicios */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Servicios
                </h4>
                {citaSeleccionada.servicios?.length > 0 ? (
                  <div className="space-y-2">
                    {citaSeleccionada.servicios.map((servicio, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-purple-100 last:border-0">
                        <div>
                          <p className="font-medium text-purple-900">{servicio.nombreServicio || servicio.nombre}</p>
                          {servicio.duracion && (
                            <p className="text-xs text-purple-600">{servicio.duracion} min</p>
                          )}
                        </div>
                        <span className="font-semibold text-purple-900">${servicio.precio || 0}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 mt-2 border-t-2 border-purple-200">
                      <span className="font-bold text-purple-900">Total:</span>
                      <span className="text-xl font-bold text-purple-900">
                        ${citaSeleccionada.servicios.reduce((sum, s) => sum + (s.precio || 0), 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-600 text-sm">Sin servicios registrados</p>
                )}
              </div>

              {/* Especialista */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Especialista
                </h4>
                <p className="font-semibold text-gray-900">{citaSeleccionada.nombreEspecialista || 'No asignado'}</p>
              </div>

              {/* Estado de Pago */}
              <div className={`rounded-xl p-4 ${citaSeleccionada.pagado ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                <h4 className={`font-medium mb-3 flex items-center gap-2 ${citaSeleccionada.pagado ? 'text-emerald-800' : 'text-amber-800'}`}>
                  <CreditCard className="w-4 h-4" />
                  Estado de Pago
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${citaSeleccionada.pagado ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {citaSeleccionada.pagado ? '✓ Pagado' : 'Pendiente de pago'}
                    </p>
                    {citaSeleccionada.metodoPago && (
                      <p className="text-sm text-gray-600">Método: {citaSeleccionada.metodoPago}</p>
                    )}
                  </div>
                  <span className={`text-2xl font-bold ${citaSeleccionada.pagado ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ${citaSeleccionada.total || citaSeleccionada.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0}
                  </span>
                </div>
              </div>

              {/* Notas */}
              {citaSeleccionada.notas && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notas
                  </h4>
                  <p className="text-gray-600">{citaSeleccionada.notas}</p>
                </div>
              )}

              {/* Fechas de registro */}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                <p>Creada: {new Date(citaSeleccionada.createdAt).toLocaleString('es')}</p>
                {citaSeleccionada.updatedAt && citaSeleccionada.updatedAt !== citaSeleccionada.createdAt && (
                  <p>Actualizada: {new Date(citaSeleccionada.updatedAt).toLocaleString('es')}</p>
                )}
              </div>
            </div>

            {/* Acciones del modal */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              {citaSeleccionada.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => { cambiarEstado(citaSeleccionada._id, 'confirmada'); setCitaSeleccionada(null); }}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600"
                  >
                    <Check className="w-5 h-5" /> Confirmar
                  </button>
                  <button
                    onClick={() => { cambiarEstado(citaSeleccionada._id, 'cancelada'); setCitaSeleccionada(null); }}
                    className="py-3 px-6 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
              {citaSeleccionada.estado === 'confirmada' && (
                <button
                  onClick={() => { cambiarEstado(citaSeleccionada._id, 'en_progreso'); setCitaSeleccionada(null); }}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-600"
                >
                  <Play className="w-5 h-5" /> Iniciar Servicio
                </button>
              )}
              {citaSeleccionada.estado === 'en_progreso' && (
                <button
                  onClick={() => { cambiarEstado(citaSeleccionada._id, 'completada'); setCitaSeleccionada(null); }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  <Check className="w-5 h-5" /> Completar
                </button>
              )}
              {citaSeleccionada.estado === 'completada' && !citaSeleccionada.pagado && (
                <button
                  onClick={() => { confirmarPago(citaSeleccionada._id); setCitaSeleccionada(null); }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  <DollarSign className="w-5 h-5" /> Confirmar Pago
                </button>
              )}
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reasignar Especialista */}
      {modalReasignar && citaAReasignar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                  Reasignar Cita
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {citaAReasignar.nombreCliente} • {citaAReasignar.horaInicio}
                </p>
              </div>
              <button 
                onClick={() => { setModalReasignar(false); setCitaAReasignar(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info actual */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Especialista actual</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: citaAReasignar.especialistaId?.color || '#10B981' }}
                >
                  {citaAReasignar.nombreEspecialista?.[0] || 'E'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{citaAReasignar.nombreEspecialista}</p>
                  <p className="text-sm text-gray-500">
                    {citaAReasignar.servicios?.map(s => s.nombreServicio).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de especialistas */}
            <div className="p-4 overflow-y-auto max-h-[300px]">
              <p className="text-xs text-gray-500 uppercase font-medium mb-3">Seleccionar nuevo especialista</p>
              <div className="space-y-2">
                {especialistas
                  .filter(esp => esp._id !== citaAReasignar.especialistaId?._id && esp._id !== citaAReasignar.especialistaId)
                  .map(esp => (
                    <button
                      key={esp._id}
                      onClick={() => setEspecialistaSeleccionado(esp)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        especialistaSeleccionado?._id === esp._id
                          ? 'bg-emerald-50 border-2 border-emerald-500'
                          : 'bg-white border border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: esp.color || '#10B981' }}
                      >
                        {esp.foto ? (
                          <img src={esp.foto} alt={esp.nombre} className="w-full h-full object-cover rounded-full" />
                        ) : esp.nombre[0]}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{esp.nombre} {esp.apellido}</p>
                        <p className="text-xs text-gray-500">{esp.especialidades?.join(', ') || 'Especialista'}</p>
                      </div>
                      {especialistaSeleccionado?._id === esp._id && (
                        <Check className="w-5 h-5 text-emerald-500" />
                      )}
                    </button>
                  ))}
              </div>
              
              {especialistas.filter(esp => esp._id !== citaAReasignar.especialistaId?._id && esp._id !== citaAReasignar.especialistaId).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No hay otros especialistas disponibles</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setModalReasignar(false); setCitaAReasignar(null); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={reasignarCita}
                disabled={!especialistaSeleccionado || reasignando}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  especialistaSeleccionado && !reasignando
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {reasignando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Reasignando...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-5 h-5" /> Reasignar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default GestionCitas;

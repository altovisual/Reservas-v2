import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, DollarSign, ChevronRight, TrendingUp, Link2, Copy, Check, Share2, ExternalLink, RefreshCw, X, User, Phone, Scissors, CreditCard } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { notifications, isConnected } = useNotifications();
  const [stats, setStats] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  // URL de reservas para clientes
  const reservasUrl = `${window.location.origin}/reservar`;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(reservasUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = reservasUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const compartirWhatsApp = () => {
    const mensaje = encodeURIComponent(`¡Reserva tu cita en Nail Spa! 💅\n\n${reservasUrl}`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const compartirGeneral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nail Spa - Reserva tu cita',
          text: '¡Reserva tu cita en Nail Spa! 💅',
          url: reservasUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copiarLink();
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando llegue una nueva notificación
  useEffect(() => {
    if (notifications.length > 0) {
      const ultimaNotificacion = notifications[0];
      // Si la notificación es reciente (últimos 5 segundos), recargar
      const tiempoNotificacion = new Date(ultimaNotificacion.timestamp).getTime();
      const ahora = Date.now();
      if (ahora - tiempoNotificacion < 5000) {
        console.log('🔄 Recargando dashboard por nueva notificación');
        cargarDatos();
      }
    }
  }, [notifications]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/citas/hoy');
      setCitasHoy(response.data.citas || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoStyle = (estado) => {
    switch(estado) {
      case 'confirmada': return 'bg-blue-50 text-blue-600';
      case 'en_progreso': return 'bg-amber-50 text-amber-600';
      case 'completada': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Resumen general del día">
      <div className="space-y-6">
        {/* Indicador de conexión en tiempo real */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Conectado en tiempo real' : 'Desconectado - reconectando...'}
            </span>
          </div>
          <button 
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Compartir Link de Reservas */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-sm text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Comparte tu link de reservas</h3>
                <p className="text-emerald-100 text-sm">Envía este enlace a tus clientes para que agenden sus citas</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Input con link */}
              <div className="flex items-center bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
                <span className="text-sm truncate max-w-[200px] lg:max-w-[300px]">{reservasUrl}</span>
              </div>
              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={copiarLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    copied 
                      ? 'bg-white text-emerald-600' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  onClick={compartirWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all"
                  title="Compartir por WhatsApp"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
                <button
                  onClick={compartirGeneral}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all"
                  title="Compartir"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <a
                  href={reservasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all"
                  title="Abrir página"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm">Resumen del día</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Panel de Control</h2>
            </div>
            <button 
              onClick={() => navigate('/admin/reportes')}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Ver reportes
            </button>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">${stats?.ingresos || 0}</span>
            <span className="text-gray-500 text-lg">.00</span>
            <span className="text-emerald-500 text-sm font-medium ml-2">Ingresos hoy</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-gray-400">Hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-gray-500 text-sm mt-1">Citas totales</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs text-gray-400">Pendiente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.pendientes || 0}</p>
            <p className="text-gray-500 text-sm mt-1">Por atender</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-gray-400">Completado</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.completadas || 0}</p>
            <p className="text-gray-500 text-sm mt-1">Finalizadas</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-gray-400">Promedio</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats?.total > 0 ? Math.round((stats?.ingresos || 0) / stats.total) : 0}
            </p>
            <p className="text-gray-500 text-sm mt-1">Por cita</p>
          </div>
        </div>

        {/* Citas de hoy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-900">Últimas citas</h2>
              <p className="text-sm text-gray-500">Citas programadas para hoy</p>
            </div>
            <button 
              onClick={() => navigate('/admin/citas')}
              className="flex items-center gap-1 text-emerald-500 text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {citasHoy.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No hay citas para hoy</p>
                <button 
                  onClick={() => navigate('/admin/citas')}
                  className="mt-4 text-emerald-500 text-sm font-medium hover:text-emerald-600"
                >
                  Gestionar citas
                </button>
              </div>
            ) : (
              citasHoy.slice(0, 5).map((cita, index) => (
                <div 
                  key={cita._id} 
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setCitaSeleccionada(cita)}
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-semibold text-gray-900">{cita.horaInicio}</p>
                    <p className="text-xs text-gray-400">hrs</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cita.nombreCliente}</p>
                    <p className="text-sm text-gray-500">
                      {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getEstadoStyle(cita.estado)}`}>
                    {cita.estado === 'confirmada' ? 'Confirmada' :
                     cita.estado === 'en_progreso' ? 'En progreso' :
                     cita.estado === 'completada' ? 'Completada' : cita.estado}
                  </span>
                  <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal detalle de cita */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCitaSeleccionada(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detalle de la Cita</h3>
                <p className="text-sm text-gray-500">{citaSeleccionada.horaInicio} - {citaSeleccionada.horaFin || 'N/A'}</p>
              </div>
              <button onClick={() => setCitaSeleccionada(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cliente */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </h4>
                <p className="font-semibold text-blue-900">{citaSeleccionada.nombreCliente}</p>
                {citaSeleccionada.telefono && (
                  <p className="text-sm text-blue-700 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {citaSeleccionada.telefono}
                  </p>
                )}
              </div>

              {/* Servicios */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Servicios
                </h4>
                {citaSeleccionada.servicios?.length > 0 ? (
                  <div className="space-y-2">
                    {citaSeleccionada.servicios.map((servicio, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-purple-100 last:border-0">
                        <span className="text-purple-900">{servicio.nombreServicio}</span>
                        <span className="font-medium text-purple-900">${servicio.precio || 0}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-purple-200">
                      <span className="font-semibold text-purple-900">Total:</span>
                      <span className="font-bold text-purple-900">
                        ${citaSeleccionada.servicios.reduce((sum, s) => sum + (s.precio || 0), 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-600 text-sm">Sin servicios</p>
                )}
              </div>

              {/* Especialista */}
              {citaSeleccionada.nombreEspecialista && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-700 mb-1">Especialista</h4>
                  <p className="font-semibold text-gray-900">{citaSeleccionada.nombreEspecialista}</p>
                </div>
              )}

              {/* Estado de Pago */}
              <div className={`rounded-xl p-4 ${citaSeleccionada.pagado ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${citaSeleccionada.pagado ? 'text-emerald-800' : 'text-amber-800'}`}>
                  <CreditCard className="w-4 h-4" />
                  Estado de Pago
                </h4>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${citaSeleccionada.pagado ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {citaSeleccionada.pagado ? '✓ Pagado' : 'Pendiente'}
                  </span>
                  <span className={`text-xl font-bold ${citaSeleccionada.pagado ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ${citaSeleccionada.total || citaSeleccionada.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setCitaSeleccionada(null); navigate('/admin/citas'); }}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
              >
                Ver en Gestión de Citas
              </button>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="py-3 px-6 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;

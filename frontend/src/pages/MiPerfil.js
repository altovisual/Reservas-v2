import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Gift, Star, Calendar, CreditCard, ChevronRight, LogOut, Clock, Heart, Bell, Moon, Sun, MessageCircle, DollarSign, Settings, Sparkles, Award, TrendingUp } from 'lucide-react';
import api from '../services/api';

const nivelConfig = {
  bronce: { color: 'from-amber-600 to-amber-700', icon: '🥉', siguiente: 500 },
  plata: { color: 'from-gray-400 to-gray-500', icon: '🥈', siguiente: 2000 },
  oro: { color: 'from-yellow-400 to-yellow-500', icon: '🥇', siguiente: 5000 },
  platino: { color: 'from-purple-400 to-purple-500', icon: '💎', siguiente: null }
};

const MiPerfil = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [recompensas, setRecompensas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modoOscuro') === 'true');
  const [notificaciones, setNotificaciones] = useState(() => localStorage.getItem('notificaciones') !== 'false');
  const [favoritos, setFavoritos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState('perfil');

  useEffect(() => {
    cargarPerfil();
    cargarFavoritos();
    cargarPagos();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    localStorage.setItem('modoOscuro', modoOscuro);
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [modoOscuro]);

  useEffect(() => {
    localStorage.setItem('notificaciones', notificaciones);
  }, [notificaciones]);

  const cargarPerfil = async () => {
    try {
      const clienteId = localStorage.getItem('clienteId');
      if (!clienteId) {
        navigate('/auth');
        return;
      }

      const response = await api.get(`/clientes/${clienteId}`);
      setCliente(response.data.cliente);
      setHistorial(response.data.historialCitas || []);
      setRecompensas(response.data.recompensas || null);
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 404) {
        localStorage.removeItem('clienteId');
        localStorage.removeItem('clienteData');
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarFavoritos = async () => {
    try {
      const clienteId = localStorage.getItem('clienteId');
      if (clienteId) {
        const response = await api.get(`/clientes/${clienteId}/favoritos`);
        setFavoritos(response.data || []);
      }
    } catch {
      // Fallback a localStorage
      const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
      setFavoritos(favs);
    }
  };

  const cargarPagos = async () => {
    try {
      const clienteId = localStorage.getItem('clienteId');
      if (clienteId) {
        const response = await api.get(`/pagos/cliente/${clienteId}`);
        // Formatear los pagos para mostrar
        const pagosFormateados = response.data.map(pago => ({
          _id: pago._id,
          fecha: pago.createdAt,
          monto: pago.montoUSD || pago.monto,
          metodo: pago.metodoPago,
          servicio: pago.cita?.servicios?.map(s => s.servicio?.nombre).join(', ') || 'Servicio'
        }));
        setPagos(pagosFormateados);
      }
    } catch {
      setPagos([]);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('clienteId');
    localStorage.removeItem('clienteData');
    navigate('/auth');
  };

  const abrirWhatsApp = () => {
    window.open('https://wa.me/message/BMBL46TI6VYXG1', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!cliente) return null;

  // Usar datos de recompensas si están disponibles, sino usar datos del cliente
  const puntos = recompensas?.puntos ?? cliente.puntos ?? 0;
  const totalGastado = recompensas?.totalGastado ?? cliente.totalGastado ?? 0;
  const totalCitas = cliente.totalCitas ?? 0;
  const nivelNombre = recompensas?.nivel ?? cliente.nivel ?? 'bronce';
  
  const nivel = nivelConfig[nivelNombre] || nivelConfig.bronce;
  const progreso = recompensas?.progreso ?? (nivel.siguiente 
    ? Math.min((totalGastado / nivel.siguiente) * 100, 100) 
    : 100);
  const faltaParaSiguiente = recompensas?.faltaParaSiguiente ?? (nivel.siguiente ? nivel.siguiente - totalGastado : 0);

  return (
    <div className="min-h-screen bg-cream pb-24 page-container">
      {/* Header con info del cliente */}
      <div className={`bg-gradient-to-br ${nivel.color} text-white px-4 pt-8 pb-6`}>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
            {nivel.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{cliente.nombre} {cliente.apellido}</h1>
            <p className="text-white/80 text-sm capitalize">Cliente {nivelNombre}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                <Star className="w-4 h-4 inline mr-1" />
                {puntos} puntos
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        {nivel.siguiente && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>${totalGastado} gastado</span>
              <span>Siguiente nivel: ${nivel.siguiente}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            {faltaParaSiguiente > 0 && (
              <p className="text-xs text-white/70 mt-1 text-center">
                Te faltan ${faltaParaSiguiente} para subir de nivel
              </p>
            )}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-600">{totalCitas}</p>
            <p className="text-xs text-gray-500">Citas</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-gold-500">${totalGastado}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-500">{puntos}</p>
            <p className="text-xs text-gray-500">Puntos</p>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="px-4 mt-4">
        <div className="flex bg-ivory-100 rounded-xl p-1">
          {[
            { key: 'perfil', label: 'Perfil', icon: CreditCard },
            { key: 'puntos', label: 'Puntos', icon: Award },
            { key: 'pagos', label: 'Pagos', icon: DollarSign },
            { key: 'config', label: 'Config', icon: Settings },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSeccionActiva(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                seccionActiva === tab.key
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según tab activo */}
      {seccionActiva === 'perfil' && (
        <>
          {/* Datos del perfil */}
          <div className="px-4 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Mi Información</h2>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              <div className="flex items-center gap-4 p-4">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Cédula</p>
                  <p className="font-medium text-gray-900">{cliente.tipoCedula}-{cliente.cedula}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{cliente.telefono}</p>
                </div>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-4 p-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{cliente.email}</p>
                  </div>
                </div>
              )}
              {cliente.fechaNacimiento && (
                <div className="flex items-center gap-4 p-4">
                  <Gift className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Cumpleaños</p>
                    <p className="font-medium text-gray-900">
                      {new Date(cliente.fechaNacimiento).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favoritos */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" /> Mis Favoritos
              </h2>
            </div>
            {favoritos.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aún no tienes favoritos</p>
                <p className="text-gray-400 text-xs mt-1">Guarda tus servicios favoritos desde la galería</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {favoritos.slice(0, 4).map(fav => (
                  <div key={fav._id} className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="font-medium text-gray-900 text-sm">{fav.nombre}</p>
                    <p className="text-brand-600 text-sm font-semibold">${fav.precio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de citas */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Historial de Citas</h2>
              <button 
                onClick={() => navigate('/mis-citas')}
                className="text-brand-500 text-sm font-medium flex items-center gap-1"
              >
                Ver todas <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {historial.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tienes citas aún</p>
                <button
                  onClick={() => navigate('/servicios')}
                  className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-xl font-medium"
                >
                  Reservar Cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {historial.slice(0, 3).map(cita => (
                  <div key={cita._id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {cita.servicios?.map(s => s.servicio?.nombre).join(', ') || 'Servicio'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cita.fechaCita).toLocaleDateString('es', { 
                            weekday: 'short', day: 'numeric', month: 'short' 
                          })}
                          <Clock className="w-4 h-4 ml-2" />
                          {cita.horaInicio}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cita.estado === 'completada' ? 'bg-brand-100 text-brand-600' :
                        cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-600' :
                        cita.estado === 'cancelada' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {cita.estado}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab de Puntos */}
      {seccionActiva === 'puntos' && (
        <div className="px-4 mt-6 space-y-4">
          {/* Tarjeta de puntos */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-brand-100 text-sm">Tus puntos</p>
                <p className="text-4xl font-bold">{cliente.puntos || 0}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-sm">Equivalente a <span className="font-bold">${((cliente.puntos || 0) * 0.1).toFixed(2)}</span> en descuentos</p>
            </div>
          </div>

          {/* Cómo ganar puntos */}
          <div className="bg-white rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" /> Cómo ganar puntos
            </h3>
            <div className="space-y-3">
              {[
                { accion: 'Por cada $1 gastado', puntos: '+10 pts', icon: DollarSign },
                { accion: 'Dejar una reseña', puntos: '+50 pts', icon: Star },
                { accion: 'Referir un amigo', puntos: '+100 pts', icon: Gift },
                { accion: 'Cumpleaños', puntos: '+200 pts', icon: Gift },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <span className="text-gray-700">{item.accion}</span>
                  </div>
                  <span className="font-semibold text-brand-600">{item.puntos}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Beneficios por nivel */}
          <div className="bg-white rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Beneficios por nivel</h3>
            <div className="space-y-3">
              {Object.entries(nivelConfig).map(([key, config]) => (
                <div 
                  key={key} 
                  className={`p-4 rounded-xl border-2 ${cliente.nivel === key ? 'border-brand-500 bg-brand-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold capitalize">{key}</p>
                      <p className="text-sm text-gray-500">
                        {key === 'bronce' && '5% descuento'}
                        {key === 'plata' && '10% descuento + prioridad'}
                        {key === 'oro' && '15% descuento + servicios gratis'}
                        {key === 'platino' && '20% descuento + VIP'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab de Pagos */}
      {seccionActiva === 'pagos' && (
        <div className="px-4 mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
          {pagos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagos.map(pago => (
                <div key={pago._id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{pago.servicio}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(pago.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                        {pago.metodo}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-brand-600">${pago.monto}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab de Configuración */}
      {seccionActiva === 'config' && (
        <div className="px-4 mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
          
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            {/* Notificaciones */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notificaciones</p>
                  <p className="text-sm text-gray-500">Recordatorios de citas</p>
                </div>
              </div>
              <button
                onClick={() => setNotificaciones(!notificaciones)}
                className={`w-12 h-7 rounded-full transition-colors ${notificaciones ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificaciones ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* Modo oscuro */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  {modoOscuro ? <Moon className="w-5 h-5 text-purple-600" /> : <Sun className="w-5 h-5 text-purple-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Modo oscuro</p>
                  <p className="text-sm text-gray-500">Tema de la aplicación</p>
                </div>
              </div>
              <button
                onClick={() => setModoOscuro(!modoOscuro)}
                className={`w-12 h-7 rounded-full transition-colors ${modoOscuro ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${modoOscuro ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* WhatsApp */}
            <button
              onClick={abrirWhatsApp}
              className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Contactar por WhatsApp</p>
                <p className="text-sm text-gray-500">Escríbenos directamente</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Botón cerrar sesión */}
          <button
            onClick={cerrarSesion}
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default MiPerfil;

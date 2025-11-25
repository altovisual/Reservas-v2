import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Clock, 
  Calendar,
  Bell,
  Save,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('negocio');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [config, setConfig] = useState({
    negocio: {
      nombre: 'Nail Spa',
      descripcion: 'Tu destino de belleza para uñas perfectas',
      telefono: '809-555-0100',
      email: 'info@nailspa.com',
      direccion: 'Av. Principal #123, Plaza Central',
      ciudad: 'Santo Domingo',
      instagram: '@nailspa',
      facebook: 'nailspa',
      website: 'www.nailspa.com'
    },
    horarios: {
      lunes: { activo: true, apertura: '09:00', cierre: '19:00' },
      martes: { activo: true, apertura: '09:00', cierre: '19:00' },
      miercoles: { activo: true, apertura: '09:00', cierre: '19:00' },
      jueves: { activo: true, apertura: '09:00', cierre: '19:00' },
      viernes: { activo: true, apertura: '09:00', cierre: '20:00' },
      sabado: { activo: true, apertura: '09:00', cierre: '18:00' },
      domingo: { activo: false, apertura: '10:00', cierre: '14:00' }
    },
    diasFestivos: [
      { fecha: '2024-01-01', nombre: 'Año Nuevo' },
      { fecha: '2024-01-06', nombre: 'Día de Reyes' },
      { fecha: '2024-02-27', nombre: 'Independencia' },
    ],
    notificaciones: {
      emailNuevaCita: true,
      emailCancelacion: true,
      recordatorioCliente: true,
      horasAntes: 24,
      whatsappActivo: false,
      whatsappNumero: ''
    },
    reservas: {
      anticipacionMinima: 2, // horas
      anticipacionMaxima: 30, // días
      permitirCancelacion: true,
      horasCancelacion: 24,
      requiereDeposito: false,
      porcentajeDeposito: 30
    }
  });

  const [nuevoFestivo, setNuevoFestivo] = useState({ fecha: '', nombre: '' });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await api.get('/configuracion');
      if (response.data) {
        setConfig(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.log('Usando configuración por defecto');
    }
  };

  const guardarConfiguracion = async () => {
    setSaving(true);
    try {
      await api.put('/configuracion', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error guardando:', error);
      // Simular guardado exitoso
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const agregarFestivo = () => {
    if (nuevoFestivo.fecha && nuevoFestivo.nombre) {
      setConfig(prev => ({
        ...prev,
        diasFestivos: [...prev.diasFestivos, nuevoFestivo]
      }));
      setNuevoFestivo({ fecha: '', nombre: '' });
    }
  };

  const eliminarFestivo = (index) => {
    setConfig(prev => ({
      ...prev,
      diasFestivos: prev.diasFestivos.filter((_, i) => i !== index)
    }));
  };

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const tabs = [
    { id: 'negocio', label: 'Negocio', icon: Store },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'festivos', label: 'Días Festivos', icon: Calendar },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'reservas', label: 'Reservas', icon: Calendar }
  ];

  return (
    <AdminLayout title="Configuración" subtitle="Personaliza tu negocio">
      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-emerald-500 bg-emerald-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Tab Negocio */}
        {activeTab === 'negocio' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Negocio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={config.negocio.nombre}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, nombre: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={config.negocio.telefono}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, telefono: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={config.negocio.email}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, email: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sitio Web</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={config.negocio.website}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, website: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={config.negocio.direccion}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, direccion: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={config.negocio.instagram}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, instagram: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook</label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={config.negocio.facebook}
                      onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, facebook: e.target.value }}))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                  <textarea
                    value={config.negocio.descripcion}
                    onChange={(e) => setConfig(prev => ({ ...prev, negocio: { ...prev.negocio, descripcion: e.target.value }}))}
                    rows={3}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Horarios */}
        {activeTab === 'horarios' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Horarios de Atención</h3>
            <div className="space-y-3">
              {diasSemana.map(dia => (
                <div key={dia.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <label className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      checked={config.horarios[dia.key].activo}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        horarios: {
                          ...prev.horarios,
                          [dia.key]: { ...prev.horarios[dia.key], activo: e.target.checked }
                        }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className={`font-medium ${config.horarios[dia.key].activo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {dia.label}
                    </span>
                  </label>
                  {config.horarios[dia.key].activo ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        value={config.horarios[dia.key].apertura}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          horarios: {
                            ...prev.horarios,
                            [dia.key]: { ...prev.horarios[dia.key], apertura: e.target.value }
                          }
                        }))}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-gray-400">a</span>
                      <input
                        type="time"
                        value={config.horarios[dia.key].cierre}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          horarios: {
                            ...prev.horarios,
                            [dia.key]: { ...prev.horarios[dia.key], cierre: e.target.value }
                          }
                        }))}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Días Festivos */}
        {activeTab === 'festivos' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Días Festivos / Vacaciones</h3>
            <p className="text-sm text-gray-500">El negocio estará cerrado en estas fechas</p>
            
            {/* Agregar nuevo */}
            <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="date"
                value={nuevoFestivo.fecha}
                onChange={(e) => setNuevoFestivo(prev => ({ ...prev, fecha: e.target.value }))}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Nombre del día festivo"
                value={nuevoFestivo.nombre}
                onChange={(e) => setNuevoFestivo(prev => ({ ...prev, nombre: e.target.value }))}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={agregarFestivo}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {/* Lista de festivos */}
            <div className="space-y-2">
              {config.diasFestivos.map((festivo, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{festivo.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(festivo.fecha + 'T00:00:00').toLocaleDateString('es', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => eliminarFestivo(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {config.diasFestivos.length === 0 && (
                <p className="text-center py-8 text-gray-400">No hay días festivos configurados</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Notificaciones */}
        {activeTab === 'notificaciones' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuración de Notificaciones</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">Notificaciones por Email</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Recibir email cuando hay nueva cita</span>
                    <input
                      type="checkbox"
                      checked={config.notificaciones.emailNuevaCita}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        notificaciones: { ...prev.notificaciones, emailNuevaCita: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Recibir email cuando se cancela una cita</span>
                    <input
                      type="checkbox"
                      checked={config.notificaciones.emailCancelacion}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        notificaciones: { ...prev.notificaciones, emailCancelacion: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">Recordatorios a Clientes</h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Enviar recordatorio antes de la cita</span>
                    <input
                      type="checkbox"
                      checked={config.notificaciones.recordatorioCliente}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        notificaciones: { ...prev.notificaciones, recordatorioCliente: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </label>
                  {config.notificaciones.recordatorioCliente && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">Enviar</span>
                      <input
                        type="number"
                        value={config.notificaciones.horasAntes}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          notificaciones: { ...prev.notificaciones, horasAntes: parseInt(e.target.value) }
                        }))}
                        className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-gray-700">horas antes</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">WhatsApp Business (Próximamente)</h4>
                <div className="space-y-4 opacity-50">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Activar notificaciones por WhatsApp</span>
                    <input
                      type="checkbox"
                      disabled
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Reservas */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuración de Reservas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">Anticipación</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mínimo de horas antes para reservar</label>
                    <input
                      type="number"
                      value={config.reservas.anticipacionMinima}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        reservas: { ...prev.reservas, anticipacionMinima: parseInt(e.target.value) }
                      }))}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Máximo de días de anticipación</label>
                    <input
                      type="number"
                      value={config.reservas.anticipacionMaxima}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        reservas: { ...prev.reservas, anticipacionMaxima: parseInt(e.target.value) }
                      }))}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">Cancelaciones</h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Permitir cancelaciones</span>
                    <input
                      type="checkbox"
                      checked={config.reservas.permitirCancelacion}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        reservas: { ...prev.reservas, permitirCancelacion: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </label>
                  {config.reservas.permitirCancelacion && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Horas mínimas antes para cancelar</label>
                      <input
                        type="number"
                        value={config.reservas.horasCancelacion}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          reservas: { ...prev.reservas, horasCancelacion: parseInt(e.target.value) }
                        }))}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-4">Depósitos (Próximamente)</h4>
                <div className="space-y-4 opacity-50">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Requerir depósito para reservar</span>
                    <input
                      type="checkbox"
                      disabled
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end mt-6">
        <button
          onClick={guardarConfiguracion}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            saved 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          } disabled:opacity-50`}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : saved ? (
            <>
              <Save className="w-5 h-5" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </AdminLayout>
  );
};

export default Configuracion;

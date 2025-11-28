import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { 
  Star, 
  Users, 
  Settings, 
  Plus, 
  Minus, 
  Search,
  ChevronRight,
  Save,
  RefreshCw,
  Crown,
  Sparkles,
  DollarSign,
  Edit3,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const nivelesDefault = [
  { nombre: 'bronce', min: 0, max: 500, color: 'from-amber-600 to-amber-700', icon: '🥉', beneficios: ['Acumulación de puntos básica', '1 punto por cada $1'] },
  { nombre: 'plata', min: 500, max: 2000, color: 'from-gray-400 to-gray-500', icon: '🥈', beneficios: ['1.5x puntos', '5% descuento en cumpleaños'] },
  { nombre: 'oro', min: 2000, max: 5000, color: 'from-yellow-400 to-yellow-500', icon: '🥇', beneficios: ['2x puntos', '10% descuento en cumpleaños', 'Prioridad en citas'] },
  { nombre: 'platino', min: 5000, max: Infinity, color: 'from-purple-400 to-purple-500', icon: '💎', beneficios: ['3x puntos', '15% descuento en cumpleaños', 'Servicios exclusivos', 'Atención VIP'] }
];

const Recompensas = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalPuntos, setModalPuntos] = useState(null);
  const [puntosAjuste, setPuntosAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('agregar');
  const [tabActiva, setTabActiva] = useState('clientes');
  const [niveles, setNiveles] = useState(nivelesDefault);
  const [editandoNivel, setEditandoNivel] = useState(null);
  const [configuracion, setConfiguracion] = useState({
    puntoPorDolar: 1,
    valorPunto: 0.01,
    multiplicadorCumpleanos: 2,
    diasValidezPuntos: 365
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarDatos();
    cargarConfiguracion();
    // eslint-disable-next-line
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getNivelCliente = (totalGastado) => {
    for (let i = niveles.length - 1; i >= 0; i--) {
      if (totalGastado >= niveles[i].min) {
        return niveles[i];
      }
    }
    return niveles[0];
  };

  const estadisticas = {
    totalClientes: clientes.length,
    clientesBronce: clientes.filter(c => getNivelCliente(c.totalGastado || 0).nombre === 'bronce').length,
    clientesPlata: clientes.filter(c => getNivelCliente(c.totalGastado || 0).nombre === 'plata').length,
    clientesOro: clientes.filter(c => getNivelCliente(c.totalGastado || 0).nombre === 'oro').length,
    clientesPlatino: clientes.filter(c => getNivelCliente(c.totalGastado || 0).nombre === 'platino').length,
    totalPuntos: clientes.reduce((sum, c) => sum + (c.puntos || 0), 0),
    totalGastado: clientes.reduce((sum, c) => sum + (c.totalGastado || 0), 0)
  };

  const ajustarPuntos = async () => {
    if (!puntosAjuste || !motivoAjuste) {
      setMensaje({ tipo: 'error', texto: 'Ingresa los puntos y el motivo' });
      return;
    }

    try {
      setGuardando(true);
      const puntos = parseInt(puntosAjuste);
      
      if (tipoAjuste === 'agregar') {
        await api.post(`/clientes/${modalPuntos._id}/puntos`, { 
          puntos, 
          motivo: motivoAjuste 
        });
      } else {
        await api.post(`/clientes/${modalPuntos._id}/canjear-puntos`, { 
          puntos,
          motivo: motivoAjuste
        });
      }

      setMensaje({ tipo: 'exito', texto: `${puntos} puntos ${tipoAjuste === 'agregar' ? 'agregados' : 'restados'} correctamente` });
      setModalPuntos(null);
      setPuntosAjuste('');
      setMotivoAjuste('');
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'Error al ajustar puntos' });
    } finally {
      setGuardando(false);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true);
      await api.put('/recompensas/configuracion', {
        ...configuracion,
        niveles: niveles.map(n => ({
          nombre: n.nombre,
          min: n.min,
          max: n.max === Infinity ? null : n.max,
          beneficios: n.beneficios
        }))
      });
      setMensaje({ tipo: 'exito', texto: 'Configuración guardada correctamente' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'Error al guardar configuración' });
    } finally {
      setGuardando(false);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await api.get('/recompensas/configuracion');
      if (response.data) {
        setConfiguracion({
          puntoPorDolar: response.data.puntoPorDolar || 1,
          valorPunto: response.data.valorPunto || 0.01,
          multiplicadorCumpleanos: response.data.multiplicadorCumpleanos || 2,
          diasValidezPuntos: response.data.diasValidezPuntos || 365
        });
        if (response.data.niveles?.length > 0) {
          setNiveles(response.data.niveles.map(n => ({
            ...n,
            max: n.max === null ? Infinity : n.max,
            color: nivelesDefault.find(nd => nd.nombre === n.nombre)?.color || 'from-gray-400 to-gray-500',
            icon: nivelesDefault.find(nd => nd.nombre === n.nombre)?.icon || '🏅'
          })));
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  // Auto-ocultar mensajes
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  if (loading) {
    return (
      <AdminLayout title="Recompensas" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sistema de Recompensas" subtitle="Gestión de puntos, niveles y beneficios">
      {/* Mensaje de notificación */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {mensaje.tipo === 'exito' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {mensaje.texto}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl w-fit">
        {[
          { id: 'clientes', label: 'Clientes', icon: Users },
          { id: 'niveles', label: 'Niveles', icon: Crown },
          { id: 'configuracion', label: 'Configuración', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              tabActiva === tab.id
                ? 'bg-emerald-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalClientes}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥉</span>
            <div>
              <p className="text-2xl font-bold">{estadisticas.clientesBronce}</p>
              <p className="text-xs text-amber-100">Bronce</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥈</span>
            <div>
              <p className="text-2xl font-bold">{estadisticas.clientesPlata}</p>
              <p className="text-xs text-gray-100">Plata</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥇</span>
            <div>
              <p className="text-2xl font-bold">{estadisticas.clientesOro}</p>
              <p className="text-xs text-yellow-100">Oro</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-2xl font-bold">{estadisticas.clientesPlatino}</p>
              <p className="text-xs text-purple-100">Platino</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPuntos.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Puntos activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${estadisticas.totalGastado.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total gastado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab: Clientes */}
      {tabActiva === 'clientes' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lista de clientes */}
          <div className={`${clienteSeleccionado ? 'lg:w-1/2' : 'w-full'} space-y-4`}>
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre, teléfono o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {clientesFiltrados.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron clientes</p>
                  </div>
                ) : (
                  clientesFiltrados.map(cliente => {
                    const nivel = getNivelCliente(cliente.totalGastado || 0);
                    return (
                      <div
                        key={cliente._id}
                        onClick={() => setClienteSeleccionado(cliente)}
                        className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          clienteSeleccionado?._id === cliente._id ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-br ${nivel.color} rounded-xl flex items-center justify-center text-xl`}>
                          {nivel.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{cliente.nombre}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white bg-gradient-to-r ${nivel.color}`}>
                              {nivel.nombre.charAt(0).toUpperCase() + nivel.nombre.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{cliente.telefono}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{cliente.puntos || 0} pts</p>
                          <p className="text-xs text-gray-500">${(cliente.totalGastado || 0).toLocaleString()}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Detalle del cliente */}
          {clienteSeleccionado && (
            <div className="lg:w-1/2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${getNivelCliente(clienteSeleccionado.totalGastado || 0).color} text-white relative`}>
                  <button
                    onClick={() => setClienteSeleccionado(null)}
                    className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                      {getNivelCliente(clienteSeleccionado.totalGastado || 0).icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{clienteSeleccionado.nombre}</h3>
                      <p className="text-white/80 capitalize">Cliente {getNivelCliente(clienteSeleccionado.totalGastado || 0).nombre}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4" />
                        <span className="font-bold">{clienteSeleccionado.puntos || 0} puntos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas del cliente */}
                <div className="p-6 grid grid-cols-3 gap-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{clienteSeleccionado.totalCitas || 0}</p>
                    <p className="text-xs text-gray-500">Citas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">${(clienteSeleccionado.totalGastado || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total gastado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{clienteSeleccionado.puntos || 0}</p>
                    <p className="text-xs text-gray-500">Puntos</p>
                  </div>
                </div>

                {/* Progreso al siguiente nivel */}
                <div className="p-6 border-b border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-3">Progreso al siguiente nivel</h4>
                  {(() => {
                    const nivelActual = getNivelCliente(clienteSeleccionado.totalGastado || 0);
                    const indexActual = niveles.findIndex(n => n.nombre === nivelActual.nombre);
                    const siguienteNivel = niveles[indexActual + 1];
                    
                    if (!siguienteNivel) {
                      return (
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <span className="text-3xl">💎</span>
                          <p className="font-medium text-purple-700 mt-2">¡Nivel máximo alcanzado!</p>
                          <p className="text-sm text-purple-600">Este cliente es VIP Platino</p>
                        </div>
                      );
                    }

                    const progreso = ((clienteSeleccionado.totalGastado || 0) - nivelActual.min) / (siguienteNivel.min - nivelActual.min) * 100;
                    const falta = siguienteNivel.min - (clienteSeleccionado.totalGastado || 0);

                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">${(clienteSeleccionado.totalGastado || 0).toLocaleString()}</span>
                          <span className="text-gray-600">${siguienteNivel.min.toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${siguienteNivel.color} transition-all duration-500`}
                            style={{ width: `${Math.min(progreso, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          Faltan <span className="font-bold text-gray-700">${falta.toLocaleString()}</span> para nivel {siguienteNivel.nombre}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Beneficios actuales */}
                <div className="p-6 border-b border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-3">Beneficios actuales</h4>
                  <div className="space-y-2">
                    {getNivelCliente(clienteSeleccionado.totalGastado || 0).beneficios.map((beneficio, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {beneficio}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Gestionar puntos</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setModalPuntos(clienteSeleccionado); setTipoAjuste('agregar'); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar puntos
                    </button>
                    <button
                      onClick={() => { setModalPuntos(clienteSeleccionado); setTipoAjuste('restar'); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                      Canjear puntos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Niveles */}
      {tabActiva === 'niveles' && (
        <div className="grid md:grid-cols-2 gap-6">
          {niveles.map((nivel, index) => (
            <div key={nivel.nombre} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className={`p-6 bg-gradient-to-r ${nivel.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{nivel.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{nivel.nombre}</h3>
                      <p className="text-white/80">
                        ${nivel.min.toLocaleString()} - {nivel.max === Infinity ? '∞' : `$${nivel.max.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditandoNivel(editandoNivel === index ? null : index)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {editandoNivel === index ? (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo ($)</label>
                      <input
                        type="number"
                        value={nivel.min}
                        onChange={(e) => {
                          const newNiveles = [...niveles];
                          newNiveles[index].min = parseInt(e.target.value) || 0;
                          setNiveles(newNiveles);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Máximo ($)</label>
                      <input
                        type="number"
                        value={nivel.max === Infinity ? '' : nivel.max}
                        placeholder="∞"
                        onChange={(e) => {
                          const newNiveles = [...niveles];
                          newNiveles[index].max = e.target.value ? parseInt(e.target.value) : Infinity;
                          setNiveles(newNiveles);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios (uno por línea)</label>
                    <textarea
                      value={nivel.beneficios.join('\n')}
                      onChange={(e) => {
                        const newNiveles = [...niveles];
                        newNiveles[index].beneficios = e.target.value.split('\n').filter(b => b.trim());
                        setNiveles(newNiveles);
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setEditandoNivel(null)}
                    className="w-full bg-emerald-500 text-white py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Guardar cambios
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Beneficios</h4>
                  <ul className="space-y-2">
                    {nivel.beneficios.map((beneficio, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {clientes.filter(c => getNivelCliente(c.totalGastado || 0).nombre === nivel.nombre).length}
                      </span> clientes en este nivel
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Configuración */}
      {tabActiva === 'configuracion' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              Configuración de puntos
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntos por cada dólar gastado
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={configuracion.puntoPorDolar}
                    onChange={(e) => setConfiguracion({...configuracion, puntoPorDolar: parseFloat(e.target.value) || 0})}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500">puntos por $1</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Ejemplo: Si el cliente gasta $100, recibirá {100 * configuracion.puntoPorDolar} puntos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de cada punto al canjear
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={configuracion.valorPunto}
                    onChange={(e) => setConfiguracion({...configuracion, valorPunto: parseFloat(e.target.value) || 0})}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500">por punto</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Ejemplo: 100 puntos = ${(100 * configuracion.valorPunto).toFixed(2)} de descuento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Multiplicador de puntos en cumpleaños
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={configuracion.multiplicadorCumpleanos}
                    onChange={(e) => setConfiguracion({...configuracion, multiplicadorCumpleanos: parseFloat(e.target.value) || 1})}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500">x puntos</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Los clientes reciben {configuracion.multiplicadorCumpleanos}x puntos en su cumpleaños
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de validez de los puntos
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={configuracion.diasValidezPuntos}
                    onChange={(e) => setConfiguracion({...configuracion, diasValidezPuntos: parseInt(e.target.value) || 365})}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500">días</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Los puntos expiran después de {configuracion.diasValidezPuntos} días sin actividad
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={guardarConfiguracion}
                disabled={guardando}
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {guardando ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Guardar configuración
              </button>
            </div>
          </div>

          {/* Resumen del sistema */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Resumen del sistema
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-3xl font-bold">{estadisticas.totalPuntos.toLocaleString()}</p>
                <p className="text-emerald-100">Puntos en circulación</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-3xl font-bold">${(estadisticas.totalPuntos * configuracion.valorPunto).toFixed(2)}</p>
                <p className="text-emerald-100">Valor en descuentos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ajuste de puntos */}
      {modalPuntos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className={`p-6 ${tipoAjuste === 'agregar' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {tipoAjuste === 'agregar' ? 'Agregar puntos' : 'Canjear puntos'}
                </h3>
                <button
                  onClick={() => { setModalPuntos(null); setPuntosAjuste(''); setMotivoAjuste(''); }}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/80 mt-1">{modalPuntos.nombre}</p>
              <p className="text-sm text-white/60">Puntos actuales: {modalPuntos.puntos || 0}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de puntos
                </label>
                <input
                  type="number"
                  value={puntosAjuste}
                  onChange={(e) => setPuntosAjuste(e.target.value)}
                  placeholder="Ej: 100"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar motivo...</option>
                  {tipoAjuste === 'agregar' ? (
                    <>
                      <option value="Bonificación especial">Bonificación especial</option>
                      <option value="Promoción">Promoción</option>
                      <option value="Compensación">Compensación</option>
                      <option value="Cumpleaños">Cumpleaños</option>
                      <option value="Referido">Referido</option>
                      <option value="Ajuste manual">Ajuste manual</option>
                    </>
                  ) : (
                    <>
                      <option value="Canje por descuento">Canje por descuento</option>
                      <option value="Canje por servicio">Canje por servicio</option>
                      <option value="Canje por producto">Canje por producto</option>
                      <option value="Expiración">Expiración</option>
                      <option value="Ajuste manual">Ajuste manual</option>
                    </>
                  )}
                </select>
              </div>

              {puntosAjuste && (
                <div className={`p-4 rounded-xl ${tipoAjuste === 'agregar' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-sm ${tipoAjuste === 'agregar' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {tipoAjuste === 'agregar' ? (
                      <>Nuevos puntos: <span className="font-bold">{(modalPuntos.puntos || 0) + parseInt(puntosAjuste || 0)}</span></>
                    ) : (
                      <>Puntos restantes: <span className="font-bold">{Math.max(0, (modalPuntos.puntos || 0) - parseInt(puntosAjuste || 0))}</span></>
                    )}
                  </p>
                  {tipoAjuste === 'restar' && parseInt(puntosAjuste) > (modalPuntos.puntos || 0) && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      El cliente no tiene suficientes puntos
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setModalPuntos(null); setPuntosAjuste(''); setMotivoAjuste(''); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ajustarPuntos}
                  disabled={guardando || !puntosAjuste || !motivoAjuste || (tipoAjuste === 'restar' && parseInt(puntosAjuste) > (modalPuntos.puntos || 0))}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 ${
                    tipoAjuste === 'agregar' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {guardando ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Recompensas;

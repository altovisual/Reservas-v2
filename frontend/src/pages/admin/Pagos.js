import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { CreditCard, Search, CheckCircle, XCircle, Clock, Eye, Smartphone, Building, DollarSign, TrendingUp, Plus, X, Calendar, Scissors, UserCircle } from 'lucide-react';
import api from '../../services/api';

const metodosConfig = {
  pago_movil: { label: 'Pago Móvil', icon: Smartphone, color: 'text-blue-600 bg-blue-50' },
  transferencia: { label: 'Transferencia', icon: Building, color: 'text-purple-600 bg-purple-50' },
  efectivo_bs: { label: 'Efectivo Bs', icon: DollarSign, color: 'text-green-600 bg-green-50' },
  efectivo_usd: { label: 'Efectivo USD', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  zelle: { label: 'Zelle', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
  punto_venta: { label: 'Punto de Venta', icon: CreditCard, color: 'text-orange-600 bg-orange-50' }
};

const estadosConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  verificando: { label: 'Verificando', color: 'bg-blue-100 text-blue-700', icon: Eye },
  confirmado: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [resumen, setResumen] = useState({ hoy: { total: 0, cantidad: 0 }, mes: { total: 0, cantidad: 0 }, pendientesVerificar: 0 });
  const [modalNuevoPago, setModalNuevoPago] = useState(false);
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [nuevoPago, setNuevoPago] = useState({
    citaId: '',
    metodoPago: 'efectivo_bs',
    monto: '',
    referencia: ''
  });

  useEffect(() => {
    cargarPagos();
    cargarResumen();
    // eslint-disable-next-line
  }, [filtroEstado, filtroMetodo]);

  const cargarPagos = async () => {
    try {
      let url = '/pagos?';
      if (filtroEstado) url += `estado=${filtroEstado}&`;
      if (filtroMetodo) url += `metodoPago=${filtroMetodo}&`;
      
      const response = await api.get(url);
      setPagos(response.data);
    } catch (error) {
      console.error('Error:', error);
      // Datos de ejemplo
      setPagos([
        {
          _id: '1',
          cliente: { nombre: 'María', apellido: 'González', cedula: '12345678', telefono: '0424-1234567' },
          monto: 25,
          metodoPago: 'pago_movil',
          datosPago: { referencia: '123456', banco: 'Banesco' },
          estado: 'verificando',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          cliente: { nombre: 'Carmen', apellido: 'Rodríguez', cedula: '87654321', telefono: '0412-9876543' },
          monto: 35,
          metodoPago: 'transferencia',
          datosPago: { referencia: '789012', banco: 'Mercantil' },
          estado: 'confirmado',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const response = await api.get('/pagos/resumen');
      setResumen(response.data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const cargarCitasPendientes = async () => {
    try {
      const response = await api.get('/citas/todas');
      // Filtrar citas no pagadas
      const pendientes = response.data.filter(c => !c.pagado && ['confirmada', 'completada', 'en_progreso'].includes(c.estado));
      setCitasPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const abrirModalNuevoPago = () => {
    cargarCitasPendientes();
    setModalNuevoPago(true);
  };

  const registrarPago = async () => {
    if (!nuevoPago.citaId) {
      alert('Selecciona una cita');
      return;
    }
    try {
      await api.post(`/citas/${nuevoPago.citaId}/pago`, {
        metodoPago: nuevoPago.metodoPago,
        referenciaPago: nuevoPago.referencia,
        monto: parseFloat(nuevoPago.monto) || 0
      });
      setModalNuevoPago(false);
      setNuevoPago({ citaId: '', metodoPago: 'efectivo_bs', monto: '', referencia: '' });
      cargarPagos();
      cargarResumen();
      alert('Pago registrado correctamente');
    } catch (error) {
      alert('Error al registrar pago');
    }
  };

  const verificarPago = async (pagoId, nuevoEstado) => {
    try {
      await api.patch(`/pagos/${pagoId}/verificar`, {
        estado: nuevoEstado,
        adminId: localStorage.getItem('adminId')
      });
      cargarPagos();
      cargarResumen();
      setPagoSeleccionado(null);
    } catch (error) {
      alert('Error al verificar pago');
    }
  };

  const pagosFiltrados = pagos.filter(p => {
    if (!busqueda) return true;
    const busq = busqueda.toLowerCase();
    return (
      p.cliente?.nombre?.toLowerCase().includes(busq) ||
      p.cliente?.cedula?.includes(busq) ||
      p.datosPago?.referencia?.includes(busq)
    );
  });

  return (
    <AdminLayout title="Gestión de Pagos" subtitle="Verifica y administra los pagos">
      {/* Botón nuevo pago */}
      <div className="flex justify-end mb-4">
        <button
          onClick={abrirModalNuevoPago}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Registrar Pago
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${resumen.hoy?.total || 0}</p>
              <p className="text-sm text-gray-500">Hoy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${resumen.mes?.total || 0}</p>
              <p className="text-sm text-gray-500">Este mes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumen.pendientesVerificar || 0}</p>
              <p className="text-sm text-gray-500">Por verificar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumen.mes?.cantidad || 0}</p>
              <p className="text-sm text-gray-500">Transacciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente, cédula o referencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los estados</option>
              <option value="verificando">Por verificar</option>
              <option value="confirmado">Confirmados</option>
              <option value="rechazado">Rechazados</option>
            </select>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los métodos</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo_usd">Efectivo USD</option>
              <option value="efectivo_bs">Efectivo Bs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : pagosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pagosFiltrados.map(pago => {
            const metodo = metodosConfig[pago.metodoPago] || metodosConfig.pago_movil;
            const estado = estadosConfig[pago.estado] || estadosConfig.pendiente;
            const MetodoIcon = metodo.icon;
            const EstadoIcon = estado.icon;
            
            return (
              <div
                key={pago._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setPagoSeleccionado(pago)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metodo.color}`}>
                      <MetodoIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {pago.cliente?.nombre} {pago.cliente?.apellido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {metodo.label} • Ref: {pago.datosPago?.referencia || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${pago.monto}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                      <EstadoIcon className="w-3 h-3" />
                      {estado.label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>CI: {pago.cliente?.cedula}</span>
                  <span>{new Date(pago.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle de pago */}
      {pagoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detalle del Pago</h3>
                <p className="text-sm text-gray-500">ID: {pagoSeleccionado._id?.slice(-8)}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${estadosConfig[pagoSeleccionado.estado]?.color}`}>
                {estadosConfig[pagoSeleccionado.estado]?.label}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {/* Info de la Cita */}
              {pagoSeleccionado.cita && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Información de la Cita
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Fecha:</span>
                      <span className="font-medium text-emerald-900">
                        {pagoSeleccionado.cita.fechaCita ? 
                          new Date(pagoSeleccionado.cita.fechaCita).toLocaleDateString('es', { 
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                          }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Hora:</span>
                      <span className="font-medium text-emerald-900">{pagoSeleccionado.cita.horaInicio || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Servicios realizados */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Servicios Realizados
                </h4>
                {pagoSeleccionado.cita?.servicios?.length > 0 ? (
                  <div className="space-y-2">
                    {pagoSeleccionado.cita.servicios.map((servicio, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
                        <span className="text-blue-900 font-medium">{servicio.nombreServicio || servicio.nombre}</span>
                        <span className="text-blue-700">${servicio.precio || 0}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t-2 border-blue-200">
                      <span className="font-semibold text-blue-900">Total Servicios:</span>
                      <span className="font-bold text-blue-900">
                        ${pagoSeleccionado.cita.servicios.reduce((sum, s) => sum + (s.precio || 0), 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-600 text-sm">Sin información de servicios</p>
                )}
              </div>

              {/* Info cliente */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  Cliente
                </h4>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{pagoSeleccionado.cliente?.nombre} {pagoSeleccionado.cliente?.apellido}</p>
                  <p className="text-sm text-gray-500">CI: {pagoSeleccionado.cliente?.cedula || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Tel: {pagoSeleccionado.cliente?.telefono || 'N/A'}</p>
                </div>
              </div>

              {/* Info pago */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Información del Pago
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Método:</span>
                    <span className="font-medium">{metodosConfig[pagoSeleccionado.metodoPago]?.label || pagoSeleccionado.metodoPago}</span>
                  </div>
                  {pagoSeleccionado.datosPago?.referencia && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referencia:</span>
                      <span className="font-medium font-mono">{pagoSeleccionado.datosPago.referencia}</span>
                    </div>
                  )}
                  {pagoSeleccionado.datosPago?.banco && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Banco:</span>
                      <span className="font-medium">{pagoSeleccionado.datosPago.banco}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha de pago:</span>
                    <span className="font-medium">
                      {new Date(pagoSeleccionado.createdAt).toLocaleDateString('es', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  {pagoSeleccionado.fechaVerificacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verificado:</span>
                      <span className="font-medium">
                        {new Date(pagoSeleccionado.fechaVerificacion).toLocaleDateString('es', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 mt-2 border-t-2 border-gray-200">
                    <span className="text-gray-900 font-semibold">Monto Total:</span>
                    <span className="text-2xl font-bold text-emerald-600">${pagoSeleccionado.monto}</span>
                  </div>
                </div>
              </div>

              {/* Comprobante */}
              {pagoSeleccionado.comprobante && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Comprobante</h4>
                  <img 
                    src={pagoSeleccionado.comprobante} 
                    alt="Comprobante" 
                    className="w-full rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {/* Acciones */}
              {pagoSeleccionado.estado === 'verificando' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => verificarPago(pagoSeleccionado._id, 'confirmado')}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirmar
                  </button>
                  <button
                    onClick={() => verificarPago(pagoSeleccionado._id, 'rechazado')}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600"
                  >
                    <XCircle className="w-5 h-5" /> Rechazar
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setPagoSeleccionado(null)}
                className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo pago */}
      {modalNuevoPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Registrar Pago</h3>
              <button 
                onClick={() => setModalNuevoPago(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Seleccionar cita */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Cita</label>
                <select
                  value={nuevoPago.citaId}
                  onChange={(e) => {
                    const cita = citasPendientes.find(c => c._id === e.target.value);
                    setNuevoPago({
                      ...nuevoPago,
                      citaId: e.target.value,
                      monto: cita?.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona una cita...</option>
                  {citasPendientes.map(cita => (
                    <option key={cita._id} value={cita._id}>
                      {cita.nombreCliente} - {new Date(cita.fechaCita).toLocaleDateString()} {cita.horaInicio} - ${cita.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0}
                    </option>
                  ))}
                </select>
                {citasPendientes.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No hay citas pendientes de pago</p>
                )}
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <select
                  value={nuevoPago.metodoPago}
                  onChange={(e) => setNuevoPago({...nuevoPago, metodoPago: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="efectivo_bs">Efectivo Bs</option>
                  <option value="efectivo_usd">Efectivo USD</option>
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="punto_venta">Punto de Venta</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto ($)</label>
                <input
                  type="number"
                  value={nuevoPago.monto}
                  onChange={(e) => setNuevoPago({...nuevoPago, monto: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Referencia */}
              {['pago_movil', 'transferencia', 'zelle'].includes(nuevoPago.metodoPago) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                  <input
                    type="text"
                    value={nuevoPago.referencia}
                    onChange={(e) => setNuevoPago({...nuevoPago, referencia: e.target.value})}
                    placeholder="Número de referencia"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalNuevoPago(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={registrarPago}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Pagos;

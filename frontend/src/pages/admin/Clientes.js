import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  X,
  ChevronRight,
  Gift,
  FileText
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    notas: '',
    cumpleanos: ''
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error:', error);
      // Datos de ejemplo
      setClientes([
        {
          _id: '1',
          nombre: 'María González',
          telefono: '809-555-0101',
          email: 'maria@email.com',
          cumpleanos: '1990-03-15',
          notas: 'Prefiere colores claros. Alérgica al acrílico.',
          totalCitas: 12,
          totalGastado: 4800,
          ultimaCita: '2024-01-15',
          puntos: 240,
          historial: [
            { fecha: '2024-01-15', servicio: 'Manicure Gel', monto: 400, especialista: 'Ana López' },
            { fecha: '2024-01-02', servicio: 'Pedicure Spa', monto: 500, especialista: 'María García' },
            { fecha: '2023-12-20', servicio: 'Uñas Acrílicas', monto: 600, especialista: 'Ana López' },
          ]
        },
        {
          _id: '2',
          nombre: 'Carmen Rodríguez',
          telefono: '809-555-0102',
          email: 'carmen@email.com',
          cumpleanos: '1985-07-22',
          notas: 'Cliente VIP. Siempre pide con María.',
          totalCitas: 24,
          totalGastado: 9600,
          ultimaCita: '2024-01-18',
          puntos: 480,
          historial: [
            { fecha: '2024-01-18', servicio: 'Manicure + Pedicure', monto: 800, especialista: 'María García' },
            { fecha: '2024-01-05', servicio: 'Nail Art', monto: 350, especialista: 'María García' },
          ]
        },
        {
          _id: '3',
          nombre: 'Laura Martínez',
          telefono: '809-555-0103',
          email: 'laura@email.com',
          cumpleanos: '1992-11-08',
          notas: '',
          totalCitas: 5,
          totalGastado: 1500,
          ultimaCita: '2024-01-10',
          puntos: 75,
          historial: [
            { fecha: '2024-01-10', servicio: 'Manicure Express', monto: 250, especialista: 'Carmen Ruiz' },
          ]
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const guardarCliente = async () => {
    try {
      if (modalNuevo === 'nuevo') {
        await api.post('/clientes', form);
      } else {
        await api.put(`/clientes/${modalNuevo}`, form);
      }
      setModalNuevo(false);
      setForm({ nombre: '', telefono: '', email: '', notas: '', cumpleanos: '' });
      cargarClientes();
    } catch (error) {
      alert('Error al guardar cliente');
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirEditar = (cliente) => {
    setForm({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email || '',
      notas: cliente.notas || '',
      cumpleanos: cliente.cumpleanos || ''
    });
    setModalNuevo(cliente._id);
  };

  const getNivelCliente = (puntos) => {
    if (puntos >= 400) return { nivel: 'VIP', color: 'bg-amber-500', textColor: 'text-amber-600' };
    if (puntos >= 200) return { nivel: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (puntos >= 100) return { nivel: 'Silver', color: 'bg-gray-400', textColor: 'text-gray-600' };
    return { nivel: 'Bronce', color: 'bg-orange-400', textColor: 'text-orange-600' };
  };

  if (loading) {
    return (
      <AdminLayout title="Clientes" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Clientes" subtitle="Gestión de clientes y fidelización">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de clientes */}
        <div className={`${clienteSeleccionado ? 'lg:w-1/2' : 'w-full'} space-y-4`}>
          {/* Barra de búsqueda y botón */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => { setForm({ nombre: '', telefono: '', email: '', notas: '', cumpleanos: '' }); setModalNuevo('nuevo'); }}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
              <p className="text-sm text-gray-500">Total clientes</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-emerald-600">
                {clientes.filter(c => c.puntos >= 400).length}
              </p>
              <p className="text-sm text-gray-500">Clientes VIP</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">
                ${clientes.reduce((sum, c) => sum + c.totalGastado, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total ingresos</p>
            </div>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {clientesFiltrados.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron clientes</p>
                </div>
              ) : (
                clientesFiltrados.map(cliente => {
                  const nivel = getNivelCliente(cliente.puntos);
                  return (
                    <div
                      key={cliente._id}
                      onClick={() => setClienteSeleccionado(cliente)}
                      className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        clienteSeleccionado?._id === cliente._id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-600 font-bold text-lg">
                          {cliente.nombre.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{cliente.nombre}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white ${nivel.color}`}>
                            {nivel.nivel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{cliente.telefono}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{cliente.totalCitas} citas</p>
                        <p className="text-xs text-gray-500">${cliente.totalGastado.toLocaleString()}</p>
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
              {/* Header del cliente */}
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white relative">
                <button
                  onClick={() => setClienteSeleccionado(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 lg:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {clienteSeleccionado.nombre.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{clienteSeleccionado.nombre}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getNivelCliente(clienteSeleccionado.puntos).color} text-white`}>
                        {getNivelCliente(clienteSeleccionado.puntos).nivel}
                      </span>
                      <span className="text-emerald-100">{clienteSeleccionado.puntos} puntos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info del cliente */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">{clienteSeleccionado.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 truncate">{clienteSeleccionado.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cumpleaños</p>
                      <p className="font-medium text-gray-900">
                        {clienteSeleccionado.cumpleanos ? new Date(clienteSeleccionado.cumpleanos).toLocaleDateString('es', { day: 'numeric', month: 'long' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Última cita</p>
                      <p className="font-medium text-gray-900">
                        {clienteSeleccionado.ultimaCita ? new Date(clienteSeleccionado.ultimaCita).toLocaleDateString('es') : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{clienteSeleccionado.totalCitas}</p>
                    <p className="text-xs text-gray-500">Citas</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-600">${clienteSeleccionado.totalGastado.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total gastado</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-bold text-amber-600">{clienteSeleccionado.puntos}</p>
                    <p className="text-xs text-gray-500">Puntos</p>
                  </div>
                </div>

                {/* Notas */}
                {clienteSeleccionado.notas && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Notas</span>
                    </div>
                    <p className="text-sm text-amber-700">{clienteSeleccionado.notas}</p>
                  </div>
                )}

                {/* Botón editar */}
                <button
                  onClick={() => abrirEditar(clienteSeleccionado)}
                  className="w-full py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Editar cliente
                </button>
              </div>
            </div>

            {/* Historial de citas */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">Historial de citas</h4>
              </div>
              <div className="divide-y divide-gray-50">
                {clienteSeleccionado.historial?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Sin historial</div>
                ) : (
                  clienteSeleccionado.historial?.map((cita, index) => (
                    <div key={index} className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cita.servicio}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(cita.fecha).toLocaleDateString('es')} • {cita.especialista}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-600">${cita.monto}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal nuevo/editar cliente */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalNuevo === 'nuevo' ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h2>
              <button 
                onClick={() => setModalNuevo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  placeholder="809-555-0000"
                  value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cumpleaños</label>
                <input
                  type="date"
                  value={form.cumpleanos}
                  onChange={(e) => setForm({...form, cumpleanos: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas / Preferencias</label>
                <textarea
                  placeholder="Alergias, preferencias, notas importantes..."
                  value={form.notas}
                  onChange={(e) => setForm({...form, notas: e.target.value})}
                  rows={3}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModalNuevo(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCliente}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Clientes;

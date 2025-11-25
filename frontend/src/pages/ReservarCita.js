import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Check, ChevronRight, Star, Phone, Mail } from 'lucide-react';
import api from '../services/api';

const ReservarCita = () => {
  const { servicioId } = useParams();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState(null);
  const [especialistas, setEspecialistas] = useState([]);
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Selecciones
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [datosCliente, setDatosCliente] = useState({ nombre: '', telefono: '', email: '' });
  const [enviando, setEnviando] = useState(false);

  // Generar próximos 14 días
  const generarDias = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };
  const diasDisponibles = generarDias();

  useEffect(() => {
    cargarServicio();
    // eslint-disable-next-line
  }, [servicioId]);

  useEffect(() => {
    if (especialistaSeleccionado && fechaSeleccionada) {
      cargarDisponibilidad();
    }
    // eslint-disable-next-line
  }, [especialistaSeleccionado, fechaSeleccionada]);

  const cargarServicio = async () => {
    try {
      const [servRes, espRes] = await Promise.all([
        api.get(`/servicios/${servicioId}`),
        api.get('/especialistas', { params: { activo: true } })
      ]);
      setServicio(servRes.data);
      setEspecialistas(espRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDisponibilidad = async () => {
    try {
      const fechaStr = fechaSeleccionada.toISOString().split('T')[0];
      const response = await api.get(`/especialistas/${especialistaSeleccionado._id}/disponibilidad`, {
        params: { fecha: fechaStr, duracion: servicio.duracion }
      });
      setHorasDisponibles(response.data.horasDisponibles || []);
    } catch (error) {
      console.error('Error:', error);
      setHorasDisponibles([]);
    }
  };

  const confirmarCita = async () => {
    setEnviando(true);
    try {
      const clienteId = localStorage.getItem('clienteId') || `cliente_${Date.now()}`;
      localStorage.setItem('clienteId', clienteId);

      await api.post('/citas', {
        clienteId,
        nombreCliente: datosCliente.nombre,
        telefono: datosCliente.telefono,
        email: datosCliente.email,
        fechaCita: fechaSeleccionada.toISOString().split('T')[0],
        horaInicio: horaSeleccionada,
        especialistaId: especialistaSeleccionado._id,
        servicios: [{ servicioId: servicio._id }]
      });

      navigate('/mis-citas', { state: { mensaje: '¡Cita reservada con éxito!' } });
    } catch (error) {
      alert('Error al reservar: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setEnviando(false);
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-2">{servicio?.nombre}</h1>
        <div className="flex items-center gap-4 mt-1 text-pink-100">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {servicio?.duracion} min</span>
          <span className="font-bold text-white">${servicio?.precio}</span>
        </div>
      </div>

      {/* Pasos */}
      <div className="flex justify-center gap-2 p-4">
        {[1, 2, 3, 4].map(p => (
          <div key={p} className={`w-3 h-3 rounded-full ${paso >= p ? 'bg-pink-500' : 'bg-gray-300'}`} />
        ))}
      </div>

      <div className="px-4 pb-24">
        {/* Paso 1: Especialista */}
        {paso === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Elige tu especialista</h2>
            <div className="space-y-3">
              {especialistas.map(esp => (
                <div
                  key={esp._id}
                  onClick={() => { setEspecialistaSeleccionado(esp); setPaso(2); }}
                  className={`bg-white p-4 rounded-xl shadow cursor-pointer flex items-center gap-4 ${
                    especialistaSeleccionado?._id === esp._id ? 'ring-2 ring-pink-500' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: esp.color || '#EC4899' }}>
                    {esp.nombre[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{esp.nombre} {esp.apellido}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      <Star className="w-4 h-4 fill-current" /> {esp.calificacionPromedio || 5}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Fecha */}
        {paso === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Selecciona fecha</h2>
            <div className="grid grid-cols-4 gap-2">
              {diasDisponibles.map((dia, i) => {
                const esHoy = i === 0;
                const nombreDia = dia.toLocaleDateString('es', { weekday: 'short' });
                const numDia = dia.getDate();
                const seleccionado = fechaSeleccionada?.toDateString() === dia.toDateString();
                
                return (
                  <button
                    key={i}
                    onClick={() => { setFechaSeleccionada(dia); setHoraSeleccionada(null); setPaso(3); }}
                    className={`p-3 rounded-xl text-center ${
                      seleccionado 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                        : 'bg-white shadow'
                    }`}
                  >
                    <div className="text-xs uppercase">{esHoy ? 'Hoy' : nombreDia}</div>
                    <div className="text-xl font-bold">{numDia}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Paso 3: Hora */}
        {paso === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Selecciona hora</h2>
            {horasDisponibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay horarios disponibles para esta fecha
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {horasDisponibles.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => { setHoraSeleccionada(slot.hora); setPaso(4); }}
                    className={`p-3 rounded-xl text-center ${
                      horaSeleccionada === slot.hora
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-white shadow'
                    }`}
                  >
                    {slot.hora}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paso 4: Datos */}
        {paso === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tus datos</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nombre completo</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={datosCliente.nombre}
                    onChange={(e) => setDatosCliente({...datosCliente, nombre: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Teléfono</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={datosCliente.telefono}
                    onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="04XX-XXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email (opcional)</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={datosCliente.email}
                    onChange={(e) => setDatosCliente({...datosCliente, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-6 bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-3">Resumen de tu cita</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Servicio</span>
                  <span>{servicio?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Especialista</span>
                  <span>{especialistaSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha</span>
                  <span>{fechaSeleccionada?.toLocaleDateString('es')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hora</span>
                  <span>{horaSeleccionada}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-pink-600">${servicio?.precio}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones navegación */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg">
        <div className="flex gap-3">
          {paso > 1 && (
            <button
              onClick={() => setPaso(paso - 1)}
              className="flex-1 py-3 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold"
            >
              Atrás
            </button>
          )}
          {paso === 4 && (
            <button
              onClick={confirmarCita}
              disabled={!datosCliente.nombre || !datosCliente.telefono || enviando}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {enviando ? 'Reservando...' : <><Check className="w-5 h-5" /> Confirmar Cita</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservarCita;

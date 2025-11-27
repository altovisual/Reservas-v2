import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, User, Check, ChevronRight, Star, Phone, Mail, Gift, FileText, Upload, Building, Smartphone, Copy, CheckCircle, Banknote } from 'lucide-react';
import api from '../services/api';
import { useTasaBcv } from '../context/TasaBcvContext';

const ReservarCita = () => {
  const { servicioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tasa, formatearBs } = useTasaBcv();
  const [servicio, setServicio] = useState(null);
  const [especialistas, setEspecialistas] = useState([]);
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Datos de reagendado
  const reagendarData = location.state?.reagendar ? location.state : null;
  
  // Selecciones
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [datosCliente, setDatosCliente] = useState({ nombre: '', telefono: '', email: '', cumpleanos: '', notas: '' });
  const [enviando, setEnviando] = useState(false);
  
  // Pago
  const [metodoPago, setMetodoPago] = useState('');
  const [datosPago, setDatosPago] = useState({ referencia: '', telefonoPago: '', banco: '' });
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState('');
  const [copiado, setCopiado] = useState('');
  
  // Datos del negocio para pagos
  const datosNegocio = {
    pagoMovil: { banco: 'Banesco', telefono: '0424-5551234', cedula: 'V-12345678' },
    transferencia: { banco: 'Banesco', cuenta: '0134-0000-00-0000000000', titular: 'Nail Spa C.A.', rif: 'J-12345678-9' }
  };

  // Estado para días disponibles
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  
  // Disponibilidad de especialistas para hoy/mañana
  const [disponibilidadEspecialistas, setDisponibilidadEspecialistas] = useState({});

  // Cargar horarios configurados y generar días disponibles
  const cargarHorariosYDias = async () => {
    try {
      const response = await api.get('/horarios');
      const horarios = response.data;
      
      // Generar próximos 14 días con info de disponibilidad
      const dias = [];
      const hoy = new Date();
      
      for (let i = 0; i < 14; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        const diaSemana = fecha.getDay();
        const horarioDia = horarios.find(h => h.diaSemana === diaSemana);
        
        dias.push({
          fecha,
          disponible: horarioDia?.activo ?? false,
          horario: horarioDia
        });
      }
      
      setDiasDisponibles(dias);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      // Fallback: todos los días disponibles excepto domingo
      const dias = [];
      const hoy = new Date();
      for (let i = 0; i < 14; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        dias.push({
          fecha,
          disponible: fecha.getDay() !== 0, // Domingo cerrado por defecto
          horario: null
        });
      }
      setDiasDisponibles(dias);
    }
  };

  useEffect(() => {
    cargarServicio();
    cargarDatosCliente();
    cargarHorariosYDias();
    cargarDisponibilidadHoy();
    // eslint-disable-next-line
  }, [servicioId]);
  
  // Cargar disponibilidad de hoy para mostrar en la lista de especialistas
  const cargarDisponibilidadHoy = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await api.get(`/horarios/disponibilidad/${hoy}`, {
        params: { duracion: 60 }
      });
      
      if (response.data.especialistas) {
        const disponibilidad = {};
        response.data.especialistas.forEach(esp => {
          disponibilidad[esp.especialista._id] = esp.horariosDisponibles || 0;
        });
        setDisponibilidadEspecialistas(disponibilidad);
      }
    } catch (error) {
      console.log('No se pudo cargar disponibilidad de hoy');
    }
  };

  // Precargar datos del cliente si está logueado
  const cargarDatosCliente = () => {
    const clienteData = localStorage.getItem('clienteData');
    if (clienteData) {
      try {
        const cliente = JSON.parse(clienteData);
        setDatosCliente({
          nombre: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim(),
          telefono: cliente.telefono || '',
          email: cliente.email || '',
          cumpleanos: cliente.fechaNacimiento ? cliente.fechaNacimiento.split('T')[0] : '',
          notas: cliente.preferencias?.notasPreferencias || cliente.notas || ''
        });
      } catch (e) {
        console.error('Error al cargar datos del cliente:', e);
      }
    }
  };

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
      const duracion = servicio?.duracion || 60;
      
      // Usar el nuevo endpoint de disponibilidad por especialista
      const response = await api.get(`/horarios/disponibilidad/${fechaStr}`, {
        params: { duracion }
      });
      
      if (!response.data.especialistas) {
        setHorasDisponibles([]);
        return;
      }
      
      // Buscar el especialista seleccionado en la respuesta
      const espData = response.data.especialistas.find(
        e => e.especialista._id === especialistaSeleccionado._id
      );
      
      if (espData && espData.horarios) {
        // Convertir a formato esperado
        const horas = espData.horarios.map(h => ({
          hora: h.hora,
          horaFin: h.horaFin,
          disponibles: 1
        }));
        setHorasDisponibles(horas);
      } else {
        setHorasDisponibles([]);
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      setHorasDisponibles([]);
    }
  };

  const confirmarCita = async () => {
    setEnviando(true);
    try {
      const clienteId = localStorage.getItem('clienteId') || `cliente_${Date.now()}`;
      localStorage.setItem('clienteId', clienteId);

      // Si es reagendado, usar endpoint diferente
      if (reagendarData?.citaId) {
        await api.post(`/citas/${reagendarData.citaId}/reagendar`, {
          fechaCita: fechaSeleccionada.toISOString().split('T')[0],
          horaInicio: horaSeleccionada,
          horaFin: calcularHoraFin(horaSeleccionada, servicio?.duracion || 60),
          especialistaId: especialistaSeleccionado._id
        });
        navigate('/mis-citas', { state: { mensaje: '¡Cita reagendada con éxito!' } });
        return;
      }

      // Crear la cita
      const citaResponse = await api.post('/citas', {
        clienteId,
        nombreCliente: datosCliente.nombre,
        telefono: datosCliente.telefono,
        email: datosCliente.email,
        fechaCita: fechaSeleccionada.toISOString().split('T')[0],
        horaInicio: horaSeleccionada,
        especialistaId: especialistaSeleccionado._id,
        servicios: [{ servicioId: servicio._id }],
        metodoPago: metodoPago,
        pagado: metodoPago === 'efectivo' ? false : false, // Se confirma después
        referenciaPago: datosPago.referencia || null
      });

      // Si pagó con pago móvil o transferencia, registrar el pago
      if (metodoPago !== 'efectivo' && citaResponse.data._id) {
        const formData = new FormData();
        formData.append('citaId', citaResponse.data._id);
        formData.append('clienteId', clienteId);
        formData.append('monto', servicio.precio);
        formData.append('metodoPago', metodoPago);
        formData.append('referencia', datosPago.referencia);
        if (comprobante) {
          formData.append('comprobante', comprobante);
        }
        // El pago se registra para verificación
      }

      navigate('/mis-citas', { state: { mensaje: '¡Cita reservada con éxito!' } });
    } catch (error) {
      alert('Error al reservar: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setEnviando(false);
    }
  };

  // Calcular hora de fin basada en duración
  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracionMinutos;
    const horaFin = Math.floor(totalMinutos / 60);
    const minFin = totalMinutos % 60;
    return `${horaFin.toString().padStart(2, '0')}:${minFin.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const pasos = [
    { num: 1, titulo: 'Especialista' },
    { num: 2, titulo: 'Fecha' },
    { num: 3, titulo: 'Hora' },
    { num: 4, titulo: 'Datos' },
    { num: 5, titulo: 'Pago' }
  ];
  
  const copiarAlPortapapeles = (texto, campo) => {
    navigator.clipboard.writeText(texto);
    setCopiado(campo);
    setTimeout(() => setCopiado(''), 2000);
  };
  
  const handleComprobante = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComprobante(file);
      const reader = new FileReader();
      reader.onloadend = () => setComprobantePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-3">{servicio?.nombre}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" /> {servicio?.duracion} min
          </span>
          <div className="text-right">
            <span className="font-bold text-lg">${servicio?.precio}</span>
            {tasa && <span className="text-sm opacity-80 ml-1">({formatearBs(servicio?.precio)})</span>}
          </div>
        </div>
      </div>

      {/* Pasos - Diseño compacto horizontal */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            {pasos.map((p, i) => (
              <React.Fragment key={p.num}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    paso > p.num 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                      : paso === p.num 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {paso > p.num ? <Check className="w-4 h-4" /> : p.num}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium transition-colors ${
                    paso >= p.num ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {p.titulo}
                  </span>
                </div>
                {i < pasos.length - 1 && (
                  <div className="flex-1 mx-1 h-[2px] rounded-full relative overflow-hidden bg-gray-200">
                    <div 
                      className={`absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ${
                        paso > p.num ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-40">
        {/* Paso 1: Especialista */}
        {paso === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Elige tu especialista</h2>
            <div className="space-y-3">
              {especialistas.map(esp => (
                <div
                  key={esp._id}
                  onClick={() => { setEspecialistaSeleccionado(esp); setPaso(2); }}
                  className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.99] ${
                    especialistaSeleccionado?._id === esp._id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: esp.color || '#10B981' }}>
                    {esp.foto ? (
                      <img src={esp.foto} alt={esp.nombre} className="w-full h-full object-cover rounded-2xl" />
                    ) : esp.nombre[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{esp.nombre} {esp.apellido}</h3>
                    <div className="flex items-center gap-1 text-amber-500 text-sm mt-0.5">
                      <Star className="w-4 h-4 fill-current" /> 
                      <span className="font-medium">{esp.calificacionPromedio || 5}</span>
                      <span className="text-gray-400 ml-1">• {esp.citasCompletadas || 0} citas</span>
                    </div>
                    {/* Mostrar disponibilidad de hoy */}
                    {disponibilidadEspecialistas[esp._id] !== undefined && (
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        disponibilidadEspecialistas[esp._id] > 0 ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {disponibilidadEspecialistas[esp._id] > 0 
                          ? `${disponibilidadEspecialistas[esp._id]} horarios hoy`
                          : 'Sin disponibilidad hoy'
                        }
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Fecha */}
        {paso === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona fecha</h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {diasDisponibles.map((diaInfo, i) => {
                const dia = diaInfo.fecha;
                const disponible = diaInfo.disponible;
                const esHoy = i === 0;
                const nombreDia = dia.toLocaleDateString('es', { weekday: 'short' });
                const numDia = dia.getDate();
                const mes = dia.toLocaleDateString('es', { month: 'short' });
                const seleccionado = fechaSeleccionada?.toDateString() === dia.toDateString();
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (disponible) {
                        setFechaSeleccionada(dia);
                        setHoraSeleccionada(null);
                        setPaso(3);
                      }
                    }}
                    disabled={!disponible}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      !disponible
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-60'
                        : seleccionado 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                          : 'bg-white shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`text-xs uppercase ${
                      !disponible ? 'text-gray-300' :
                      seleccionado ? 'text-emerald-100' : 'text-gray-400'
                    }`}>
                      {esHoy ? 'Hoy' : nombreDia}
                    </div>
                    <div className={`text-xl font-bold mt-1 ${!disponible ? 'text-gray-300' : ''}`}>{numDia}</div>
                    <div className={`text-xs ${
                      !disponible ? 'text-red-400' :
                      seleccionado ? 'text-emerald-100' : 'text-gray-400'
                    }`}>
                      {!disponible ? 'Cerrado' : mes}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Leyenda */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-500">Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-500">Cerrado</span>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Hora */}
        {paso === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona hora</h2>
            {horasDisponibles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay horarios disponibles para esta fecha</p>
                <button 
                  onClick={() => setPaso(2)}
                  className="mt-4 text-emerald-500 font-medium"
                >
                  Elegir otra fecha
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {horasDisponibles.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => { setHoraSeleccionada(slot.hora); setPaso(4); }}
                    className={`p-4 rounded-2xl text-center transition-all ${
                      horaSeleccionada === slot.hora
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-white shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    <div className="font-bold text-lg">{slot.hora}</div>
                    {slot.horaFin && (
                      <div className={`text-xs mt-1 ${
                        horaSeleccionada === slot.hora ? 'text-emerald-100' : 'text-gray-400'
                      }`}>
                        hasta {slot.horaFin}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paso 4: Datos */}
        {paso === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tus datos</h2>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={datosCliente.nombre}
                    onChange={(e) => setDatosCliente({...datosCliente, nombre: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={datosCliente.telefono}
                    onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="809-555-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={datosCliente.email}
                    onChange={(e) => setDatosCliente({...datosCliente, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de cumpleaños</label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={datosCliente.cumpleanos}
                    onChange={(e) => setDatosCliente({...datosCliente, cumpleanos: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Te enviaremos un regalo especial 🎁</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas o preferencias</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    value={datosCliente.notas}
                    onChange={(e) => setDatosCliente({...datosCliente, notas: e.target.value})}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Alergias, preferencias de colores, etc."
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                <h3 className="font-semibold text-emerald-800">Resumen de tu cita</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Servicio</span>
                  <span className="font-medium text-gray-900">{servicio?.nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Especialista</span>
                  <span className="font-medium text-gray-900">{especialistaSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium text-gray-900">
                    {fechaSeleccionada?.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-medium text-gray-900">{horaSeleccionada}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-semibold text-gray-900">Total a pagar</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-600">${servicio?.precio}</span>
                    {tasa && (
                      <p className="text-sm text-gray-500">{formatearBs(servicio?.precio)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 5: Pago */}
        {paso === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h2>
            
            {/* Selección de método */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMetodoPago('pago_movil')}
                className={`flex-1 py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
                  metodoPago === 'pago_movil' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-medium">Pago Móvil</span>
              </button>
              <button
                onClick={() => setMetodoPago('transferencia')}
                className={`flex-1 py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
                  metodoPago === 'transferencia' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                <Building className="w-5 h-5" />
                <span className="text-xs font-medium">Transferencia</span>
              </button>
              <button
                onClick={() => setMetodoPago('efectivo')}
                className={`flex-1 py-3 px-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
                  metodoPago === 'efectivo' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-medium">Efectivo</span>
              </button>
            </div>
            
            {/* Mensaje para pago en efectivo */}
            {metodoPago === 'efectivo' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Pago en el local</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Pagarás <span className="font-bold">${servicio?.precio}</span>
                      {tasa && <span className="font-bold"> ({formatearBs(servicio?.precio)})</span>} al momento de tu cita. 
                      Aceptamos efectivo en Bolívares o Dólares.
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Por favor llega 5 minutos antes de tu cita
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Datos para Pago Móvil */}
            {metodoPago === 'pago_movil' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-500" /> Datos para Pago Móvil
                </h3>
                <div className="space-y-3 bg-emerald-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Banco:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{datosNegocio.pagoMovil.banco}</span>
                      <button onClick={() => copiarAlPortapapeles(datosNegocio.pagoMovil.banco, 'banco')} className="p-1 hover:bg-emerald-100 rounded">
                        {copiado === 'banco' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Teléfono:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{datosNegocio.pagoMovil.telefono}</span>
                      <button onClick={() => copiarAlPortapapeles(datosNegocio.pagoMovil.telefono, 'telefono')} className="p-1 hover:bg-emerald-100 rounded">
                        {copiado === 'telefono' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cédula:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{datosNegocio.pagoMovil.cedula}</span>
                      <button onClick={() => copiarAlPortapapeles(datosNegocio.pagoMovil.cedula, 'cedula')} className="p-1 hover:bg-emerald-100 rounded">
                        {copiado === 'cedula' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                    <span className="text-gray-600">Monto:</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-lg">${servicio?.precio}</span>
                      {tasa && <p className="text-xs text-emerald-500">{formatearBs(servicio?.precio)}</p>}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de referencia *</label>
                  <input
                    type="text"
                    value={datosPago.referencia}
                    onChange={(e) => setDatosPago({...datosPago, referencia: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Últimos 6 dígitos"
                  />
                </div>
              </div>
            )}

            {/* Datos para Transferencia */}
            {metodoPago === 'transferencia' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" /> Datos para Transferencia
                </h3>
                <div className="space-y-3 bg-emerald-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Banco:</span>
                    <span className="font-medium">{datosNegocio.transferencia.banco}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cuenta:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{datosNegocio.transferencia.cuenta}</span>
                      <button onClick={() => copiarAlPortapapeles(datosNegocio.transferencia.cuenta, 'cuenta')} className="p-1 hover:bg-emerald-100 rounded">
                        {copiado === 'cuenta' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Titular:</span>
                    <span className="font-medium">{datosNegocio.transferencia.titular}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RIF:</span>
                    <span className="font-medium">{datosNegocio.transferencia.rif}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                    <span className="text-gray-600">Monto:</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-lg">${servicio?.precio}</span>
                      {tasa && <p className="text-xs text-emerald-500">{formatearBs(servicio?.precio)}</p>}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de referencia *</label>
                  <input
                    type="text"
                    value={datosPago.referencia}
                    onChange={(e) => setDatosPago({...datosPago, referencia: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Número de referencia"
                  />
                </div>
              </div>
            )}

            {/* Subir comprobante */}
            {metodoPago && (
              <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">Comprobante de pago *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleComprobante}
                    className="hidden"
                    id="comprobante"
                  />
                  <label
                    htmlFor="comprobante"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors bg-gray-50"
                  >
                    {comprobantePreview ? (
                      <img src={comprobantePreview} alt="Comprobante" className="h-full object-contain rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Toca para subir imagen</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones navegación */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg shadow-black/5">
        <div className="flex gap-3 max-w-lg mx-auto">
          {paso > 1 && (
            <button
              onClick={() => setPaso(paso - 1)}
              className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {paso === 4 && (
            <button
              onClick={() => setPaso(5)}
              disabled={!datosCliente.nombre || !datosCliente.telefono}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-400 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              Continuar al Pago <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {paso === 5 && (
            <button
              onClick={confirmarCita}
              disabled={!metodoPago || (metodoPago !== 'efectivo' && (!datosPago.referencia || !comprobante)) || enviando}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-400 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" /> Confirmar Reserva
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservarCita;

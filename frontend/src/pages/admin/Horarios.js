import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, ChevronLeft, ChevronRight, Users, AlertCircle, Check, X, Settings } from 'lucide-react';
import api from '../../services/api';

const Horarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [resumenMes, setResumenMes] = useState([]);
  const [cuposDelDia, setCuposDelDia] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [tab, setTab] = useState('configuracion'); // 'configuracion' o 'calendario'

  useEffect(() => {
    cargarHorarios();
  }, []);

  useEffect(() => {
    if (tab === 'calendario') {
      cargarResumenMes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesActual, tab]);

  const cargarHorarios = async () => {
    try {
      const response = await api.get('/horarios');
      setHorarios(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenMes = async () => {
    try {
      const mes = mesActual.getMonth() + 1;
      const anio = mesActual.getFullYear();
      const response = await api.get(`/horarios/resumen/${mes}/${anio}`);
      setResumenMes(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarCuposDelDia = async (fecha) => {
    try {
      setFechaSeleccionada(fecha);
      const response = await api.get(`/horarios/cupos/${fecha}`);
      setCuposDelDia(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const actualizarHorario = (diaSemana, campo, valor) => {
    setHorarios(prev => prev.map(h => 
      h.diaSemana === diaSemana ? { ...h, [campo]: valor } : h
    ));
  };

  const guardarHorarios = async () => {
    setGuardando(true);
    try {
      for (const horario of horarios) {
        await api.put(`/horarios/${horario.diaSemana}`, horario);
      }
      setMensaje({ tipo: 'exito', texto: 'Horarios guardados correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar horarios' });
    } finally {
      setGuardando(false);
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
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= diasEnMes; i++) {
      const fechaStr = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const info = resumenMes.find(r => r.fecha === fechaStr);
      dias.push({ dia: i, fecha: fechaStr, info });
    }
    
    return dias;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Horarios</h1>
        <p className="text-gray-500">Configura los días y horarios disponibles para citas</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {mensaje.tipo === 'exito' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {mensaje.texto}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('configuracion')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            tab === 'configuracion' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuración Semanal
        </button>
        <button
          onClick={() => setTab('calendario')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            tab === 'calendario' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Ver Disponibilidad
        </button>
      </div>

      {tab === 'configuracion' ? (
        /* Configuración de horarios semanales */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Horarios por Día
            </h2>
            <button
              onClick={guardarHorarios}
              disabled={guardando}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {horarios.map((horario) => (
              <div key={horario.diaSemana} className={`p-4 ${!horario.activo ? 'bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Día y toggle */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={horario.activo}
                        onChange={(e) => actualizarHorario(horario.diaSemana, 'activo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    <span className={`font-medium ${horario.activo ? 'text-gray-800' : 'text-gray-400'}`}>
                      {horario.nombreDia}
                    </span>
                  </div>

                  {horario.activo && (
                    <>
                      {/* Horario de atención */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Horario:</span>
                        <input
                          type="time"
                          value={horario.horaApertura}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'horaApertura', e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="text-gray-400">a</span>
                        <input
                          type="time"
                          value={horario.horaCierre}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'horaCierre', e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>

                      {/* Almuerzo */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Almuerzo:</span>
                        <input
                          type="time"
                          value={horario.inicioAlmuerzo}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'inicioAlmuerzo', e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="text-gray-400">a</span>
                        <input
                          type="time"
                          value={horario.finAlmuerzo}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'finAlmuerzo', e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>

                      {/* Cupos por hora */}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Cupos/hora:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={horario.cuposPorHora}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'cuposPorHora', parseInt(e.target.value))}
                          className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>

                      {/* Intervalo */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Intervalo:</span>
                        <select
                          value={horario.intervalo}
                          onChange={(e) => actualizarHorario(horario.diaSemana, 'intervalo', parseInt(e.target.value))}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      </div>
                    </>
                  )}

                  {!horario.activo && (
                    <span className="text-gray-400 italic">Cerrado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Calendario de disponibilidad */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {/* Navegación del mes */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => cambiarMes(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-lg">
                {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => cambiarMes(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
                <div key={dia} className="text-center text-sm font-medium text-gray-500 py-2">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {generarCalendario().map((item, index) => (
                <div key={index}>
                  {item ? (
                    <button
                      onClick={() => cargarCuposDelDia(item.fecha)}
                      className={`w-full aspect-square p-1 rounded-lg text-sm transition-all ${
                        item.info?.cerrado 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : fechaSeleccionada === item.fecha
                            ? 'bg-emerald-500 text-white'
                            : 'hover:bg-emerald-50'
                      }`}
                      disabled={item.info?.cerrado}
                    >
                      <div className="font-medium">{item.dia}</div>
                      {item.info && !item.info.cerrado && (
                        <div className={`text-xs mt-1 ${
                          fechaSeleccionada === item.fecha ? 'text-emerald-100' :
                          item.info.porcentajeOcupacion >= 80 ? 'text-red-500' :
                          item.info.porcentajeOcupacion >= 50 ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>
                          {item.info.cuposDisponibles} disp.
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="aspect-square"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Medio lleno</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Casi lleno</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Cerrado</span>
              </div>
            </div>
          </div>

          {/* Detalle del día */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Cupos del Día
            </h3>

            {!cuposDelDia ? (
              <div className="text-center text-gray-400 py-8">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona un día para ver los cupos</p>
              </div>
            ) : !cuposDelDia.disponible ? (
              <div className="text-center text-gray-400 py-8">
                <X className="w-12 h-12 mx-auto mb-2 text-red-300" />
                <p>{cuposDelDia.mensaje}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cuposDelDia.cupos.map((cupo, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      cupo.estado === 'pasado' ? 'bg-gray-100 text-gray-400' :
                      cupo.estado === 'ocupado' ? 'bg-red-50' :
                      'bg-emerald-50'
                    }`}
                  >
                    <span className="font-medium">{cupo.hora}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        cupo.estado === 'pasado' ? 'text-gray-400' :
                        cupo.estado === 'ocupado' ? 'text-red-600' :
                        'text-emerald-600'
                      }`}>
                        {cupo.estado === 'pasado' ? 'Pasado' :
                         cupo.estado === 'ocupado' ? 'Lleno' :
                         `${cupo.disponibles}/${cupo.total}`}
                      </span>
                      {cupo.estado === 'disponible' && (
                        <div className="flex">
                          {[...Array(cupo.total)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mx-0.5 ${
                                i < cupo.ocupados ? 'bg-red-400' : 'bg-emerald-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Horarios;

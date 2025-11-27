import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Scissors,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Reportes = () => {
  const [periodo, setPeriodo] = useState('semana');
  const [loading, setLoading] = useState(true);
  const [reportes, setReportes] = useState({
    ingresos: { total: 0, anterior: 0, porDia: [] },
    citas: { total: 0, completadas: 0, canceladas: 0, pendientes: 0 },
    serviciosPopulares: [],
    especialistasTop: [],
    horariosPopulares: []
  });

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line
  }, [periodo]);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reportes?periodo=${periodo}`);
      setReportes(response.data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      // Datos de ejemplo si falla
      setReportes({
        ingresos: { 
          total: 15750, 
          anterior: 12300,
          porDia: [
            { dia: 'Lun', monto: 2100 },
            { dia: 'Mar', monto: 1800 },
            { dia: 'Mié', monto: 2400 },
            { dia: 'Jue', monto: 2200 },
            { dia: 'Vie', monto: 3100 },
            { dia: 'Sáb', monto: 4150 },
            { dia: 'Dom', monto: 0 },
          ]
        },
        citas: { total: 47, completadas: 38, canceladas: 3, pendientes: 6 },
        serviciosPopulares: [
          { nombre: 'Manicure Gel', cantidad: 23, ingresos: 4600 },
          { nombre: 'Pedicure Spa', cantidad: 18, ingresos: 5400 },
          { nombre: 'Uñas Acrílicas', cantidad: 15, ingresos: 6000 },
          { nombre: 'Nail Art', cantidad: 12, ingresos: 2400 },
          { nombre: 'Manicure Express', cantidad: 10, ingresos: 1500 },
        ],
        especialistasTop: [
          { nombre: 'María García', citas: 18, ingresos: 5400, calificacion: 4.9 },
          { nombre: 'Ana López', citas: 15, ingresos: 4500, calificacion: 4.8 },
          { nombre: 'Carmen Ruiz', citas: 14, ingresos: 4200, calificacion: 4.7 },
        ],
        horariosPopulares: [
          { hora: '10:00', citas: 8 },
          { hora: '11:00', citas: 12 },
          { hora: '12:00', citas: 6 },
          { hora: '14:00', citas: 9 },
          { hora: '15:00', citas: 11 },
          { hora: '16:00', citas: 10 },
          { hora: '17:00', citas: 7 },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return 100;
    return ((actual - anterior) / anterior * 100).toFixed(1);
  };

  const cambioIngresos = calcularCambio(reportes.ingresos.total, reportes.ingresos.anterior);
  const maxIngresoDia = Math.max(...reportes.ingresos.porDia.map(d => d.monto), 1);

  if (loading) {
    return (
      <AdminLayout title="Reportes" subtitle="Cargando estadísticas...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reportes" subtitle="Analíticas y estadísticas del negocio">
      {/* Filtro de periodo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {['hoy', 'semana', 'mes', 'año'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                periodo === p
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/reportes/exportar-pdf?periodo=${periodo}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
          <button 
            onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/reportes/exportar?periodo=${periodo}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Ingresos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              cambioIngresos >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {cambioIngresos >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {cambioIngresos}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${reportes.ingresos.total.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Ingresos totales</p>
        </div>

        {/* Citas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{reportes.citas.total}</p>
          <p className="text-gray-500 text-sm mt-1">Citas totales</p>
        </div>

        {/* Completadas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{reportes.citas.completadas}</p>
          <p className="text-gray-500 text-sm mt-1">Citas completadas</p>
        </div>

        {/* Tasa de éxito */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportes.citas.total > 0 ? Math.round((reportes.citas.completadas / reportes.citas.total) * 100) : 0}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Tasa de éxito</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de ingresos por día */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Ingresos por día</h3>
              <p className="text-sm text-gray-500">Distribución de ingresos</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {reportes.ingresos.porDia.map((dia, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(dia.monto / maxIngresoDia) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{dia.dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horarios populares */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Horarios populares</h3>
              <p className="text-sm text-gray-500">Horas con más demanda</p>
            </div>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {reportes.horariosPopulares.map((horario, index) => {
              const maxCitas = Math.max(...reportes.horariosPopulares.map(h => h.citas));
              const porcentaje = (horario.citas / maxCitas) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-14">{horario.hora}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{horario.citas}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios populares */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Servicios más populares</h3>
              <p className="text-sm text-gray-500">Top 5 servicios</p>
            </div>
            <Scissors className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {reportes.serviciosPopulares.map((servicio, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-amber-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{servicio.nombre}</p>
                  <p className="text-sm text-gray-500">{servicio.cantidad} reservas</p>
                </div>
                <p className="font-semibold text-emerald-600">${servicio.ingresos.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top especialistas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Top especialistas</h3>
              <p className="text-sm text-gray-500">Mejor rendimiento</p>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {reportes.especialistasTop.map((esp, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-emerald-500' : 
                  index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {esp.nombre.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{esp.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{esp.citas} citas</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      {esp.calificacion}
                    </span>
                  </div>
                </div>
                <p className="font-semibold text-emerald-600">${esp.ingresos.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reportes;

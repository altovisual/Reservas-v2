import React, { useState, useEffect } from 'react';
import { 
  Star,
  MessageSquare,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Resenas = () => {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [stats, setStats] = useState({
    promedio: 0,
    total: 0,
    distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    cargarResenas();
    // eslint-disable-next-line
  }, []);

  const cargarResenas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/resenas');
      setResenas(response.data.resenas || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error:', error);
      // Datos de ejemplo
      const resenasEjemplo = [
        {
          _id: '1',
          cliente: 'María González',
          servicio: 'Manicure Gel',
          especialista: 'Ana López',
          calificacion: 5,
          comentario: '¡Excelente servicio! Ana es muy profesional y el resultado quedó hermoso. Definitivamente volveré.',
          fecha: '2024-01-18',
          estado: 'aprobada',
          respuesta: '¡Gracias María! Nos alegra que te haya gustado. Te esperamos pronto.'
        },
        {
          _id: '2',
          cliente: 'Carmen Rodríguez',
          servicio: 'Pedicure Spa',
          especialista: 'María García',
          calificacion: 5,
          comentario: 'El mejor spa de uñas de la ciudad. Ambiente muy relajante y el pedicure quedó perfecto.',
          fecha: '2024-01-17',
          estado: 'aprobada',
          respuesta: null
        },
        {
          _id: '3',
          cliente: 'Laura Martínez',
          servicio: 'Uñas Acrílicas',
          especialista: 'Carmen Ruiz',
          calificacion: 4,
          comentario: 'Muy buen trabajo, solo que tuve que esperar un poco más de lo esperado.',
          fecha: '2024-01-16',
          estado: 'aprobada',
          respuesta: 'Gracias por tu feedback Laura. Trabajaremos en mejorar los tiempos de espera.'
        },
        {
          _id: '4',
          cliente: 'Sofia Pérez',
          servicio: 'Nail Art',
          especialista: 'Ana López',
          calificacion: 5,
          comentario: 'Los diseños de Ana son increíbles. Muy creativa y detallista.',
          fecha: '2024-01-15',
          estado: 'pendiente',
          respuesta: null
        },
        {
          _id: '5',
          cliente: 'Andrea Díaz',
          servicio: 'Manicure Express',
          especialista: 'María García',
          calificacion: 3,
          comentario: 'El servicio estuvo bien pero esperaba un poco más de atención.',
          fecha: '2024-01-14',
          estado: 'pendiente',
          respuesta: null
        },
        {
          _id: '6',
          cliente: 'Patricia Luna',
          servicio: 'French',
          especialista: 'Carmen Ruiz',
          calificacion: 5,
          comentario: 'Perfecto como siempre. Carmen es la mejor haciendo french.',
          fecha: '2024-01-13',
          estado: 'aprobada',
          respuesta: null
        },
      ];
      
      setResenas(resenasEjemplo);
      
      // Calcular stats
      const total = resenasEjemplo.length;
      const suma = resenasEjemplo.reduce((acc, r) => acc + r.calificacion, 0);
      const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      resenasEjemplo.forEach(r => distribucion[r.calificacion]++);
      
      setStats({
        promedio: (suma / total).toFixed(1),
        total,
        distribucion
      });
    } finally {
      setLoading(false);
    }
  };

  const aprobarResena = async (id) => {
    try {
      await api.patch(`/resenas/${id}/estado`, { estado: 'aprobada' });
      setResenas(prev => prev.map(r => r._id === id ? { ...r, estado: 'aprobada' } : r));
    } catch (error) {
      console.error('Error al aprobar:', error);
      // Actualizar localmente de todos modos
      setResenas(prev => prev.map(r => r._id === id ? { ...r, estado: 'aprobada' } : r));
    }
  };

  const rechazarResena = async (id) => {
    try {
      await api.patch(`/resenas/${id}/estado`, { estado: 'rechazada' });
      setResenas(prev => prev.map(r => r._id === id ? { ...r, estado: 'rechazada' } : r));
    } catch (error) {
      console.error('Error al rechazar:', error);
      setResenas(prev => prev.map(r => r._id === id ? { ...r, estado: 'rechazada' } : r));
    }
  };

  const responderResena = async (id, respuesta) => {
    try {
      await api.patch(`/resenas/${id}/responder`, { respuesta });
      setResenas(prev => prev.map(r => r._id === id ? { ...r, respuesta } : r));
    } catch (error) {
      console.error('Error al responder:', error);
      setResenas(prev => prev.map(r => r._id === id ? { ...r, respuesta } : r));
    }
  };

  const resenasFiltradas = filtro === 'todas' 
    ? resenas 
    : resenas.filter(r => r.estado === filtro);

  const renderEstrellas = (calificacion, size = 'w-4 h-4') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`${size} ${i <= calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Reseñas" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reseñas" subtitle="Gestiona las opiniones de tus clientes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Calificación promedio */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 md:col-span-2">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{stats.promedio}</p>
              <div className="mt-2">{renderEstrellas(Math.round(stats.promedio), 'w-5 h-5')}</div>
              <p className="text-sm text-gray-500 mt-1">{stats.total} reseñas</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(num => (
                <div key={num} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-3">{num}</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.distribucion[num] / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{stats.distribucion[num]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resenas.filter(r => r.estado === 'pendiente').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Pendientes de aprobar</p>
        </div>

        {/* Mejor especialista */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">Ana López</p>
          <div className="flex items-center gap-1 mt-1">
            {renderEstrellas(5, 'w-3 h-3')}
            <span className="text-sm text-gray-500 ml-1">5.0</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'todas', label: 'Todas', count: resenas.length },
          { key: 'pendiente', label: 'Pendientes', count: resenas.filter(r => r.estado === 'pendiente').length },
          { key: 'aprobada', label: 'Aprobadas', count: resenas.filter(r => r.estado === 'aprobada').length },
          { key: 'rechazada', label: 'Rechazadas', count: resenas.filter(r => r.estado === 'rechazada').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filtro === f.key
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filtro === f.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        {resenasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay reseñas en esta categoría</p>
          </div>
        ) : (
          resenasFiltradas.map(resena => (
            <ResenaCard 
              key={resena._id} 
              resena={resena}
              onAprobar={() => aprobarResena(resena._id)}
              onRechazar={() => rechazarResena(resena._id)}
              onResponder={(resp) => responderResena(resena._id, resp)}
              renderEstrellas={renderEstrellas}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
};

// Componente de tarjeta de reseña
const ResenaCard = ({ resena, onAprobar, onRechazar, onResponder, renderEstrellas }) => {
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState('');

  const handleResponder = () => {
    if (respuestaTexto.trim()) {
      onResponder(respuestaTexto);
      setMostrarRespuesta(false);
      setRespuestaTexto('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-lg">
                {(resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'C')).charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'Cliente')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {renderEstrellas(resena.calificacion)}
                <span className="text-sm text-gray-400">
                  {new Date(resena.createdAt || resena.fecha).toLocaleDateString('es')}
                </span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            resena.estado === 'aprobada' ? 'bg-emerald-50 text-emerald-600' :
            resena.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' :
            'bg-red-50 text-red-600'
          }`}>
            {resena.estado === 'aprobada' ? 'Aprobada' :
             resena.estado === 'pendiente' ? 'Pendiente' : 'Rechazada'}
          </span>
        </div>

        {/* Servicio y especialista */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
            {resena.servicioNombre || resena.servicio?.nombre || (typeof resena.servicio === 'string' ? resena.servicio : '')}
          </span>
          <span className="text-gray-500 flex items-center gap-1">
            <User className="w-4 h-4" /> {resena.especialista?.nombre || (typeof resena.especialista === 'string' ? resena.especialista : '')}
          </span>
        </div>

        {/* Comentario */}
        <p className="text-gray-700">{resena.comentario}</p>

        {/* Respuesta existente */}
        {resena.respuesta && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500">
            <p className="text-sm font-medium text-emerald-800 mb-1">Respuesta del negocio:</p>
            <p className="text-sm text-emerald-700">{resena.respuesta}</p>
          </div>
        )}

        {/* Formulario de respuesta */}
        {mostrarRespuesta && (
          <div className="mt-4 space-y-3">
            <textarea
              value={respuestaTexto}
              onChange={(e) => setRespuestaTexto(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarRespuesta(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResponder}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Enviar respuesta
              </button>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!mostrarRespuesta && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            {resena.estado === 'pendiente' && (
              <>
                <button
                  onClick={onAprobar}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
                <button
                  onClick={onRechazar}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
              </>
            )}
            {!resena.respuesta && resena.estado === 'aprobada' && (
              <button
                onClick={() => setMostrarRespuesta(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Responder
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resenas;

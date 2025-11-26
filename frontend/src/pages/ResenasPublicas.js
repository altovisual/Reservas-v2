import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Quote, PenLine, X, Send, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ResenasPublicas = () => {
  const navigate = useNavigate();
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ promedio: 0, total: 0, distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [cliente] = useState(() => {
    const data = localStorage.getItem('clienteData');
    return data ? JSON.parse(data) : null;
  });
  const [formData, setFormData] = useState({
    calificacion: 5,
    comentario: '',
    servicioId: ''
  });

  useEffect(() => {
    cargarResenas();
    cargarServicios();
    // eslint-disable-next-line
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.log('Error cargando servicios');
    }
  };

  const cargarResenas = async () => {
    try {
      const response = await api.get('/resenas?estado=aprobada');
      setResenas(response.data.resenas || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      // Datos de ejemplo
      const resenasEjemplo = [
        { _id: '1', clienteNombre: 'María González', calificacion: 5, comentario: '¡Excelente servicio! Ana es muy profesional y el resultado quedó hermoso. Definitivamente volveré.', servicioNombre: 'Manicure Gel', createdAt: '2024-01-18' },
        { _id: '2', clienteNombre: 'Carmen Rodríguez', calificacion: 5, comentario: 'El mejor spa de uñas de la ciudad. Ambiente muy relajante y el pedicure quedó perfecto.', servicioNombre: 'Pedicure Spa', createdAt: '2024-01-17' },
        { _id: '3', clienteNombre: 'Laura Martínez', calificacion: 4, comentario: 'Muy buen trabajo, solo que tuve que esperar un poco más de lo esperado.', servicioNombre: 'Uñas Acrílicas', createdAt: '2024-01-16' },
        { _id: '4', clienteNombre: 'Sofia Pérez', calificacion: 5, comentario: 'Los diseños de Ana son increíbles. Muy creativa y detallista.', servicioNombre: 'Nail Art', createdAt: '2024-01-15' },
        { _id: '5', clienteNombre: 'Patricia Luna', calificacion: 5, comentario: 'Perfecto como siempre. Carmen es la mejor haciendo french.', servicioNombre: 'French', createdAt: '2024-01-13' },
        { _id: '6', clienteNombre: 'Andrea Díaz', calificacion: 4, comentario: 'Muy buena atención y el resultado fue hermoso. Recomendado.', servicioNombre: 'Manicure Express', createdAt: '2024-01-12' },
      ];
      setResenas(resenasEjemplo);
      
      const total = resenasEjemplo.length;
      const suma = resenasEjemplo.reduce((acc, r) => acc + r.calificacion, 0);
      const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      resenasEjemplo.forEach(r => distribucion[r.calificacion]++);
      setStats({ promedio: (suma / total).toFixed(1), total, distribucion });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResena = async (e) => {
    e.preventDefault();
    if (!cliente) {
      navigate('/auth');
      return;
    }
    
    setEnviando(true);
    try {
      await api.post('/resenas', {
        clienteId: cliente._id,
        servicioId: formData.servicioId || null,
        calificacion: formData.calificacion,
        comentario: formData.comentario
      });
      
      setEnviado(true);
      setFormData({ calificacion: 5, comentario: '', servicioId: '' });
      
      setTimeout(() => {
        setMostrarFormulario(false);
        setEnviado(false);
      }, 2500);
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al enviar reseña');
    } finally {
      setEnviando(false);
    }
  };

  const renderEstrellas = (calificacion, size = 'w-4 h-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${i <= calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 pb-6">
        <button onClick={() => navigate('/servicios')} className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="text-xl font-bold mt-3">Reseñas</h1>
        <p className="text-emerald-100 text-sm mt-1">Lo que dicen nuestros clientes</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{stats.promedio}</p>
              <div className="mt-2">{renderEstrellas(Math.round(parseFloat(stats.promedio)), 'w-5 h-5')}</div>
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
                  <span className="text-sm text-gray-500 w-6">{stats.distribucion[num]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botón para dejar reseña */}
      <div className="px-4 mb-4">
        <button
          onClick={() => cliente ? setMostrarFormulario(true) : navigate('/auth')}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
        >
          <PenLine className="w-5 h-5" />
          Dejar una reseña
        </button>
      </div>

      {/* Lista de reseñas */}
      <div className="px-4 pb-28 space-y-4">
        {resenas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Quote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay reseñas</p>
            <p className="text-sm mt-1">¡Sé el primero en dejar tu opinión!</p>
          </div>
        ) : (
          resenas.map(resena => (
            <div key={resena._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-lg">
                    {(resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'A')).charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'Cliente')}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(resena.createdAt || resena.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderEstrellas(resena.calificacion, 'w-4 h-4')}
                  </div>
                  <div className="mt-3 relative">
                    <Quote className="absolute -left-1 -top-1 w-6 h-6 text-emerald-100" />
                    <p className="text-gray-600 pl-4">{resena.comentario}</p>
                  </div>
                  <p className="text-xs text-emerald-600 mt-3 font-medium">
                    {resena.servicioNombre || resena.servicio?.nombre || resena.servicio || ''}
                  </p>
                  
                  {/* Respuesta del negocio */}
                  {resena.respuesta && (
                    <div className="mt-3 bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Respuesta de Nail Spa:</p>
                      <p className="text-sm text-emerald-800">{resena.respuesta}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para crear reseña */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center pb-10 sm:pb-0">
          <div 
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {enviado ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">¡Gracias por tu reseña!</h3>
                <p className="text-gray-500 mt-2">Será publicada después de ser revisada.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Dejar una reseña</h3>
                  <button 
                    onClick={() => setMostrarFormulario(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmitResena} className="p-4 pb-8 space-y-5">
                  {/* Calificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      ¿Cómo calificarías tu experiencia?
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, calificacion: num })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-10 h-10 transition-colors ${
                              num <= formData.calificacion 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-200 hover:text-amber-200'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {formData.calificacion === 5 && '¡Excelente!'}
                      {formData.calificacion === 4 && 'Muy bueno'}
                      {formData.calificacion === 3 && 'Bueno'}
                      {formData.calificacion === 2 && 'Regular'}
                      {formData.calificacion === 1 && 'Malo'}
                    </p>
                  </div>

                  {/* Servicio (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Servicio (opcional)
                    </label>
                    <select
                      value={formData.servicioId}
                      onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Selecciona un servicio</option>
                      {servicios.map(s => (
                        <option key={s._id} value={s._id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comentario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tu comentario *
                    </label>
                    <textarea
                      value={formData.comentario}
                      onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                      placeholder="Cuéntanos tu experiencia..."
                      rows={4}
                      maxLength={500}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {formData.comentario.length}/500
                    </p>
                  </div>

                  {/* Botón enviar */}
                  <button
                    type="submit"
                    disabled={enviando || !formData.comentario.trim()}
                    className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar reseña
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ResenasPublicas;

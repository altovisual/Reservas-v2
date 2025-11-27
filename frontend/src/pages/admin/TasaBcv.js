import React, { useState } from 'react';
import { RefreshCw, DollarSign, TrendingUp, Clock, AlertCircle, Check, Edit3 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useTasaBcv } from '../../context/TasaBcvContext';

const TasaBcv = () => {
  const { 
    tasa, 
    fecha, 
    fuente, 
    loading, 
    error, 
    actualizarTasa, 
    establecerTasaManual,
    convertirABolivares 
  } = useTasaBcv();
  
  const [editando, setEditando] = useState(false);
  const [tasaManual, setTasaManual] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleActualizar = async () => {
    setActualizando(true);
    setMensaje(null);
    try {
      await actualizarTasa();
      setMensaje({ tipo: 'success', texto: 'Tasa actualizada correctamente' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar la tasa' });
    } finally {
      setActualizando(false);
    }
  };

  const handleGuardarManual = async () => {
    if (!tasaManual || isNaN(tasaManual)) {
      setMensaje({ tipo: 'error', texto: 'Ingresa una tasa válida' });
      return;
    }
    
    setActualizando(true);
    try {
      await establecerTasaManual(parseFloat(tasaManual));
      setMensaje({ tipo: 'success', texto: 'Tasa establecida manualmente' });
      setEditando(false);
      setTasaManual('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al establecer la tasa' });
    } finally {
      setActualizando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No disponible';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ejemplos de conversión
  const ejemplos = [10, 25, 50, 100];

  return (
    <AdminLayout title="Tasa BCV" subtitle="Gestión del tipo de cambio oficial">
      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {mensaje.tipo === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {mensaje.texto}
        </div>
      )}

      {/* Tarjeta principal de la tasa */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Tasa BCV Oficial</p>
            <div className="flex items-baseline gap-2 mt-2">
              {loading ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-5xl font-bold">{tasa?.toFixed(2) || '--'}</span>
                  <span className="text-2xl text-emerald-100">Bs/$</span>
                </>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Actualizado: {formatearFecha(fecha)}</span>
            </div>
            {fuente && (
              <div className="mt-1 text-emerald-200 text-xs">
                Fuente: {fuente}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={handleActualizar}
              disabled={actualizando}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-6 h-6 ${actualizando ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setEditando(!editando); setTasaManual(tasa?.toString() || ''); }}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Edit3 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-amber-500/20 rounded-xl flex items-center gap-2 text-amber-100">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Edición manual */}
      {editando && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-500" />
            Establecer tasa manualmente
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Usa esta opción si la API no está disponible o necesitas ajustar la tasa.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                value={tasaManual}
                onChange={(e) => setTasaManual(e.target.value)}
                placeholder="Ej: 45.50"
                className="w-full pl-10 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">Bs/$</span>
            </div>
            <button
              onClick={handleGuardarManual}
              disabled={actualizando}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditando(false)}
              className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Calculadora de conversión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Ejemplos de conversión
          </h3>
          <div className="space-y-3">
            {ejemplos.map(monto => (
              <div key={monto} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-700">${monto} USD</span>
                <span className="text-emerald-600 font-bold">
                  {convertirABolivares(monto).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Información
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="font-medium text-blue-700 mb-1">Actualización automática</p>
              <p className="text-blue-600">La tasa se actualiza automáticamente cada 30 minutos desde el BCV.</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="font-medium text-amber-700 mb-1">Ubicación</p>
              <p className="text-amber-600">Los precios se muestran en bolívares para clientes en Yaracuy, Venezuela.</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="font-medium text-emerald-700 mb-1">Precios en servicios</p>
              <p className="text-emerald-600">Los clientes verán el precio en USD y su equivalente en Bs automáticamente.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TasaBcv;

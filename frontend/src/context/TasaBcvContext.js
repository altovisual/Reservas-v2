import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TasaBcvContext = createContext();

export const useTasaBcv = () => {
  const context = useContext(TasaBcvContext);
  if (!context) {
    throw new Error('useTasaBcv debe usarse dentro de TasaBcvProvider');
  }
  return context;
};

export const TasaBcvProvider = ({ children }) => {
  const [tasa, setTasa] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [fuente, setFuente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar tasa BCV
  const cargarTasa = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasa-bcv');
      setTasa(response.data.tasa);
      setFecha(response.data.fecha);
      setFuente(response.data.fuente);
      setError(response.data.error || null);
    } catch (err) {
      console.error('Error cargando tasa BCV:', err);
      setError('No se pudo cargar la tasa BCV');
    } finally {
      setLoading(false);
    }
  }, []);

  // Forzar actualización
  const actualizarTasa = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasa-bcv/actualizar');
      setTasa(response.data.tasa);
      setFecha(response.data.fecha);
      setFuente(response.data.fuente);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Error actualizando tasa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Establecer tasa manual
  const establecerTasaManual = async (nuevaTasa) => {
    try {
      setLoading(true);
      const response = await api.post('/tasa-bcv/manual', { tasa: nuevaTasa });
      setTasa(response.data.tasa);
      setFecha(response.data.fecha);
      setFuente(response.data.fuente);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Error estableciendo tasa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Convertir USD a VES
  const convertirABolivares = (montoUSD) => {
    if (!tasa || !montoUSD) return 0;
    return Math.round(montoUSD * tasa * 100) / 100;
  };

  // Formatear precio en bolívares
  const formatearBs = (montoUSD) => {
    const bs = convertirABolivares(montoUSD);
    return new Intl.NumberFormat('es-VE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(bs) + ' Bs';
  };

  // Cargar tasa al montar
  useEffect(() => {
    cargarTasa();
    
    // Actualizar cada 30 minutos
    const interval = setInterval(cargarTasa, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cargarTasa]);

  const value = {
    tasa,
    fecha,
    fuente,
    loading,
    error,
    cargarTasa,
    actualizarTasa,
    establecerTasaManual,
    convertirABolivares,
    formatearBs
  };

  return (
    <TasaBcvContext.Provider value={value}>
      {children}
    </TasaBcvContext.Provider>
  );
};

export default TasaBcvContext;

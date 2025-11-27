import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Retornar valores por defecto si no hay provider
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAll: () => {}
    };
  }
  return context;
};

// Función para reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    // Intentar con Audio HTML5 primero (más compatible)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcXV9hYuRl5eTjIV9dXFxdX2Fi5GXl5OMhX11cXF1fYWLkZeXk4yFfXVxcQ==');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Si falla el Audio HTML5, usar Web Audio API
      playWebAudioSound();
    });
  } catch (e) {
    playWebAudioSound();
  }
};

// Sonido alternativo con Web Audio API
const playWebAudioSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Secuencia de tonos para hacerlo más notorio
    const playTone = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Tocar 3 tonos ascendentes (ding-ding-ding)
    const now = audioContext.currentTime;
    playTone(880, now, 0.15);         // La agudo
    playTone(1100, now + 0.15, 0.15); // Do# más agudo
    playTone(1320, now + 0.3, 0.25);  // Mi más agudo
    
    console.log('🔔 Sonido de notificación reproducido');
  } catch (e) {
    console.log('No se pudo reproducir sonido:', e);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const addNotificationRef = useRef(null);

  // Cargar notificaciones guardadas del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminNotifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }
  }, []);

  // Guardar notificaciones en localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('adminNotifications', JSON.stringify(notifications.slice(0, 50)));
    }
  }, [notifications]);

  // Agregar nueva notificación
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    console.log('🔔 Agregando notificación:', newNotification);
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Reproducir sonido
    playNotificationSound();

    // Mostrar notificación del navegador si está permitido
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('💅 Nueva Reserva - Nail Spa', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: 'nueva-cita-' + Date.now(),
        requireInteraction: true
      });
    }
  }, []);

  // Guardar referencia actualizada de addNotification
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Marcar notificación como leída
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Limpiar todas las notificaciones
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('adminNotifications');
  }, []);

  // Conectar con Socket.IO - solo una vez al montar
  useEffect(() => {
    // Obtener URL base sin /api
    let SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    // Remover /api si existe
    SOCKET_URL = SOCKET_URL.replace('/api', '');
    
    // Vercel no soporta WebSockets - desactivar en producción
    const isProduction = SOCKET_URL.includes('vercel.app');
    if (isProduction) {
      console.log('⚠️ WebSockets desactivados en producción (Vercel no los soporta)');
      setIsConnected(false);
      return;
    }
    
    console.log('🔌 Intentando conectar Socket.IO a:', SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado! ID:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('connected', (data) => {
      console.log('✅ Confirmación del servidor:', data);
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('❌ Error de conexión Socket:', error.message);
      setIsConnected(false);
    });

    socketRef.current.on('nuevaCita', (cita) => {
      console.log('📩 Evento nuevaCita recibido:', cita);
      if (addNotificationRef.current) {
        addNotificationRef.current({
          type: 'nueva_cita',
          title: '¡Nueva Reserva!',
          message: `${cita.nombreCliente} reservó para las ${cita.horaInicio}`,
          data: cita
        });
      }
    });

    socketRef.current.on('citaCancelada', (cita) => {
      console.log('📩 Evento citaCancelada recibido:', cita);
      if (addNotificationRef.current) {
        addNotificationRef.current({
          type: 'cita_cancelada',
          title: 'Cita Cancelada',
          message: `${cita.nombreCliente} canceló su cita`,
          data: cita
        });
      }
    });

    socketRef.current.on('citaReagendada', (cita) => {
      console.log('📩 Evento citaReagendada recibido:', cita);
      if (addNotificationRef.current) {
        addNotificationRef.current({
          type: 'cita_reagendada',
          title: 'Cita Reagendada',
          message: `${cita.nombreCliente} reagendó para las ${cita.horaInicio}`,
          data: cita
        });
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('📴 Socket desconectado:', reason);
      setIsConnected(false);
    });

    // Solicitar permiso para notificaciones del navegador
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permiso de notificaciones:', permission);
      });
    }

    return () => {
      console.log('🔌 Desconectando socket...');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Sin dependencias - solo se ejecuta una vez

  const value = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

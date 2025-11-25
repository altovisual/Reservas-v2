import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Scissors, Clock, LogOut, Menu, X, DollarSign } from 'lucide-react';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await api.get('/citas/hoy');
      setCitasHoy(response.data.citas || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { label: 'Citas', icon: Calendar, path: '/admin/citas' },
    { label: 'Servicios', icon: Scissors, path: '/admin/servicios' },
    { label: 'Especialistas', icon: Users, path: '/admin/especialistas' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">💅 Nail Spa</h1>
            <p className="text-pink-100 text-sm">Hola, {admin?.nombre}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 bg-white/20 rounded-lg">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="bg-white shadow-lg p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50"
            >
              <item.icon className="w-5 h-5 text-pink-500" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-gray-500 text-sm">Citas hoy</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.ingresos || 0}</p>
                <p className="text-gray-500 text-sm">Ingresos hoy</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendientes || 0}</p>
                <p className="text-gray-500 text-sm">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completadas || 0}</p>
                <p className="text-gray-500 text-sm">Completadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-3 gap-3">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl p-4 shadow text-center hover:shadow-lg transition-shadow"
            >
              <item.icon className="w-8 h-8 mx-auto text-pink-500 mb-2" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Citas de hoy */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Citas de hoy</h2>
          </div>
          <div className="divide-y">
            {citasHoy.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No hay citas para hoy</div>
            ) : (
              citasHoy.slice(0, 5).map(cita => (
                <div key={cita._id} className="p-4 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-pink-600">{cita.horaInicio}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{cita.nombreCliente}</p>
                    <p className="text-sm text-gray-500">
                      {cita.servicios?.map(s => s.nombreServicio).join(', ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                    cita.estado === 'en_progreso' ? 'bg-pink-100 text-pink-700' :
                    cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cita.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

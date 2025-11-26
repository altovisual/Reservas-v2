import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Settings,
  Bell,
  BarChart3,
  UserCircle,
  Cog,
  Image,
  Star,
  CreditCard,
  Clock
} from 'lucide-react';

const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Citas', icon: Calendar, path: '/admin/citas' },
    { label: 'Horarios', icon: Clock, path: '/admin/horarios' },
    { label: 'Pagos', icon: CreditCard, path: '/admin/pagos' },
    { label: 'Clientes', icon: UserCircle, path: '/admin/clientes' },
    { label: 'Servicios', icon: Scissors, path: '/admin/servicios' },
    { label: 'Especialistas', icon: Users, path: '/admin/especialistas' },
    { label: 'Galería', icon: Image, path: '/admin/galeria' },
    { label: 'Reseñas', icon: Star, path: '/admin/resenas' },
    { label: 'Reportes', icon: BarChart3, path: '/admin/reportes' },
    { label: 'Configuración', icon: Cog, path: '/admin/configuracion' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💅</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Nail Spa</h1>
              <p className="text-xs text-gray-500">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-emerald-500' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-semibold">
                {admin?.nombre?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{admin?.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💅</span>
              </div>
              <span className="font-semibold text-gray-900">Nail Spa</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💅</span>
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">Nail Spa</h1>
                  <p className="text-xs text-gray-500">Panel Admin</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.path)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto ${isActive(item.path) ? 'text-emerald-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </nav>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold">
                    {admin?.nombre?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{admin?.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full mt-3 flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Page Header */}
        {title && (
          <div className="bg-white border-b border-gray-200 px-6 lg:px-10 py-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}
        
        {/* Page Content */}
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

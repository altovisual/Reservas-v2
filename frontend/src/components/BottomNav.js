import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Image, Calendar, User, Sparkles } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // No mostrar en auth
  if (location.pathname === '/auth') return null;
  
  const isActive = (path) => {
    if (path === '/servicios') {
      return location.pathname === '/servicios' || location.pathname.startsWith('/reservar');
    }
    return location.pathname === path;
  };

  const handleNavigate = (path) => {
    if (location.pathname !== path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate(path), 100);
    }
  };

  const navItems = [
    { path: '/servicios', icon: Sparkles, label: 'Servicios' },
    { path: '/galeria', icon: Image, label: 'Galería' },
    { path: '/mis-citas', icon: Calendar, label: 'Citas' },
    { path: '/mi-perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 shadow-lg shadow-black/5">
      <div className="flex items-center justify-around max-w-md mx-auto py-2 px-4 safe-area-pb">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-300 ease-out ${
                active 
                  ? 'text-brand-600 bg-brand-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-ivory-100'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`} />
              <span className={`text-[10px] transition-all duration-300 ${active ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

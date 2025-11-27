import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TasaBcvProvider } from './context/TasaBcvContext';

// Páginas públicas
import Servicios from './pages/Servicios';
import ReservarCita from './pages/ReservarCita';
import MisCitas from './pages/MisCitas';
import GaleriaPublica from './pages/GaleriaPublica';
import ResenasPublicas from './pages/ResenasPublicas';
import ClienteAuth from './pages/ClienteAuth';
import MiPerfil from './pages/MiPerfil';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import GestionServicios from './pages/admin/GestionServicios';
import GestionEspecialistas from './pages/admin/GestionEspecialistas';
import GestionCitas from './pages/admin/GestionCitas';
import Reportes from './pages/admin/Reportes';
import Clientes from './pages/admin/Clientes';
import Configuracion from './pages/admin/Configuracion';
import Galeria from './pages/admin/Galeria';
import Resenas from './pages/admin/Resenas';
import Pagos from './pages/admin/Pagos';
import Horarios from './pages/admin/Horarios';
import TasaBcv from './pages/admin/TasaBcv';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

// Componente que muestra BottomNav solo en rutas públicas
function AppContent() {
  const location = useLocation();
  const isPublicRoute = !location.pathname.startsWith('/admin');
  
  return (
    <>
      <div className="page-wrapper">
        <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<ClienteAuth />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/reservar" element={<Navigate to="/servicios" replace />} />
            <Route path="/reservar/:servicioId" element={<ReservarCita />} />
            <Route path="/mis-citas" element={<MisCitas />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
            <Route path="/galeria" element={<GaleriaPublica />} />
            <Route path="/resenas" element={<ResenasPublicas />} />

            {/* Admin */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/servicios" element={<ProtectedRoute><GestionServicios /></ProtectedRoute>} />
            <Route path="/admin/especialistas" element={<ProtectedRoute><GestionEspecialistas /></ProtectedRoute>} />
            <Route path="/admin/citas" element={<ProtectedRoute><GestionCitas /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
            <Route path="/admin/galeria" element={<ProtectedRoute><Galeria /></ProtectedRoute>} />
            <Route path="/admin/resenas" element={<ProtectedRoute><Resenas /></ProtectedRoute>} />
            <Route path="/admin/pagos" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />
            <Route path="/admin/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
            <Route path="/admin/tasa-bcv" element={<ProtectedRoute><TasaBcv /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
      {isPublicRoute && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <TasaBcvProvider>
            <AppContent />
          </TasaBcvProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

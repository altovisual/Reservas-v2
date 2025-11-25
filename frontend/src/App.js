import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas
import Servicios from './pages/Servicios';
import ReservarCita from './pages/ReservarCita';
import MisCitas from './pages/MisCitas';
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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/servicios" replace />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/reservar/:servicioId" element={<ReservarCita />} />
          <Route path="/mis-citas" element={<MisCitas />} />

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

          <Route path="*" element={<Navigate to="/servicios" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

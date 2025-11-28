import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, CreditCard, ArrowRight, UserPlus, LogIn, Gift, Calendar } from 'lucide-react';
import api from '../services/api';

const ClienteAuth = () => {
  const navigate = useNavigate();
  const [modo, setModo] = useState('login'); // 'login' o 'registro'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formLogin, setFormLogin] = useState({
    cedula: '',
    tipoCedula: 'V'
  });
  
  const [formRegistro, setFormRegistro] = useState({
    tipoCedula: 'V',
    cedula: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    notas: ''
  });

  const buscarCliente = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/clientes/buscar', { cedula: formLogin.cedula });
      
      if (response.data.existe) {
        // Guardar cliente en localStorage
        localStorage.setItem('clienteId', response.data.cliente._id);
        localStorage.setItem('clienteData', JSON.stringify(response.data.cliente));
        navigate('/servicios');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError('No encontramos tu cédula. ¿Es tu primera vez? Regístrate');
        setModo('registro');
        setFormRegistro(prev => ({ ...prev, cedula: formLogin.cedula, tipoCedula: formLogin.tipoCedula }));
      } else {
        setError(error.response?.data?.mensaje || 'Error al buscar');
      }
    } finally {
      setLoading(false);
    }
  };

  const registrarCliente = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/clientes/registrar', formRegistro);
      
      // Guardar cliente en localStorage
      localStorage.setItem('clienteId', response.data.cliente._id);
      localStorage.setItem('clienteData', JSON.stringify(response.data.cliente));
      navigate('/servicios');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] page-container">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Lwise Spa" className="w-12 h-12 rounded-xl" />
            <h1 className="text-3xl font-bold">Lwise Spa</h1>
          </div>
          <p className="text-teal-100">C.C VALCO • Lun-Sab 8AM-6PM</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => setModo('login')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                modo === 'login' 
                  ? 'bg-white shadow text-emerald-600' 
                  : 'text-gray-500'
              }`}
            >
              <LogIn className="w-4 h-4" /> Ingresar
            </button>
            <button
              onClick={() => setModo('registro')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                modo === 'registro' 
                  ? 'bg-white shadow text-emerald-600' 
                  : 'text-gray-500'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Formulario Login */}
          {modo === 'login' && (
            <form onSubmit={buscarCliente}>
              <p className="text-gray-600 text-sm mb-4 text-center">
                Ingresa tu cédula para acceder a tu cuenta
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cédula de Identidad</label>
                <div className="flex gap-2">
                  <select
                    value={formLogin.tipoCedula}
                    onChange={(e) => setFormLogin({...formLogin, tipoCedula: e.target.value})}
                    className="w-20 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                    <option value="P">P</option>
                  </select>
                  <div className="flex-1 relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formLogin.cedula}
                      onChange={(e) => setFormLogin({...formLogin, cedula: e.target.value.replace(/\D/g, '')})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="12345678"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formLogin.cedula}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Continuar <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Formulario Registro */}
          {modo === 'registro' && (
            <form onSubmit={registrarCliente} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4 text-center">
                Completa tus datos para crear tu cuenta
              </p>

              {/* Cédula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cédula de Identidad *</label>
                <div className="flex gap-2">
                  <select
                    value={formRegistro.tipoCedula}
                    onChange={(e) => setFormRegistro({...formRegistro, tipoCedula: e.target.value})}
                    className="w-20 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                    <option value="P">P</option>
                  </select>
                  <input
                    type="text"
                    value={formRegistro.cedula}
                    onChange={(e) => setFormRegistro({...formRegistro, cedula: e.target.value.replace(/\D/g, '')})}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="12345678"
                    required
                  />
                </div>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formRegistro.nombre}
                      onChange={(e) => setFormRegistro({...formRegistro, nombre: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nombre"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                  <input
                    type="text"
                    value={formRegistro.apellido}
                    onChange={(e) => setFormRegistro({...formRegistro, apellido: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Apellido"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formRegistro.telefono}
                    onChange={(e) => setFormRegistro({...formRegistro, telefono: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0424-1234567"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formRegistro.email}
                    onChange={(e) => setFormRegistro({...formRegistro, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="correo@email.com"
                  />
                </div>
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de Nacimiento</label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formRegistro.fechaNacimiento}
                    onChange={(e) => setFormRegistro({...formRegistro, fechaNacimiento: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Te enviaremos un regalo especial 🎁</p>
              </div>

              <button
                type="submit"
                disabled={loading || !formRegistro.cedula || !formRegistro.nombre || !formRegistro.telefono}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Crear Cuenta <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Beneficios */}
        <div className="mt-6 space-y-3 pb-8">
          <h3 className="text-center text-gray-500 text-sm font-medium">Beneficios de registrarte</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center">
              <Gift className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">Acumula Puntos</p>
              <p className="text-xs text-gray-500">10% en cada servicio</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center">
              <Calendar className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">Historial</p>
              <p className="text-xs text-gray-500">Tus citas guardadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteAuth;

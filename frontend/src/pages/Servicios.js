import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, Search, ChevronRight, MapPin, Phone, Menu, X, Gift, Sparkles, Users, Calendar, Image, Scissors, Palette, Eye, Package } from 'lucide-react';
import api from '../services/api';

const categoriaIconos = {
  'Manicure': Sparkles, 'Pedicure': Sparkles, 'Uñas Acrílicas': Sparkles, 'Uñas en Gel': Sparkles,
  'Nail Art': Palette, 'Depilación': Scissors, 'Cejas y Pestañas': Eye, 'Paquetes': Package
};

const Servicios = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [galeria, setGaleria] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [cliente, setCliente] = useState(null);
  
  useEffect(() => {
    const clienteData = localStorage.getItem('clienteData');
    if (clienteData) {
      setCliente(JSON.parse(clienteData));
    }
  }, []);

  
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [servRes, catRes] = await Promise.all([
        api.get('/servicios'),
        api.get('/servicios/categorias')
      ]);
      setServicios(servRes.data);
      setCategorias(['Todos', ...catRes.data]);
      
      // Cargar galería y reseñas (datos de ejemplo si falla)
      try {
        const galRes = await api.get('/galeria?limit=6');
        setGaleria(galRes.data);
      } catch {
        setGaleria([
          { _id: '1', imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300', titulo: 'Diseño Floral' },
          { _id: '2', imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300', titulo: 'French' },
          { _id: '3', imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=300', titulo: 'Acrílicas' },
          { _id: '4', imagen: 'https://images.unsplash.com/photo-1610992015732-2449b0dd2b8f?w=300', titulo: 'Nail Art' },
        ]);
      }
      
      try {
        const resRes = await api.get('/resenas?estado=aprobada&limit=3');
        setResenas(resRes.data.resenas || []);
      } catch {
        setResenas([
          { _id: '1', cliente: 'María G.', calificacion: 5, comentario: '¡Excelente servicio! Muy profesionales.', servicio: 'Manicure Gel' },
          { _id: '2', cliente: 'Carmen R.', calificacion: 5, comentario: 'El mejor spa de uñas. Súper recomendado.', servicio: 'Pedicure Spa' },
          { _id: '3', cliente: 'Laura M.', calificacion: 4, comentario: 'Muy buen trabajo y atención.', servicio: 'Nail Art' },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviciosFiltrados = servicios.filter(s => {
    const coincideCategoria = categoriaActiva === 'Todos' || s.categoria === categoriaActiva;
    const coincideBusqueda = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const promedioCalificacion = resenas.length > 0 
    ? (resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length).toFixed(1)
    : '5.0';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 page-container">
      {/* Header NO sticky - se va con el scroll */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> {cliente ? `Hola, ${cliente.nombre}` : 'Nail Spa'}
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                {cliente ? 'Bienvenida a tu destino de belleza ✨' : 'Tu destino de belleza'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/mis-citas')}
                className="bg-white/20 p-2.5 rounded-xl hover:bg-white/30 transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMenuOpen(true)}
                className="bg-white/20 p-2.5 rounded-xl hover:bg-white/30 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Stats Cards */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 fill-current" />
              <p className="text-lg font-bold">{promedioCalificacion}</p>
              <p className="text-xs text-emerald-100">Rating</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1" />
              <p className="text-lg font-bold">500+</p>
              <p className="text-xs text-emerald-100">Clientes</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <Gift className="w-5 h-5 mx-auto mb-1" />
              <p className="text-lg font-bold">10%</p>
              <p className="text-xs text-emerald-100">Puntos</p>
            </div>
          </div>
        </div>

        {/* Banner de Promociones */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="absolute right-8 bottom-0 w-16 h-16 bg-white/10 rounded-full -mb-6"></div>
            <div className="relative z-10">
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">🔥 OFERTA</span>
              <h3 className="text-white font-bold text-lg mt-2">¡20% OFF en tu primera cita!</h3>
              <p className="text-white/90 text-sm mt-1">Usa el código: BIENVENIDA</p>
              <button 
                onClick={() => navigate('/reservar')}
                className="mt-3 bg-white text-orange-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-white/90 transition-colors"
              >
                Reservar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda y Categorías - STICKY */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 shadow-lg"
            />
          </div>
        </div>

        {/* Categorías - Sticky con búsqueda */}
        <div className="px-4 pb-3 overflow-x-auto bg-gradient-to-r from-emerald-500 to-teal-500">
          <div className="flex gap-2 pb-1">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  categoriaActiva === cat
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {(() => {
                  const IconoCat = categoriaIconos[cat] || Sparkles;
                  return <IconoCat className="w-4 h-4" />;
                })()}
                <span className="text-sm font-medium">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Servicios Destacados */}
      {!busqueda && categoriaActiva === 'Todos' && servicios.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Destacados</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {servicios.slice(0, 3).map(servicio => {
              const IconoDest = categoriaIconos[servicio.categoria] || Sparkles;
              return (
                <div
                  key={`dest-${servicio._id}`}
                  onClick={() => navigate(`/reservar/${servicio._id}`)}
                  className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="h-20 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <IconoDest className="w-8 h-8 text-white" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{servicio.nombre}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">{servicio.duracion}min</span>
                      <span className="text-emerald-600 font-bold text-sm">${servicio.precio}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Servicios */}
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {categoriaActiva === 'Todos' ? 'Todos los Servicios' : categoriaActiva}
          </h2>
          <span className="text-sm text-gray-400">{serviciosFiltrados.length} servicios</span>
        </div>
        {serviciosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
            No se encontraron servicios
          </div>
        ) : (
          serviciosFiltrados.map((servicio, index) => {
            const IconoServicio = categoriaIconos[servicio.categoria] || Sparkles;
            return (
              <div
                key={servicio._id}
                onClick={() => navigate(`/reservar/${servicio._id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.99] stagger-item hover-lift"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex">
                  {servicio.imagen ? (
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={servicio.imagen} 
                        alt={servicio.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <IconoServicio className="w-10 h-10 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex-1 p-4 min-w-0">
                    <h3 className="font-semibold text-gray-900">{servicio.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{servicio.descripcion}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" /> {servicio.duracion} min
                      </span>
                      <span className="text-emerald-600 font-bold">${servicio.precio}</span>
                    </div>
                  </div>
                  <div className="flex items-center pr-4">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Galería Preview */}
      {galeria.length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Nuestros Trabajos</h2>
            <button className="text-emerald-500 text-sm font-medium flex items-center gap-1">
              Ver más <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {galeria.slice(0, 4).map((img, i) => (
              <div key={img._id} className="aspect-square rounded-xl overflow-hidden">
                <img 
                  src={img.imagen} 
                  alt={img.titulo}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reseñas Preview */}
      {resenas.length > 0 && (
        <div className="px-4 mt-8 pb-28">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="space-y-3">
            {resenas.slice(0, 3).map((resena, index) => (
              <div key={resena._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">{(resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'C')).charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{resena.clienteNombre || resena.cliente?.nombre || (typeof resena.cliente === 'string' ? resena.cliente : 'Cliente')}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= resena.calificacion ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{resena.comentario}</p>
                <p className="text-xs text-gray-400 mt-2">{resena.servicioNombre || resena.servicio?.nombre || (typeof resena.servicio === 'string' ? resena.servicio : '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menú lateral */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 animate-fade-in-up" 
            style={{ animationDuration: '0.2s' }}
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out"
            style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Menú</h3>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button 
                onClick={() => { navigate('/servicios'); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <span className="text-xl">💅</span>
                <span className="font-medium text-gray-700">Servicios</span>
              </button>
              <button 
                onClick={() => { navigate('/mis-citas'); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Mis Citas</span>
              </button>
              <button 
                onClick={() => { navigate('/galeria'); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <Image className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Galería</span>
              </button>
              <button 
                onClick={() => { navigate('/resenas'); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <Star className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Reseñas</span>
              </button>
              <div className="border-t border-gray-100 my-4"></div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 mb-2">Contáctanos</p>
                <a href="tel:809-555-0100" className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Phone className="w-4 h-4" /> 809-555-0100
                </a>
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" /> Santo Domingo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/584141234567?text=Hola,%20quiero%20información%20sobre%20los%20servicios"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors hover:scale-110"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

          </div>
  );
};

export default Servicios;

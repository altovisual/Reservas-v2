import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, X, MessageCircle, Share2, Bookmark, Grid3X3, LayoutGrid, Sparkles } from 'lucide-react';
import api from '../services/api';

const GaleriaPublica = () => {
  const navigate = useNavigate();
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [likesAnimados, setLikesAnimados] = useState({});
  const [clienteId] = useState(() => localStorage.getItem('clienteId') || `guest_${Date.now()}`);
  const [guardados, setGuardados] = useState(() => JSON.parse(localStorage.getItem('favoritos') || '[]'));

  const categorias = ['todas', 'Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 'French', 'Diseños', 'Cejas y Pestañas', 'Depilación', 'Maquillaje', 'Spa'];

  // Función para compartir
  const compartir = async (img) => {
    const texto = `¡Mira este increíble trabajo de Lwise Spa! 💅✨\n${img.titulo}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: img.titulo,
          text: texto,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(texto + '\n' + window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  // Función para guardar en favoritos
  const toggleGuardado = (img) => {
    const yaGuardado = guardados.some(g => g._id === img._id);
    let nuevosGuardados;
    if (yaGuardado) {
      nuevosGuardados = guardados.filter(g => g._id !== img._id);
    } else {
      nuevosGuardados = [...guardados, { _id: img._id, nombre: img.titulo, imagen: img.imagen }];
    }
    setGuardados(nuevosGuardados);
    localStorage.setItem('favoritos', JSON.stringify(nuevosGuardados));
  };

  useEffect(() => {
    cargarGaleria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarGaleria = async () => {
    try {
      const response = await api.get('/galeria');
      // Agregar estado de like local basado en likedBy
      const imagenesConLike = response.data.map(img => ({
        ...img,
        liked: img.likedBy?.includes(clienteId) || false
      }));
      setImagenes(imagenesConLike);
    } catch (error) {
      // Datos de ejemplo mejorados
      setImagenes([
        { _id: '1', titulo: 'Diseño Floral Rosa', descripcion: 'Hermoso diseño con flores delicadas', categoria: 'Nail Art', imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', likes: 45, liked: false },
        { _id: '2', titulo: 'French Elegante', descripcion: 'Clásico francés con acabado perfecto', categoria: 'French', imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600', likes: 38, liked: false },
        { _id: '3', titulo: 'Acrílicas Stiletto', descripcion: 'Uñas acrílicas forma stiletto', categoria: 'Uñas Acrílicas', imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600', likes: 52, liked: false },
        { _id: '4', titulo: 'Gel Tornasol', descripcion: 'Efecto tornasol brillante', categoria: 'Manicure', imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', likes: 29, liked: false },
        { _id: '5', titulo: 'Diseño Navideño', descripcion: 'Perfecto para las fiestas', categoria: 'Nail Art', imagen: 'https://images.unsplash.com/photo-1610992015732-2449b0dd2b8f?w=600', likes: 67, liked: false },
        { _id: '6', titulo: 'Manicure Spa', descripcion: 'Tratamiento completo de spa', categoria: 'Manicure', imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600', likes: 23, liked: false },
        { _id: '7', titulo: 'Pedicure Deluxe', descripcion: 'Pedicure premium con masaje', categoria: 'Pedicure', imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', likes: 34, liked: false },
        { _id: '8', titulo: 'Arte Abstracto', descripcion: 'Diseño único y moderno', categoria: 'Nail Art', imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600', likes: 41, liked: false },
        { _id: '9', titulo: 'Degradado Sunset', descripcion: 'Colores del atardecer', categoria: 'Diseños', imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600', likes: 56, liked: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e, img) => {
    e.stopPropagation();
    
    // Animación del corazón
    setLikesAnimados(prev => ({ ...prev, [img._id]: true }));
    setTimeout(() => {
      setLikesAnimados(prev => ({ ...prev, [img._id]: false }));
    }, 600);

    // Actualizar estado local inmediatamente
    setImagenes(prev => prev.map(i => {
      if (i._id === img._id) {
        return {
          ...i,
          liked: !i.liked,
          likes: i.liked ? i.likes - 1 : i.likes + 1
        };
      }
      return i;
    }));

    // Actualizar modal si está abierto
    if (imagenAmpliada && imagenAmpliada._id === img._id) {
      setImagenAmpliada(prev => ({
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1
      }));
    }

    // Enviar al servidor
    try {
      await api.post(`/galeria/${img._id}/like`, { clienteId });
    } catch (error) {
      console.log('Like guardado localmente');
    }
  };

  const handleDoubleTapLike = (img) => {
    if (!img.liked) {
      handleLike({ stopPropagation: () => {} }, img);
    }
  };

  const imagenesFiltradas = filtro === 'todas' 
    ? imagenes 
    : imagenes.filter(img => img.categoria === filtro);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando galería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 page-container">
      {/* Header estilo Instagram */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('/servicios')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Galería
          </h1>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setVistaGrid(true)}
              className={`p-2 rounded-lg transition-colors ${vistaGrid ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setVistaGrid(false)}
              className={`p-2 rounded-lg transition-colors ${!vistaGrid ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros con scroll horizontal */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filtro === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'todas' ? '✨ Todas' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{imagenesFiltradas.length}</span> trabajos
          {filtro !== 'todas' && <span> en {filtro}</span>}
        </p>
      </div>

      {/* Grid de imágenes */}
      {vistaGrid ? (
        // Vista Grid compacta (3 columnas)
        <div className="grid grid-cols-3 gap-0.5">
          {imagenesFiltradas.map(img => (
            <div
              key={img._id}
              onClick={() => setImagenAmpliada(img)}
              className="relative aspect-square cursor-pointer group"
            >
              <img
                src={img.imagen}
                alt={img.titulo}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay en hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-white font-semibold">
                  <Heart className={`w-5 h-5 ${img.liked ? 'fill-white' : ''}`} />
                  <span>{img.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vista Feed estilo Instagram
        <div className="divide-y divide-gray-100">
          {imagenesFiltradas.map(img => (
            <div key={img._id} className="bg-white">
              {/* Header del post */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Lwise Spa</p>
                  <p className="text-xs text-gray-500">{img.categoria}</p>
                </div>
              </div>

              {/* Imagen */}
              <div 
                className="relative aspect-square bg-gray-100"
                onDoubleClick={() => handleDoubleTapLike(img)}
              >
                <img
                  src={img.imagen}
                  alt={img.titulo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Animación de like con doble tap */}
                {likesAnimados[img._id] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart className="w-24 h-24 text-white fill-white animate-ping opacity-80" />
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleLike(e, img)}
                      className="p-1 -ml-1 transition-transform active:scale-125"
                    >
                      <Heart 
                        className={`w-7 h-7 transition-colors ${
                          img.liked 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-800 hover:text-gray-600'
                        }`} 
                      />
                    </button>
                    <button className="p-1">
                      <MessageCircle className="w-7 h-7 text-gray-800 hover:text-gray-600" />
                    </button>
                    <button className="p-1" onClick={() => compartir(img)}>
                      <Share2 className="w-7 h-7 text-gray-800 hover:text-gray-600" />
                    </button>
                  </div>
                  <button className="p-1" onClick={() => toggleGuardado(img)}>
                    <Bookmark className={`w-7 h-7 transition-colors ${
                      guardados.some(g => g._id === img._id)
                        ? 'text-gray-900 fill-gray-900'
                        : 'text-gray-800 hover:text-gray-600'
                    }`} />
                  </button>
                </div>

                {/* Likes */}
                <p className="font-semibold text-gray-900 text-sm">
                  {img.likes.toLocaleString()} Me gusta
                </p>

                {/* Descripción */}
                <div className="mt-1">
                  <span className="font-semibold text-gray-900 text-sm">nailspa </span>
                  <span className="text-gray-800 text-sm">{img.titulo}</span>
                  {img.descripcion && (
                    <p className="text-gray-600 text-sm mt-0.5">{img.descripcion}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal imagen ampliada */}
      {imagenAmpliada && (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={() => setImagenAmpliada(null)}
        >
          {/* Header del modal */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setImagenAmpliada(null)}
              className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center">
              <p className="text-white font-semibold">{imagenAmpliada.titulo}</p>
              <p className="text-white/60 text-xs">{imagenAmpliada.categoria}</p>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Imagen */}
          <div 
            className="flex-1 flex items-center justify-center p-4"
            onDoubleClick={() => handleDoubleTapLike(imagenAmpliada)}
          >
            <img
              src={imagenAmpliada.imagen}
              alt={imagenAmpliada.titulo}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
            {likesAnimados[imagenAmpliada._id] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="w-32 h-32 text-white fill-white animate-ping opacity-80" />
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="bg-black/80 px-4 py-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-5">
                <button 
                  onClick={(e) => handleLike(e, imagenAmpliada)}
                  className="transition-transform active:scale-125"
                >
                  <Heart 
                    className={`w-8 h-8 ${
                      imagenAmpliada.liked 
                        ? 'text-red-500 fill-red-500' 
                        : 'text-white hover:text-white/80'
                    }`} 
                  />
                </button>
                <button>
                  <MessageCircle className="w-8 h-8 text-white hover:text-white/80" />
                </button>
                <button>
                  <Share2 className="w-8 h-8 text-white hover:text-white/80" />
                </button>
              </div>
              <button>
                <Bookmark className="w-8 h-8 text-white hover:text-white/80" />
              </button>
            </div>
            <p className="text-white font-semibold">
              {imagenAmpliada.likes.toLocaleString()} Me gusta
            </p>
            {imagenAmpliada.descripcion && (
              <p className="text-white/80 text-sm mt-1">{imagenAmpliada.descripcion}</p>
            )}
          </div>
        </div>
      )}

      {/* Estilos para ocultar scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GaleriaPublica;

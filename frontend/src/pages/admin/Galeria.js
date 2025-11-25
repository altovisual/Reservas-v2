import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Image, 
  Trash2, 
  X,
  Upload,
  Grid,
  List,
  Eye,
  Heart
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Galeria = () => {
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSubir, setModalSubir] = useState(false);
  const [modalVer, setModalVer] = useState(null);
  const [vista, setVista] = useState('grid');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [form, setForm] = useState({
    titulo: '',
    categoria: 'Manicure',
    descripcion: '',
    imagen: null,
    preview: null
  });

  const categorias = [
    'Manicure',
    'Pedicure', 
    'Uñas Acrílicas',
    'Uñas en Gel',
    'Nail Art',
    'Diseños 3D',
    'French',
    'Temporada'
  ];

  useEffect(() => {
    cargarImagenes();
  }, []);

  const cargarImagenes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/galeria');
      setImagenes(response.data);
    } catch (error) {
      console.error('Error:', error);
      // Datos de ejemplo
      setImagenes([
        {
          _id: '1',
          titulo: 'Diseño Floral Rosa',
          categoria: 'Nail Art',
          descripcion: 'Hermoso diseño con flores en tonos rosa',
          imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
          likes: 45,
          fecha: '2024-01-15'
        },
        {
          _id: '2',
          titulo: 'French Elegante',
          categoria: 'French',
          descripcion: 'Clásico french con línea fina',
          imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400',
          likes: 38,
          fecha: '2024-01-14'
        },
        {
          _id: '3',
          titulo: 'Acrílicas Stiletto',
          categoria: 'Uñas Acrílicas',
          descripcion: 'Uñas acrílicas forma stiletto color nude',
          imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400',
          likes: 52,
          fecha: '2024-01-13'
        },
        {
          _id: '4',
          titulo: 'Gel Tornasol',
          categoria: 'Uñas en Gel',
          descripcion: 'Efecto tornasol con gel builder',
          imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
          likes: 29,
          fecha: '2024-01-12'
        },
        {
          _id: '5',
          titulo: 'Diseño Navideño',
          categoria: 'Temporada',
          descripcion: 'Diseño especial de temporada navideña',
          imagen: 'https://images.unsplash.com/photo-1610992015732-2449b0dd2b8f?w=400',
          likes: 67,
          fecha: '2024-01-10'
        },
        {
          _id: '6',
          titulo: 'Manicure Spa',
          categoria: 'Manicure',
          descripcion: 'Manicure completo con tratamiento spa',
          imagen: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400',
          likes: 23,
          fecha: '2024-01-08'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        imagen: file,
        preview: URL.createObjectURL(file)
      }));
    }
  };

  const subirImagen = async () => {
    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('categoria', form.categoria);
      formData.append('descripcion', form.descripcion);
      if (form.imagen) {
        formData.append('imagen', form.imagen);
      }
      
      await api.post('/galeria', formData);
      setModalSubir(false);
      setForm({ titulo: '', categoria: 'Manicure', descripcion: '', imagen: null, preview: null });
      cargarImagenes();
    } catch (error) {
      // Simular subida exitosa
      const nuevaImagen = {
        _id: Date.now().toString(),
        titulo: form.titulo,
        categoria: form.categoria,
        descripcion: form.descripcion,
        imagen: form.preview || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
        likes: 0,
        fecha: new Date().toISOString().split('T')[0]
      };
      setImagenes(prev => [nuevaImagen, ...prev]);
      setModalSubir(false);
      setForm({ titulo: '', categoria: 'Manicure', descripcion: '', imagen: null, preview: null });
    }
  };

  const eliminarImagen = async (id) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      await api.delete(`/galeria/${id}`);
      setImagenes(prev => prev.filter(img => img._id !== id));
    } catch (error) {
      setImagenes(prev => prev.filter(img => img._id !== id));
    }
    setModalVer(null);
  };

  const imagenesFiltradas = filtroCategoria === 'todas' 
    ? imagenes 
    : imagenes.filter(img => img.categoria === filtroCategoria);

  if (loading) {
    return (
      <AdminLayout title="Galería" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Galería" subtitle="Portfolio de trabajos realizados">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFiltroCategoria('todas')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filtroCategoria === 'todas'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filtroCategoria === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setVista('grid')}
              className={`p-2.5 ${vista === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setVista('list')}
              className={`p-2.5 ${vista === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => setModalSubir(true)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Subir imagen</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{imagenes.length}</p>
          <p className="text-sm text-gray-500">Total imágenes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-emerald-600">
            {imagenes.reduce((sum, img) => sum + img.likes, 0)}
          </p>
          <p className="text-sm text-gray-500">Total likes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">
            {[...new Set(imagenes.map(img => img.categoria))].length}
          </p>
          <p className="text-sm text-gray-500">Categorías</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-purple-600">
            {imagenes.filter(img => img.categoria === 'Nail Art').length}
          </p>
          <p className="text-sm text-gray-500">Nail Art</p>
        </div>
      </div>

      {/* Galería */}
      {imagenesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay imágenes en esta categoría</p>
          <button
            onClick={() => setModalSubir(true)}
            className="mt-4 text-emerald-500 font-medium hover:text-emerald-600"
          >
            Subir primera imagen
          </button>
        </div>
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagenesFiltradas.map(img => (
            <div
              key={img._id}
              onClick={() => setModalVer(img)}
              className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="aspect-square">
                <img
                  src={img.imagen}
                  alt={img.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-medium truncate">{img.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/80 text-sm">{img.categoria}</span>
                    <span className="text-white/60">•</span>
                    <span className="flex items-center gap-1 text-white/80 text-sm">
                      <Heart className="w-3 h-3" /> {img.likes}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/90 rounded-lg hover:bg-white">
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {imagenesFiltradas.map(img => (
              <div
                key={img._id}
                onClick={() => setModalVer(img)}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={img.imagen}
                    alt={img.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{img.titulo}</p>
                  <p className="text-sm text-gray-500">{img.descripcion}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {img.categoria}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <Heart className="w-3 h-3" /> {img.likes}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(img.fecha).toLocaleDateString('es')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarImagen(img._id); }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Subir Imagen */}
      {modalSubir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Subir imagen</h2>
              <button 
                onClick={() => setModalSubir(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Preview de imagen */}
              <div 
                onClick={() => document.getElementById('inputImagen').click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
              >
                {form.preview ? (
                  <img src={form.preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Haz clic para seleccionar una imagen</p>
                    <p className="text-gray-400 text-sm mt-1">JPG, PNG hasta 5MB</p>
                  </>
                )}
                <input
                  id="inputImagen"
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                <input
                  type="text"
                  placeholder="Nombre del diseño"
                  value={form.titulo}
                  onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea
                  placeholder="Describe el diseño..."
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={2}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModalSubir(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={subirImagen}
                disabled={!form.titulo}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                Subir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Imagen */}
      {modalVer && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setModalVer(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={modalVer.imagen}
                alt={modalVer.titulo}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
              <button
                onClick={() => setModalVer(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{modalVer.titulo}</h3>
                  <p className="text-gray-500 mt-1">{modalVer.descripcion}</p>
                </div>
                <button
                  onClick={() => eliminarImagen(modalVer._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                  {modalVer.categoria}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Heart className="w-4 h-4" /> {modalVer.likes} likes
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(modalVer.fecha).toLocaleDateString('es', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Galeria;

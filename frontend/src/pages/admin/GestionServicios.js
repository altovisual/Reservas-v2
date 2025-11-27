import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight, Scissors, X, Upload, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

// API_URL ya no es necesario, Cloudinary devuelve URLs completas

const GestionServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure', imagen: '' });
  const [imagenPreview, setImagenPreview] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const fileInputRef = useRef(null);
  const imagenUrlRef = useRef(''); // Referencia para guardar la URL de la imagen

  const categorias = ['Manicure', 'Pedicure', 'Uñas Acrílicas', 'Uñas en Gel', 'Nail Art', 'Depilación', 'Cejas y Pestañas', 'Paquetes'];

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarServicio = async () => {
    // Esperar si hay una imagen subiéndose
    if (subiendoImagen) {
      alert('Espera a que termine de subir la imagen');
      return;
    }
    
    try {
      // Usar múltiples fuentes para la imagen: form, ref, o preview (si es URL de Cloudinary)
      let imagenFinal = form.imagen || imagenUrlRef.current || '';
      
      // Si imagenPreview es una URL de Cloudinary, usarla
      if (!imagenFinal && imagenPreview && imagenPreview.includes('cloudinary')) {
        imagenFinal = imagenPreview;
      }
      
      const dataToSave = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio) || 0,
        duracion: parseInt(form.duracion) || 30,
        categoria: form.categoria,
        imagen: imagenFinal
      };
      
      console.log('Guardando servicio:', dataToSave);
      console.log('Imagen a guardar:', imagenFinal);
      
      if (modal === 'nuevo') {
        await api.post('/servicios', dataToSave);
      } else {
        await api.put(`/servicios/${modal}`, dataToSave);
      }
      setModal(null);
      setForm({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure', imagen: '' });
      setImagenPreview('');
      await cargarServicios();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const eliminarServicio = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await api.delete(`/servicios/${id}`);
      cargarServicios();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const toggleDisponibilidad = async (id) => {
    try {
      await api.patch(`/servicios/${id}/disponibilidad`);
      cargarServicios();
    } catch (error) {
      alert('Error');
    }
  };

  const abrirEditar = (servicio) => {
    const imagenActual = servicio.imagen || '';
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      duracion: servicio.duracion,
      categoria: servicio.categoria,
      imagen: imagenActual
    });
    setImagenPreview(imagenActual);
    imagenUrlRef.current = imagenActual;
    setModal(servicio._id);
  };

  const abrirNuevo = () => {
    setForm({ nombre: '', descripcion: '', precio: '', duracion: '', categoria: 'Manicure', imagen: '' });
    setImagenPreview('');
    imagenUrlRef.current = '';
    setModal('nuevo');
  };

  const subirImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar preview local inmediatamente
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setSubiendoImagen(true);
    const formData = new FormData();
    formData.append('imagen', file);

    try {
      // Subir a Cloudinary
      const response = await api.post('/servicios/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Cloudinary devuelve la URL completa
      const imageUrl = response.data.url;
      console.log('✅ Imagen subida a Cloudinary:', imageUrl);
      
      // Guardar en ref Y en state
      imagenUrlRef.current = imageUrl;
      setForm(prevForm => ({ ...prevForm, imagen: imageUrl }));
      setImagenPreview(imageUrl);
    } catch (error) {
      alert('Error al subir imagen');
      console.error(error);
      setImagenPreview('');
      imagenUrlRef.current = '';
    } finally {
      setSubiendoImagen(false);
    }
  };

  const eliminarImagen = () => {
    setForm({ ...form, imagen: '' });
    setImagenPreview('');
    imagenUrlRef.current = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Gestión de Servicios" subtitle="Cargando...">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Servicios" subtitle="Administra el catálogo de servicios">
      {/* Header con botón */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {servicios.length} servicios registrados
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </button>
      </div>

      {/* Grid de servicios */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servicios.map(servicio => (
          <div key={servicio._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {servicio.imagen && (
              <div className="h-32 overflow-hidden">
                <img src={servicio.imagen} alt={servicio.nombre} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {!servicio.imagen && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${servicio.disponible ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                      <Scissors className={`w-5 h-5 ${servicio.disponible ? 'text-emerald-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{servicio.nombre}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{servicio.categoria}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleDisponibilidad(servicio._id)}
                  className="flex-shrink-0"
                >
                  {servicio.disponible ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {servicio.descripcion && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{servicio.descripcion}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" /> {servicio.duracion} min
                  </span>
                  <span className="flex items-center gap-1 text-lg font-bold text-emerald-600">
                    <DollarSign className="w-4 h-4" />{servicio.precio}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => abrirEditar(servicio)} 
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => eliminarServicio(servicio._id)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'nuevo' ? 'Nuevo Servicio' : 'Editar Servicio'}
              </h2>
              <button 
                onClick={() => setModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre del servicio"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea
                  placeholder="Descripción del servicio"
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.precio}
                    onChange={(e) => setForm({...form, precio: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración (min)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={form.duracion}
                    onChange={(e) => setForm({...form, duracion: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({...form, categoria: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagen del servicio</label>
                {imagenPreview ? (
                  <div className="mb-3 relative">
                    <img src={imagenPreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                    <button
                      onClick={eliminarImagen}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={subirImagen}
                      className="hidden"
                    />
                    {subiendoImagen ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <span className="text-sm text-gray-500 mt-2">Subiendo...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500 mt-2">Clic para subir imagen</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (máx 5MB)</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarServicio}
                disabled={subiendoImagen}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  subiendoImagen 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {subiendoImagen ? 'Subiendo imagen...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default GestionServicios;

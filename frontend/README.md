# 💅 Nail Spa - Sistema de Reservas

Sistema de gestión de citas y reservas para Nail Spa.

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** v18 o superior
- **MongoDB** corriendo en localhost:27017

---

## 📦 Instalación Inicial (Solo la primera vez)

### 1. Clonar e instalar dependencias

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd nailspa

# Instalar dependencias del Backend
cd backend
npm install

# Instalar dependencias del Frontend
cd ../frontend
npm install
```

### 2. Configurar el Backend

```bash
cd backend

# Crear archivo .env
cp .env.example .env

# Inicializar datos de prueba (servicios, especialistas, estaciones)
node scripts/seed.js

# Crear usuario administrador
node scripts/initAdmin.js
```

---

## ▶️ Iniciar la Aplicación

### Opción 1: Iniciar en terminales separadas

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
> El servidor se iniciará en http://localhost:5001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
> La aplicación se abrirá en http://localhost:3000

### Opción 2: Comandos rápidos (Windows PowerShell)

**Iniciar Backend:**
```powershell
cd C:\ruta\a\nailspa\backend; node server.js
```

**Iniciar Frontend:**
```powershell
cd C:\ruta\a\nailspa\frontend; npm start
```

### Opción 3: Iniciar ambos con un solo comando

Desde la carpeta raíz del proyecto:
```bash
# Instalar concurrently (solo una vez)
npm install -g concurrently

# Iniciar ambos
concurrently "cd backend && npm start" "cd frontend && npm start"
```

---

## 🔄 Reiniciar el Backend (si el puerto está ocupado)

```powershell
# Matar procesos de Node.js y reiniciar
taskkill /F /IM node.exe; cd backend; node server.js
```

---

## 🔐 Credenciales de Acceso

| Campo    | Valor               |
|----------|---------------------|
| Email    | `admin@nailspa.com` |
| Password | `admin123`          |

## 🌐 URLs de la Aplicación

| Servicio  | URL                         |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:5001        |
| API Health| http://localhost:5001/api/health |

## ⚙️ Variables de Entorno (Backend)

Crear archivo `.env` en `/backend`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/nailspa
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=nailspa_secret_2024

# Cloudinary (para almacenar imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## ☁️ Configurar Cloudinary (Almacenamiento de Imágenes)

1. Crear cuenta gratuita en [Cloudinary](https://cloudinary.com/users/register_free)
2. Ir al [Dashboard](https://cloudinary.com/console)
3. Copiar las credenciales:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
4. Agregar al archivo `.env` del backend

Las imágenes se organizan automáticamente en carpetas:
- `nailspa/galeria` - Fotos de trabajos
- `nailspa/servicios` - Imágenes de servicios
- `nailspa/especialistas` - Fotos de perfil

## 📁 Estructura del Proyecto

```
nailspa/
├── backend/
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── scripts/         # Scripts de inicialización
│   │   ├── seed.js      # Datos de prueba
│   │   └── initAdmin.js # Crear admin
│   └── server.js        # Servidor Express
├── frontend/
│   └── src/             # Código React
```

## 🛠️ Scripts Disponibles

### Backend
- `npm start` - Inicia el servidor
- `npm run dev` - Inicia con nodemon (desarrollo)

### Frontend
- `npm start` - Inicia en modo desarrollo
- `npm run build` - Genera build de producción
- `npm test` - Ejecuta tests

---

## 🚀 Despliegue en Vercel

### 1. Desplegar Backend

```bash
cd backend
vercel
```

Variables de entorno requeridas en Vercel:
- `MONGODB_URI` - URL de MongoDB Atlas
- `JWT_SECRET` - Clave secreta para JWT
- `CORS_ORIGIN` - URL del frontend (ej: https://nailspa.vercel.app)
- `CLOUDINARY_CLOUD_NAME` - Cloud name de Cloudinary
- `CLOUDINARY_API_KEY` - API Key de Cloudinary
- `CLOUDINARY_API_SECRET` - API Secret de Cloudinary

### 2. Desplegar Frontend

```bash
cd frontend
vercel
```

Variables de entorno requeridas:
- `REACT_APP_API_URL` - URL del backend (ej: https://nailspa-api.vercel.app/api)

### 3. Configurar MongoDB Atlas

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear cluster gratuito
3. Crear usuario de base de datos
4. Obtener connection string
5. Agregar IP `0.0.0.0/0` a Network Access

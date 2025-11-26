# 💅 Nail Spa - Sistema de Reservas

Sistema de gestión de citas y reservas para Nail Spa.

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** v18 o superior
- **MongoDB** corriendo en localhost:27017

### 1. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env

# Inicializar datos de prueba (servicios, especialistas, estaciones)
node scripts/seed.js

# Crear usuario administrador
node scripts/initAdmin.js

# Iniciar servidor
npm start
```

### 2. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar aplicación
npm start
```

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
```

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

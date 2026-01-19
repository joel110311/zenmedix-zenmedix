# ZenMedix - Sistema de Historia Clínica Electrónica

![ZenMedix](https://img.shields.io/badge/ZenMedix-Medical%20Software-14b8a6?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![PocketBase](https://img.shields.io/badge/PocketBase-Backend-B8DBE4?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)

Sistema completo de gestión de consultorios médicos con historia clínica electrónica, gestión de citas, y recetas médicas personalizables.

## ✨ Características

- ✅ **Historia Clínica Electrónica** - Expedientes digitales completos por paciente
- ✅ **Gestión de Citas** - Calendario interactivo con múltiples vistas
- ✅ **Recetas Médicas** - Editor visual de diseño personalizable
- ✅ **Dashboard con KPIs** - Estadísticas y métricas de rendimiento
- ✅ **Multi-Clínica/Multi-Doctor** - Soporte para múltiples sucursales
- ✅ **Impresión Profesional** - Recetas, historias clínicas, solicitudes de estudios
- ✅ **Roles de Usuario** - Médico, Recepción, Super Admin
- ✅ **Tema Claro/Oscuro** - Múltiples temas visuales
- ✅ **Auditoría NOM-024** - Registro de todas las acciones
- ✅ **Auto-hospedado** - Con PocketBase (SQLite)
- ✅ **API REST** - Integración con n8n/WhatsApp

## 🛠 Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | PocketBase (SQLite) |
| Autenticación | PocketBase Auth |
| Despliegue | Docker + Nginx + Traefik |
| CI/CD | GitHub Actions |

## 🚀 Despliegue Rápido

### Desarrollo Local

```bash
# 1. Clonar repositorio
git clone https://github.com/joel110311/zenmedix.git
cd zenmedix

# 2. Instalar dependencias
npm install

# 3. Iniciar PocketBase (Docker)
docker run -d -p 8090:8090 -v ./pb_data:/pb_data spectado/pocketbase:latest

# 4. Configurar PocketBase
# Accede a http://localhost:8090/_/
# Importa pb_schema.json
# Crea usuario admin

# 5. Iniciar frontend
npm run dev
```

### Producción con Docker

```bash
# 1. Configurar variables
cp .env.example .env.production
# Editar .env.production con tu URL de PocketBase

# 2. Desplegar con Docker Compose
docker-compose up -d
```

### Despliegue en Portainer

1. Crear nuevo **Stack** en Portainer
2. Pegar contenido de `docker-compose.yml`
3. Configurar red externa `SociosNet`
4. Deploy

## 📁 Estructura del Proyecto

```
zenmedix/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── layout/       # Layout, Sidebar, Topbar
│   │   └── ui/           # Button, Card, Input, etc.
│   ├── context/          # React Context (Auth, Patient, Settings)
│   ├── pages/            # Páginas de la aplicación
│   │   ├── appointments/ # Gestión de citas
│   │   ├── patient-profile/ # Perfil del paciente
│   │   ├── patients/     # Lista de pacientes
│   │   ├── print/        # Vistas de impresión
│   │   └── settings/     # Configuración
│   └── services/         # API y servicios
├── docker-compose.yml    # Configuración Docker
├── Dockerfile            # Build del frontend
├── nginx.conf            # Configuración Nginx
├── pb_schema.json        # Esquema PocketBase
└── DEPLOYMENT.md         # Guía de despliegue
```

## 🔧 Configuración

### Variables de Entorno

```env
VITE_POCKETBASE_URL=https://api-consultorio.logicapp.net
```

### Colecciones PocketBase

| Colección | Descripción |
|-----------|-------------|
| `users` | Usuarios del sistema (auth) |
| `patients` | Pacientes |
| `appointments` | Citas médicas |
| `consultations` | Consultas/Historia clínica |
| `clinics` | Clínicas/Sucursales |
| `config` | Configuración del sistema |
| `audit_logs` | Registro de auditoría |

## 🔌 Integración con n8n

ZenMedix expone una API REST para crear citas desde WhatsApp/n8n:

```bash
# Crear cita
POST /api/collections/appointments/records

{
  "patientName": "Juan Pérez",
  "phone": "5551234567",
  "date": "2026-01-20",
  "time": "10:00",
  "reason": "Consulta General",
  "status": "scheduled",
  "source": "whatsapp"
}
```

## 📸 Capturas de Pantalla

### Dashboard
Dashboard con métricas de rendimiento, citas del día, y estadísticas por clínica.

### Gestión de Citas
Calendario interactivo con vista diaria, semanal y mensual.

### Editor de Recetas
Editor visual para personalizar la posición de los elementos en las recetas.

## 📄 Documentación

- [Guía de Despliegue](DEPLOYMENT.md)
- [Esquema de Base de Datos](pb_schema.json)

## 🔒 Seguridad

- Autenticación con tokens JWT (PocketBase)
- Bloqueo de cuenta tras 3 intentos fallidos
- Timeout de sesión por inactividad (15 min)
- Registro de auditoría completo (NOM-024)
- HTTPS obligatorio en producción

## 📝 Licencia

MIT © 2026 ZenMedix Medical Software

---

**Desarrollado con ❤️ para profesionales de la salud**

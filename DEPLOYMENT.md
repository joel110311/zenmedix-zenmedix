# ZenMedix - Guía de Despliegue

## Requisitos

- Docker con Swarm mode habilitado
- Traefik como reverse proxy (ya configurado en tu stack)
- Red externa `SociosNet`

## Despliegue Rápido

### 1. Configurar PocketBase

1. En Portainer, crear nuevo stack con el contenido de `docker-compose.yml`
2. O desplegar solo el backend primero:

```yaml
# docker-compose-backend.yml
version: '3.8'

services:
  zenmedix-backend:
    image: spectado/pocketbase:latest
    volumes:
      - /pb_data
    networks:
      - SociosNet
    deploy:
      mode: replicated
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
      labels:
        - "traefik.enable=true"
        - "traefik.docker.network=SociosNet"
        - "traefik.http.routers.zenmedix-api.rule=Host(`api-consultorio.logicapp.net`)"
        - "traefik.http.routers.zenmedix-api.entrypoints=websecure"
        - "traefik.http.routers.zenmedix-api.tls.certresolver=letsencryptresolver"
        - "traefik.http.services.zenmedix-api.loadbalancer.server.port=80"

networks:
  SociosNet:
    external: true
```

### 2. Configurar Colecciones en PocketBase

1. Accede a `https://api-consultorio.logicapp.net/_/`
2. Crea un superusuario inicial
3. Ve a **Settings > Import collections**
4. Importa el archivo `pb_schema.json`

### 3. Crear Usuario Admin Inicial

En PocketBase Admin:
1. Ve a Collections > users
2. Crea un nuevo registro:
   - email: tu-email@ejemplo.com
   - password: (una contraseña segura)
   - name: Tu Nombre
   - role: superadmin

### 4. Desplegar Frontend

**Opción A: GitHub Actions (Recomendado)**

1. Sube el código a GitHub
2. El workflow en `.github/workflows/docker-build.yml` construirá y publicará la imagen
3. En Portainer, crea el servicio frontend usando la imagen `ghcr.io/joel110311/zenmedix:latest`

**Opción B: Construcción Local**

```bash
# Construir imagen
docker build -t zenmedix-frontend .

# Etiquetar para registro
docker tag zenmedix-frontend ghcr.io/tu-usuario/zenmedix:latest

# Subir
docker push ghcr.io/tu-usuario/zenmedix:latest
```

## Configuración en Portainer

### Backend (PocketBase)

| Configuración | Valor |
|--------------|-------|
| Image | `spectado/pocketbase:latest` |
| Network | `SociosNet` |
| Volume | `/pb_data` (persistir datos) |
| Traefik router | `zenmedix-api` |
| Host | `api-consultorio.logicapp.net` |
| Port | 80 |

### Frontend

| Configuración | Valor |
|--------------|-------|
| Image | `ghcr.io/joel110311/zenmedix:latest` |
| Network | `SociosNet` |
| Traefik router | `zenmedix` |
| Host | `consultorio.logicapp.net` |
| Port | 80 |

## Integración con n8n

### Endpoints Disponibles

**Crear Cita:**
```
POST https://api-consultorio.logicapp.net/api/collections/appointments/records

Headers:
  Content-Type: application/json

Body:
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

**Verificar Disponibilidad:**
```
GET https://api-consultorio.logicapp.net/api/collections/appointments/records
?filter=(date="2026-01-20" && time="10:00" && status!="cancelled")
```

### Autenticación para n8n

Para crear citas desde n8n sin autenticación de usuario:
1. En PocketBase, la colección `appointments` tiene `createRule: ""` (público)
2. Para mayor seguridad, puedes agregar un campo `apiKey` y validarlo

## Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar PocketBase local (Docker)
docker run -d -p 8090:8090 -v ./pb_data:/pb_data spectado/pocketbase:latest

# 3. Configurar PocketBase
# Accede a http://localhost:8090/_/
# Importa pb_schema.json
# Crea usuario admin

# 4. Iniciar frontend
npm run dev
```

## Migración de Datos

Si tienes datos en localStorage que quieres migrar:

1. Abre la consola del navegador en la app antigua
2. Ejecuta:
```javascript
// Exportar datos
const data = {
  patients: JSON.parse(localStorage.getItem('medflow_patients') || '[]'),
  appointments: JSON.parse(localStorage.getItem('medflow_appointments') || '[]'),
  consultations: JSON.parse(localStorage.getItem('medflow_consultations') || '[]')
};
console.log(JSON.stringify(data, null, 2));
```
3. Copia el JSON
4. Importa en PocketBase usando la API REST o el Admin UI

## Troubleshooting

### Error de CORS
Asegúrate de que CORS esté habilitado en PocketBase Settings.

### Error de Conexión
Verifica que la URL en `.env.production` sea correcta:
```
VITE_POCKETBASE_URL=https://api-consultorio.logicapp.net
```

### Error 401 Unauthorized
El token de sesión puede haber expirado. Cierra sesión y vuelve a iniciar.

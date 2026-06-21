# CapitalFlow SaaS

Sistema de administración de créditos e inversiones con arquitectura multi-tenant.

## Requisitos

- Node.js 18+ 
- npm o yarn

## Instalación en Windows

```bash
# 1. Descomprimir el ZIP
# Haz clic derecho en capitalflow-saas.zip y selecciona "Extraer aquí"

# 2. Abrir PowerShell o CMD en la carpeta
cd capitalflow-saas

# 3. Instalar dependencias (esto creará la carpeta node_modules)
npm install

# 4. Iniciar el servidor
npm start
```

El servidor arrancará en **http://localhost:3000**

### Si `npm install` da error:

1. Asegúrate de estar en la carpeta correcta: `cd capitalflow-saas`
2. Verifica que exista el archivo `package.json`
3. Si sigue fallando, intenta: `npm cache clean --force` y luego `npm install`

## Credenciales de prueba

### Super Admin (tú controlas todo el SaaS)
- **Email:** admin@capitalflow.com
- **Contraseña:** admin123

### Tenants (empresas clientes)

| Identificador | Email | Contraseña |
|---------------|-------|------------|
| `miempresa` | admin@miempresa.com | demo123 |
| `inversiones` | admin@inversiones.com | demo123 |
| `demo` | demo@capitalflow.com | demo123 |

## Estructura del proyecto

```
capitalflow-saas/
├── server.js           # Servidor Express principal
├── db.js               # Configuración SQLite y migraciones
├── package.json        # Dependencias
├── routes/
│   ├── auth.js         # Rutas de autenticación
│   └── tenants.js      # Gestión de tenants y sus datos
└── public/
    └── index.html      # Frontend (SPA)
```

## Base de datos

El proyecto usa **SQLite** (archivo `capitalflow.db`) que se crea automáticamente al iniciar el servidor. Incluye:

- Tabla `super_admin` - Administrador del SaaS
- Tabla `tenants` - Empresas clientes
- Tabla `clients` - Clientes de cada tenant
- Tabla `credits` - Créditos otorgados
- Tabla `payments` - Pagos registrados

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login (Super Admin o Tenant)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

### Tenants (requiere Super Admin)
- `GET /api/tenants` - Listar todos los tenants
- `POST /api/tenants` - Crear nuevo tenant
- `PATCH /api/tenants/:id/status` - Suspender/activar tenant
- `DELETE /api/tenants/:id` - Eliminar tenant

### Datos del Tenant
- `GET /api/tenants/:id/clients` - Clientes del tenant
- `POST /api/tenants/:id/clients` - Crear cliente
- `GET /api/tenants/:id/credits` - Créditos del tenant
- `POST /api/tenants/:id/credits` - Crear crédito
- `GET /api/tenants/:id/stats` - Estadísticas del tenant

## Producción

Para producción:

1. Cambia la clave secreta en `server.js`:
```javascript
secret: 'TU_CLAVE_SECRETA_SEGURA_AQUI'
```

2. Configura HTTPS y cookies seguras:
```javascript
cookie: { 
  secure: true,
  // ...
}
```

3. Usa PostgreSQL o MySQL en lugar de SQLite para producción

4. Configura variables de entorno:
```bash
PORT=3000
NODE_ENV=production
DB_PATH=/ruta/a/tu/base.db
```

## Siguientes pasos

- [ ] Módulo completo de créditos con tabla de amortización
- [ ] Cálculo automático de intereses
- [ ] Gestión de pagos y cuotas
- [ ] Reportes financieros
- [ ] Exportación a Excel/PDF
- [ ] Notificaciones por email
- [ ] Sistema de roles y permisos

## Licencia

MIT

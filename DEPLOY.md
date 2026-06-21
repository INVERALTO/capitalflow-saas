# Despliegue en GitHub + Render/Railway

## 1. Subir a GitHub

### Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `capitalflow-saas`
3. Público o privado (tu elección)
4. NO marques "Add README" ni ".gitignore" (ya los tienes)
5. Click en "Create repository"

### Subir tu código desde CMD
```bash
cd "C:\INVER ALTO\ALFREDO TORO\LABORATORIO\SAAS\capitalflow-saas"

# Inicializar git
git init

# Agregar archivos
git add .

# Primer commit
git commit -m "Initial commit - CapitalFlow SaaS"

# Conectar con GitHub (cambia TU_USUARIO por tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/capitalflow-saas.git

# Subir código
git branch -M main
git push -u origin main
```

## 2. Desplegar en Render (Gratis)

1. Ve a https://render.com y crea cuenta (puedes usar GitHub)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: capitalflow-saas (o el que quieras)
   - **Region**: Oregon (o la más cercana)
   - **Branch**: main
   - **Root Directory**: (dejar vacío)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Click en "Advanced" → "Add Environment Variable":
   - KEY: `NODE_ENV` VALUE: `production`
   - KEY: `SESSION_SECRET` VALUE: `cualquier-cosa-larga-y-aleatoria-aqui`

6. Click en "Create Web Service"

Render te dará una URL como: `capitalflow-saas.onrender.com`

## 3. Desplegar en Railway (Gratis)

1. Ve a https://railway.app y crea cuenta
2. Click en "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio `capitalflow-saas`
4. Railway detecta automáticamente que es Node.js
5. En "Variables" agrega:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: `cualquier-cosa-larga-y-aleatoria-aqui`
6. Click en "Deploy"

Railway te dará una URL como: `capitalflow-saas.up.railway.app`

## Notas importantes

- **Base de datos**: SQLite se crea automáticamente en el servidor. Los datos se pierden si el servicio se reinicia. Para producción real, migra a PostgreSQL (Render y Railway lo ofrecen gratis).
- **Sesiones**: Con `SESSION_SECRET` configurado, las sesiones funcionan correctamente.
- **HTTPS**: Automático en ambos servicios.

## Credenciales de prueba

Una vez desplegado, usa las mismas credenciales:

**Super Admin:**
- Email: `admin@capitalflow.com`
- Contraseña: `admin123`

**Tenant demo:**
- Identificador: `demo`
- Email: `demo@capitalflow.com`
- Contraseña: `demo123`

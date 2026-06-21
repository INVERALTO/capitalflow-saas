const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'capitalflow-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction, // true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));

// Ruta principal - servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar base de datos y arrancar servidor
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CapitalFlow SaaS corriendo en http://localhost:${PORT}\n`);
    console.log('📋 Credenciales de prueba:');
    console.log('   Super Admin: admin@capitalflow.com / admin123');
    console.log('   Tenant demo: CF/demo / demo@capitalflow.com / demo123');
    console.log('   Tenant miempresa: CF/miempresa / admin@miempresa.com / demo123\n');
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});

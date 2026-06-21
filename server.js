const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDB, saveDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'capitalflow-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      saveDB();
    }
    return originalSend.call(this, data);
  };
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log('CapitalFlow SaaS corriendo en puerto ' + PORT);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
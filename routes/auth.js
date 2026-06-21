const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet } = require('../db');

// Login
router.post('/login', async (req, res) => {
  const { mode, tenantId, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    if (mode === 'superadmin') {
      // Login Super Admin
      const admin = await dbGet('SELECT * FROM super_admin WHERE email = ?', [email]);
      
      if (!admin) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const validPassword = bcrypt.compareSync(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      // Guardar sesión
      req.session.user = {
        role: 'superadmin',
        id: admin.id,
        name: admin.name,
        email: admin.email
      };

      res.json({
        success: true,
        user: {
          role: 'superadmin',
          name: admin.name,
          email: admin.email
        }
      });

    } else {
      // Login Tenant
      if (!tenantId) {
        return res.status(400).json({ error: 'Identificador de empresa requerido' });
      }

      const tenant = await dbGet('SELECT * FROM tenants WHERE id = ?', [tenantId]);
      
      if (!tenant) {
        return res.status(401).json({ error: 'Identificador de empresa no encontrado' });
      }

      if (tenant.status === 'suspended') {
        return res.status(403).json({ error: 'Esta empresa tiene el acceso suspendido' });
      }

      if (tenant.email !== email) {
        return res.status(401).json({ error: 'El correo no coincide con esta empresa' });
      }

      const validPassword = bcrypt.compareSync(password, tenant.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // Guardar sesión
      req.session.user = {
        role: 'tenant',
        tenantId: tenant.id,
        company: tenant.company,
        adminName: tenant.admin_name,
        email: tenant.email
      };

      res.json({
        success: true,
        user: {
          role: 'tenant',
          tenantId: tenant.id,
          company: tenant.company,
          adminName: tenant.admin_name,
          email: tenant.email
        }
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Obtener usuario actual
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;

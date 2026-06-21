const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll } = require('../db');

// Middleware para verificar que sea Super Admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Super Admin.' });
  }
  next();
};

// Obtener todos los tenants
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await dbAll(`
      SELECT id, company, email, admin_name, plan, status, created_at 
      FROM tenants 
      ORDER BY created_at DESC
    `);

    // Agregar estadísticas por tenant
    const tenantsWithStats = [];
    for (const t of tenants) {
      const stats = await dbGet(`
        SELECT 
          COUNT(DISTINCT c.id) as total_clients,
          COUNT(DISTINCT cr.id) as total_credits,
          COALESCE(SUM(cr.amount), 0) as total_capital
        FROM clients c
        LEFT JOIN credits cr ON c.id = cr.client_id AND c.tenant_id = cr.tenant_id
        WHERE c.tenant_id = ?
      `, [t.id]);

      tenantsWithStats.push({
        ...t,
        clients: stats.total_clients,
        credits: stats.total_credits,
        capital: stats.total_capital
      });
    }

    res.json({ tenants: tenantsWithStats });
  } catch (error) {
    console.error('Error al obtener tenants:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener un tenant específico
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await dbGet(`
      SELECT id, company, email, admin_name, plan, status, created_at 
      FROM tenants 
      WHERE id = ?
    `, [req.params.id]);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear nuevo tenant
router.post('/', requireSuperAdmin, async (req, res) => {
  const { id, company, email, password, adminName, plan } = req.body;

  if (!id || !company || !email || !password || !adminName) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  // Validar formato del ID
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanId) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  try {
    // Verificar que no exista
    const existing = await dbGet('SELECT id FROM tenants WHERE id = ?', [cleanId]);
    if (existing) {
      return res.status(409).json({ error: 'El identificador ya existe' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    await dbRun(`
      INSERT INTO tenants (id, company, email, password, admin_name, plan) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cleanId, company, email, hashedPassword, adminName, plan || 'basic']);

    res.json({ 
      success: true, 
      tenant: { id: cleanId, company, email, adminName, plan: plan || 'basic' }
    });
  } catch (error) {
    console.error('Error al crear tenant:', error);
    res.status(500).json({ error: 'Error al crear el tenant' });
  }
});

// Actualizar estado del tenant (suspender/activar)
router.patch('/:id/status', requireSuperAdmin, async (req, res) => {
  const { status } = req.body;
  
  if (!['online', 'suspended', 'trial'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const result = await dbRun('UPDATE tenants SET status = ? WHERE id = ?', [status, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar tenant
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM tenants WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// === RUTAS PARA TENANTS (acceso a sus propios datos) ===

// Obtener clientes del tenant
router.get('/:id/clients', async (req, res) => {
  // Verificar que el usuario tenga acceso a este tenant
  if (!req.session.user || 
      (req.session.user.role === 'tenant' && req.session.user.tenantId !== req.params.id)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const clients = await dbAll(`
      SELECT * FROM clients WHERE tenant_id = ? ORDER BY created_at DESC
    `, [req.params.id]);

    res.json({ clients });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear cliente para el tenant
router.post('/:id/clients', async (req, res) => {
  if (!req.session.user || 
      (req.session.user.role === 'tenant' && req.session.user.tenantId !== req.params.id)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { name, email, phone, address } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }

  try {
    const result = await dbRun(`
      INSERT INTO clients (tenant_id, name, email, phone, address) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, name, email || null, phone || null, address || null]);

    res.json({ 
      success: true, 
      client: { id: result.lastID, tenant_id: req.params.id, name, email, phone, address }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
});

// Obtener créditos del tenant
router.get('/:id/credits', async (req, res) => {
  if (!req.session.user || 
      (req.session.user.role === 'tenant' && req.session.user.tenantId !== req.params.id)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const credits = await dbAll(`
      SELECT c.*, cl.name as client_name 
      FROM credits c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.tenant_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    res.json({ credits });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear crédito para el tenant
router.post('/:id/credits', async (req, res) => {
  if (!req.session.user || 
      (req.session.user.role === 'tenant' && req.session.user.tenantId !== req.params.id)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { clientId, amount, interestRate, termMonths } = req.body;
  
  if (!clientId || !amount || !interestRate || !termMonths) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const result = await dbRun(`
      INSERT INTO credits (tenant_id, client_id, amount, interest_rate, term_months) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, clientId, amount, interestRate, termMonths]);

    res.json({ 
      success: true, 
      credit: { 
        id: result.lastID, 
        tenant_id: req.params.id, 
        client_id: clientId, 
        amount, 
        interest_rate: interestRate, 
        term_months: termMonths 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el crédito' });
  }
});

// Obtener estadísticas del tenant
router.get('/:id/stats', async (req, res) => {
  if (!req.session.user || 
      (req.session.user.role === 'tenant' && req.session.user.tenantId !== req.params.id)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const stats = await dbGet(`
      SELECT 
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT cr.id) as total_credits,
        COALESCE(SUM(cr.amount), 0) as total_capital,
        COUNT(DISTINCT CASE WHEN cr.status = 'active' THEN cr.id END) as active_credits,
        COUNT(DISTINCT CASE WHEN cr.status = 'overdue' THEN cr.id END) as overdue_credits
      FROM clients c
      LEFT JOIN credits cr ON c.id = cr.client_id AND c.tenant_id = cr.tenant_id
      WHERE c.tenant_id = ?
    `, [req.params.id]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

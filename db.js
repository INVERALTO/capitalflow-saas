const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'capitalflow.db'));

// Función para promisificar consultas
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Inicializar base de datos
async function initDB() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Crear tablas
        db.run(`CREATE TABLE IF NOT EXISTS super_admin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tenants (
          id TEXT PRIMARY KEY,
          company TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          admin_name TEXT NOT NULL,
          plan TEXT DEFAULT 'basic',
          status TEXT DEFAULT 'online',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS credits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL,
          client_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          interest_rate REAL NOT NULL,
          term_months INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          start_date DATE DEFAULT CURRENT_DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          credit_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          payment_date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (credit_id) REFERENCES credits(id)
        )`);

        // Crear Super Admin si no existe
        const adminExists = await dbGet('SELECT id FROM super_admin LIMIT 1');
        if (!adminExists) {
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          await dbRun(
            'INSERT INTO super_admin (email, password, name) VALUES (?, ?, ?)',
            ['admin@capitalflow.com', hashedPassword, 'Super Admin']
          );
          console.log('✓ Super Admin creado: admin@capitalflow.com / admin123');
        }

        // Crear tenants demo si no existen
        const tenantCount = await dbGet('SELECT COUNT(*) as count FROM tenants');
        if (tenantCount.count === 0) {
          const demoTenants = [
            { id: 'miempresa', company: 'Mi Empresa S.A.', email: 'admin@miempresa.com', password: 'demo123', admin: 'Carlos Mendoza', plan: 'pro' },
            { id: 'inversiones', company: 'Inversiones del Norte', email: 'admin@inversiones.com', password: 'demo123', admin: 'Ana López', plan: 'enterprise' },
            { id: 'demo', company: 'CapitalFlow Demo', email: 'demo@capitalflow.com', password: 'demo123', admin: 'Usuario Demo', plan: 'basic' }
          ];

          for (const t of demoTenants) {
            const hashedPassword = bcrypt.hashSync(t.password, 10);
            await dbRun(
              'INSERT INTO tenants (id, company, email, password, admin_name, plan) VALUES (?, ?, ?, ?, ?, ?)',
              [t.id, t.company, t.email, hashedPassword, t.admin, t.plan]
            );
          }
          console.log('✓ Tenants demo creados');

          // Crear clientes demo
          const demoClients = [
            { tenant: 'miempresa', name: 'María González', email: 'maria@email.com', phone: '555-0101' },
            { tenant: 'miempresa', name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '555-0102' },
            { tenant: 'miempresa', name: 'Ana Martínez', email: 'ana@email.com', phone: '555-0103' },
            { tenant: 'inversiones', name: 'Pedro Herrera', email: 'pedro@email.com', phone: '555-0201' },
            { tenant: 'inversiones', name: 'Sofía Vargas', email: 'sofia@email.com', phone: '555-0202' },
            { tenant: 'demo', name: 'Cliente Demo 1', email: 'demo1@email.com', phone: '555-0301' }
          ];

          for (const c of demoClients) {
            await dbRun(
              'INSERT INTO clients (tenant_id, name, email, phone) VALUES (?, ?, ?, ?)',
              [c.tenant, c.name, c.email, c.phone]
            );
          }
          console.log('✓ Clientes demo creados');
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { db, dbRun, dbGet, dbAll, initDB };

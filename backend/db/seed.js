const { db, dbRun } = require('./database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  console.log('Seeding SQLite database...');

  try {
    // Drop existing tables
    await dbRun('DROP TABLE IF EXISTS inspections');
    await dbRun('DROP TABLE IF EXISTS assets');
    await dbRun('DROP TABLE IF EXISTS users');

    console.log('Old tables dropped.');

    // Create users table
    await dbRun(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'inspector')) NOT NULL
      )
    `);

    // Create assets table
    await dbRun(`
      CREATE TABLE assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        status TEXT CHECK(status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active'
      )
    `);

    // Create inspections table
    await dbRun(`
      CREATE TABLE inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        inspector_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('draft', 'pending', 'approved')) DEFAULT 'draft',
        findings TEXT NOT NULL,
        recommendations TEXT DEFAULT '',
        attachments TEXT DEFAULT '[]', -- JSON array of filenames
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created successfully.');

    // Seed Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const inspectorPassword = await bcrypt.hash('inspector123', salt);

    await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Alice Admin', 'admin@platform.com', adminPassword, 'admin']
    );

    await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Bob Inspector', 'inspector@platform.com', inspectorPassword, 'inspector']
    );

    await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Maria Inspector', 'maria@platform.com', inspectorPassword, 'inspector']
    );

    console.log('Users seeded.');

    // Seed Assets
    await dbRun(
      'INSERT INTO assets (name, code, type, status) VALUES (?, ?, ?, ?)',
      ['Wind Turbine Alpha', 'WT-001', 'turbine', 'active']
    );
    await dbRun(
      'INSERT INTO assets (name, code, type, status) VALUES (?, ?, ?, ?)',
      ['Offshore Pipeline Bravo', 'PL-002', 'pipeline', 'maintenance']
    );
    await dbRun(
      'INSERT INTO assets (name, code, type, status) VALUES (?, ?, ?, ?)',
      ['Thermal Camera Drone Gamma', 'DR-003', 'drone', 'active']
    );
    await dbRun(
      'INSERT INTO assets (name, code, type, status) VALUES (?, ?, ?, ?)',
      ['Decommissioned Generator Delta', 'GN-004', 'generator', 'inactive']
    );

    console.log('Assets seeded.');

    // Seed Inspections
    // Get inspector and admin ids
    const bob = await new Promise((resolve) =>
      db.get("SELECT id FROM users WHERE email = 'inspector@platform.com'", (err, row) => resolve(row))
    );
    const maria = await new Promise((resolve) =>
      db.get("SELECT id FROM users WHERE email = 'maria@platform.com'", (err, row) => resolve(row))
    );

    await dbRun(
      `INSERT INTO inspections (asset_id, inspector_id, date, status, findings, recommendations, attachments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        maria.id,
        '2026-05-15T14:30:00.000Z',
        'approved',
        'Blades exhibit surface wear but structural integrity is intact.',
        'Monitor blade tips on next scheduled inspection.',
        JSON.stringify(['turbine_blade_detail.jpg'])
      ]
    );

    await dbRun(
      `INSERT INTO inspections (asset_id, inspector_id, date, status, findings, recommendations, attachments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        2,
        bob.id,
        '2026-05-20T10:15:00.000Z',
        'pending',
        'External corrosion spotted on segment 4B.',
        'Apply anti-corrosive coating.',
        JSON.stringify(['pipeline_corrosion_4b.jpg', 'pipeline_overview.jpg'])
      ]
    );

    await dbRun(
      `INSERT INTO inspections (asset_id, inspector_id, date, status, findings, recommendations, attachments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        3,
        bob.id,
        '2026-05-28T09:00:00.000Z',
        'draft',
        'Battery life checking. Slight degradation observed.',
        'Replace battery in next 3 months.',
        JSON.stringify([])
      ]
    );

    console.log('Inspections seeded.');
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

// If run directly
if (require.main === module) {
  seed().then(() => {
    db.close();
  });
}

module.exports = seed;

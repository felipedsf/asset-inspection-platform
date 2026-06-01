const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/assets - List all assets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const assets = await dbAll('SELECT * FROM assets ORDER BY id DESC');
    res.json(assets);
  } catch (error) {
    console.error('List assets error:', error);
    res.status(500).json({ error: 'Server error listing assets' });
  }
});

// GET /api/assets/search - Search assets (Vulnerable to SQL Injection: Bug 4)
router.get('/search', authenticateToken, async (req, res) => {
  const searchTerm = req.query.q || '';

  try {
    // BUG 4: Hidden SQL Injection. We interpolate user input directly into the SQL string.
    const sql = `SELECT * FROM assets WHERE name LIKE '%${searchTerm}%' OR code LIKE '%${searchTerm}%'`;
    console.log(`Executing SQL: ${sql}`); // helpful debug log for students to see the injection
    const assets = await dbAll(sql);
    res.json(assets);
  } catch (error) {
    console.error('Search assets error:', error);
    res.status(500).json({ error: 'Server error searching assets' });
  }
});

// GET /api/assets/:id - Get single asset
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const asset = await dbGet('SELECT * FROM assets WHERE id = ?', [id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Server error retrieving asset' });
  }
});

// POST /api/assets - Create asset (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, code, type, status } = req.body;

  if (!name || !code || !type) {
    return res.status(400).json({ error: 'Name, code, and type are required' });
  }

  try {
    const existing = await dbGet('SELECT id FROM assets WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ error: 'Asset with this code already exists' });
    }

    const assetStatus = status || 'active';
    const result = await dbRun(
      'INSERT INTO assets (name, code, type, status) VALUES (?, ?, ?, ?)',
      [name, code, type, assetStatus]
    );

    res.status(201).json({
      id: result.id,
      name,
      code,
      type,
      status: assetStatus
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Server error creating asset' });
  }
});

// PUT /api/assets/:id - Update asset (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, code, type, status } = req.body;

  if (!name || !code || !type || !status) {
    return res.status(400).json({ error: 'Name, code, type, and status are required' });
  }

  try {
    const asset = await dbGet('SELECT * FROM assets WHERE id = ?', [id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check code uniqueness (if changed)
    if (code !== asset.code) {
      const existing = await dbGet('SELECT id FROM assets WHERE code = ? AND id != ?', [code, id]);
      if (existing) {
        return res.status(400).json({ error: 'Asset with this code already exists' });
      }
    }

    await dbRun(
      'UPDATE assets SET name = ?, code = ?, type = ?, status = ? WHERE id = ?',
      [name, code, type, status, id]
    );

    res.json({
      id: parseInt(id),
      name,
      code,
      type,
      status
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Server error updating asset' });
  }
});

// DELETE /api/assets/:id - Delete asset (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const asset = await dbGet('SELECT * FROM assets WHERE id = ?', [id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await dbRun('DELETE FROM assets WHERE id = ?', [id]);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Server error deleting asset' });
  }
});

module.exports = router;

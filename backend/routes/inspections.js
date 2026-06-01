const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbGet, dbAll, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Multer storage setup for attachments
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/inspections - List all inspections (Contains N+1 Query: Bug 1)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch base inspection records
    const inspections = await dbAll('SELECT * FROM inspections ORDER BY id DESC');

    // BUG 1: N+1 Query. For every inspection in the database, we make separate queries to fetch
    // associated asset name, asset code, and inspector name. If there are N inspections,
    // this executes 2*N queries (+ 1 initial query) against SQLite, causing bad performance.
    const populatedInspections = [];
    for (const insp of inspections) {
      const asset = await dbGet('SELECT name, code FROM assets WHERE id = ?', [insp.asset_id]);
      const inspector = await dbGet('SELECT name FROM users WHERE id = ?', [insp.inspector_id]);

      populatedInspections.push({
        ...insp,
        attachments: JSON.parse(insp.attachments || '[]'),
        asset_name: asset ? asset.name : 'Unknown Asset',
        asset_code: asset ? asset.code : 'N/A',
        inspector_name: inspector ? inspector.name : 'Unknown Inspector'
      });
    }

    res.json(populatedInspections);
  } catch (error) {
    console.error('List inspections error:', error);
    res.status(500).json({ error: 'Server error listing inspections' });
  }
});

// GET /api/inspections/:id - Get single inspection details
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Perform standard join for detail endpoint (single record is fast)
    const sql = `
      SELECT i.*, a.name as asset_name, a.code as asset_code, u.name as inspector_name
      FROM inspections i
      LEFT JOIN assets a ON i.asset_id = a.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.id = ?
    `;
    const inspection = await dbGet(sql, [id]);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    inspection.attachments = JSON.parse(inspection.attachments || '[]');
    res.json(inspection);
  } catch (error) {
    console.error('Get inspection error:', error);
    res.status(500).json({ error: 'Server error retrieving inspection' });
  }
});

// POST /api/inspections - Create inspection
router.post('/', authenticateToken, async (req, res) => {
  const { asset_id, findings, recommendations } = req.body;

  if (!asset_id || !findings) {
    return res.status(400).json({ error: 'Asset ID and findings are required' });
  }

  try {
    // Verify asset exists
    const asset = await dbGet('SELECT id FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const date = new Date().toISOString();
    const status = 'draft'; // default to draft
    const attachments = JSON.stringify([]);

    const result = await dbRun(
      `INSERT INTO inspections (asset_id, inspector_id, date, status, findings, recommendations, attachments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asset_id, req.user.id, date, status, findings, recommendations || '', attachments]
    );

    res.status(201).json({
      id: result.id,
      asset_id,
      inspector_id: req.user.id,
      date,
      status,
      findings,
      recommendations: recommendations || '',
      attachments: []
    });
  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({ error: 'Server error creating inspection' });
  }
});

// PUT /api/inspections/:id - Update inspection details (Contains Business Logic Bypass: Bug 5)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { findings, recommendations, status } = req.body;

  try {
    const inspection = await dbGet('SELECT * FROM inspections WHERE id = ?', [id]);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Role-based editing rules: inspector can only edit their own draft/pending inspections
    if (req.user.role !== 'admin' && inspection.inspector_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own inspections' });
    }

    // Role-based approval rules: only admin can change status to approved
    if (status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can approve inspections' });
    }

    // BUG 5: Business Logic Bypass. The rule is: "Approved inspections are locked and cannot be edited."
    // However, the backend does NOT verify if the CURRENT state of the inspection in the database is 'approved'.
    // It only checks the user's role and input status. Therefore, an inspector (or admin) can edit
    // the findings or recommendations of an already approved inspection!
    const newFindings = findings !== undefined ? findings : inspection.findings;
    const newRecommendations = recommendations !== undefined ? recommendations : inspection.recommendations;
    const newStatus = status !== undefined ? status : inspection.status;

    await dbRun(
      'UPDATE inspections SET findings = ?, recommendations = ?, status = ? WHERE id = ?',
      [newFindings, newRecommendations, newStatus, id]
    );

    res.json({
      id: parseInt(id),
      asset_id: inspection.asset_id,
      inspector_id: inspection.inspector_id,
      date: inspection.date,
      status: newStatus,
      findings: newFindings,
      recommendations: newRecommendations,
      attachments: JSON.parse(inspection.attachments || '[]')
    });
  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({ error: 'Server error updating inspection' });
  }
});

// POST /api/inspections/:id/attachments - Upload inspection attachment (Contains Race Condition: Bug 3)
router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // BUG 3: Race Condition. We read the existing list of attachments from the database.
    const inspection = await dbGet('SELECT * FROM inspections WHERE id = ?', [id]);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const attachments = JSON.parse(inspection.attachments || '[]');
    attachments.push(req.file.filename);

    // Simulate an asynchronous delay (like image resizing, S3 upload emulation, or scanning)
    // This widens the window for the race condition to occur under concurrent uploads.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // We write the modified array back to the database.
    // If two uploads are triggered concurrently, they both read the same initial state,
    // append their respective file, and write back, resulting in one of the files overwriting the other.
    await dbRun('UPDATE inspections SET attachments = ? WHERE id = ?', [JSON.stringify(attachments), id]);

    res.json({
      filename: req.file.filename,
      attachments
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Server error uploading attachment' });
  }
});

module.exports = router;

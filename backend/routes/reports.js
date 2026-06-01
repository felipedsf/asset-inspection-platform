const express = require('express');
const router = Router = express.Router();
const { dbGet } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const systemEvents = require('../utils/eventEmitter');

// GET /api/reports/summary - Get operational summary (Contains Memory Leak: Bug 2)
router.get('/summary', authenticateToken, async (req, res) => {
  // BUG 2: Memory Leak. We attach an event listener to the global 'systemEvents' emitter
  // inside the request handler. Since systemEvents lives forever, every HTTP request
  // adds another listener. Over time, these listeners accumulate in memory and reference the
  // request object (via closure), causing a severe memory leak.
  systemEvents.on('reportGenerated', (reportData) => {
    // This closure captures the req and res objects, preventing them from being garbage collected.
    console.log(`[AUDIT] Report generated for user ${req.user.name} (Role: ${req.user.role})`);
  });

  try {
    const assetsCount = await dbGet('SELECT COUNT(*) as count FROM assets');
    const inspectionsCount = await dbGet('SELECT COUNT(*) as count FROM inspections');
    
    const draftCount = await dbGet("SELECT COUNT(*) as count FROM inspections WHERE status = 'draft'");
    const pendingCount = await dbGet("SELECT COUNT(*) as count FROM inspections WHERE status = 'pending'");
    const approvedCount = await dbGet("SELECT COUNT(*) as count FROM inspections WHERE status = 'approved'");

    const criticalAssets = await dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'");

    const summary = {
      totalAssets: assetsCount.count,
      totalInspections: inspectionsCount.count,
      inspectionsByStatus: {
        draft: draftCount.count,
        pending: pendingCount.count,
        approved: approvedCount.count
      },
      criticalAssets: criticalAssets.count
    };

    // Emit the event to trigger the leak
    systemEvents.emit('reportGenerated', summary);

    res.json(summary);
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ error: 'Server error generating summary report' });
  }
});

// GET /api/reports/listeners - Utility endpoint for students to verify the leak
router.get('/debug/listeners', authenticateToken, (req, res) => {
  const listenerCount = systemEvents.listenerCount('reportGenerated');
  res.json({
    activeListeners: listenerCount,
    warning: listenerCount > 10 ? 'Memory leak detected! Emitter contains too many active listeners.' : 'Listener count is normal for a single run.'
  });
});

module.exports = router;

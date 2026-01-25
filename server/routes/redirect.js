const express = require('express');
const path = require('path');
const { qrDb, analyticsDb } = require('../db/database');
const router = express.Router();

// Handle edit page for anonymous QR codes
router.get('/:shortId/edit', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/edit.html'));
});

// Handle management page for QR codes
router.get('/:shortId/manage', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/manage.html'));
});

// Handle QR code redirection
router.get('/:shortId', (req, res) => {
  const { shortId } = req.params;

  try {
    console.log(`[Redirect] Request for shortId: ${shortId}`);
    const qr = qrDb.findByShortId(shortId);

    if (!qr) {
      console.log(`[Redirect] QR not found for: ${shortId}`);
      return res.status(404).sendFile(path.join(__dirname, '../../public/404.html'));
    }

    console.log(`[Redirect] Found URL: ${qr.url}, ID: ${qr.id}`);

    // Log visit asynchronously
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'Unknown';
      const referer = req.get('Referer') || 'Direct';

      console.log(`[Redirect] Logging visit from IP: ${ip}`);
      analyticsDb.logVisit(qr.id, ip, userAgent, referer);

      // Update visit count
      qrDb.incrementVisits(qr.id);
      console.log(`[Redirect] Visit count updated`);
    } catch (analyticsError) {
      console.error('[Redirect] Analytics error:', analyticsError);
    }

    // Add headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.redirect(qr.url);
  } catch (error) {
    console.error('[Redirect] Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;

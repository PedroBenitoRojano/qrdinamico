const express = require('express');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const { qrDb, analyticsDb } = require('../db/database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Create new QR code
router.post('/', async (req, res) => {
    try {
        const { url, title, alias } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        let shortId;

        // Custom alias handling
        if (alias) {
            // Validate alias format (alphanumeric, hyphens, underscores)
            if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
                return res.status(400).json({ error: 'El alias solo puede contener letras, números, guiones y guiones bajos.' });
            }

            // Check availability
            if (qrDb.shortIdExists(alias)) {
                return res.status(400).json({ error: 'Este alias ya está en uso. Por favor elige otro.' });
            }

            shortId = alias;
        } else {
            // Generate unique short ID
            let attempts = 0;
            do {
                shortId = nanoid(8);
                attempts++;
                if (attempts > 10) {
                    return res.status(500).json({ error: 'Failed to generate unique ID' });
                }
            } while (qrDb.shortIdExists(shortId));
        }

        // Get user ID if authenticated
        const userId = req.isAuthenticated() ? req.user.id : null;

        // Create QR code with title
        const qrCode = qrDb.create(shortId, url, userId, title || null);

        // Generate short URL
        const shortUrl = `${process.env.BASE_URL}/qr/${shortId}`;

        res.json({
            id: qrCode.id,
            shortId: qrCode.short_id,
            shortUrl,
            url: qrCode.url,
            title: qrCode.title,
            createdAt: qrCode.created_at
        });
    } catch (error) {
        console.error('Error creating QR code:', error);
        res.status(500).json({ error: 'Failed to create QR code' });
    }
});

// Get all QR codes for the authenticated user
router.get('/', isAuthenticated, (req, res) => {
    try {
        const qrCodes = qrDb.findByUserId(req.user.id);
        const lastVisits = analyticsDb.getLatestVisitsMap();

        const qrCodesWithUrls = qrCodes.map(qr => ({
            id: qr.id,
            shortId: qr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${qr.short_id}`,
            url: qr.url,
            title: qr.title,
            visitsCount: qr.visits_count,
            lastAccessAt: lastVisits[qr.id] || null,
            createdAt: qr.created_at,
            updatedAt: qr.updated_at
        }));

        res.json(qrCodesWithUrls);
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        res.status(500).json({ error: 'Failed to fetch QR codes' });
    }
});

// Get all anonymous QR codes (no auth required)
router.get('/anonymous', (req, res) => {
    try {
        const qrCodes = qrDb.findAllAnonymous();

        const qrCodesWithUrls = qrCodes.map(qr => ({
            id: qr.id,
            shortId: qr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${qr.short_id}`,
            url: qr.url,
            createdAt: qr.created_at,
            updatedAt: qr.updated_at
        }));

        res.json(qrCodesWithUrls);
    } catch (error) {
        console.error('Error fetching anonymous QR codes:', error);
        res.status(500).json({ error: 'Failed to fetch anonymous QR codes' });
    }
});

// Update QR code URL
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Check if QR code exists and belongs to user
        const qrCode = qrDb.findById(id);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        if (qrCode.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not own this QR code' });
        }

        // Update URL
        const updatedQr = qrDb.update(id, url);

        res.json({
            id: updatedQr.id,
            shortId: updatedQr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${updatedQr.short_id}`,
            url: updatedQr.url,
            createdAt: updatedQr.created_at,
            updatedAt: updatedQr.updated_at
        });
    } catch (error) {
        console.error('Error updating QR code:', error);
        res.status(500).json({ error: 'Failed to update QR code' });
    }
});

// Delete QR code
router.delete('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;

        // Check if QR code exists and belongs to user
        const qrCode = qrDb.findById(id);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        if (qrCode.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not own this QR code' });
        }

        // Delete QR code
        qrDb.delete(id);

        res.json({ success: true, message: 'QR code deleted' });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ error: 'Failed to delete QR code' });
    }
});

// Generate QR code image
router.get('/:identifier/image', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Check if identifier is a numeric ID or short_id
        let qrCode;
        if (/^\d+$/.test(identifier)) {
            qrCode = qrDb.findById(parseInt(identifier));
        } else {
            qrCode = qrDb.findByShortId(identifier);
        }

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        const shortUrl = `${process.env.BASE_URL}/qr/${qrCode.short_id}`;

        // Generate QR code image
        const qrImage = await QRCode.toBuffer(shortUrl, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.type('png');
        res.send(qrImage);
    } catch (error) {
        console.error('Error generating QR code image:', error);
        res.status(500).json({ error: 'Failed to generate QR code image' });
    }
});

// Get QR code data by shortId (for edit page)
router.get('/:shortId/data', async (req, res) => {
    try {
        const { shortId } = req.params;
        const qrCode = qrDb.findByShortId(shortId);

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        res.json({
            shortId: qrCode.short_id,
            url: qrCode.url,
            createdAt: qrCode.created_at,
            updatedAt: qrCode.updated_at
        });
    } catch (error) {
        console.error('Error fetching QR data:', error);
        res.status(500).json({ error: 'Failed to fetch QR data' });
    }
});

// Update anonymous QR code (no auth required)
router.put('/anonymous/:shortId', async (req, res) => {
    try {
        const { shortId } = req.params;
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Find QR code by short_id
        const qrCode = qrDb.findByShortId(shortId);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        // Only allow editing anonymous QR codes (those without user_id)
        if (qrCode.user_id !== null) {
            return res.status(403).json({ error: 'This QR code belongs to a user. Please log in to edit it.' });
        }

        // Update URL
        const updatedQr = qrDb.update(qrCode.id, url);

        res.json({
            shortId: updatedQr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${updatedQr.short_id}`,
            url: updatedQr.url,
            createdAt: updatedQr.created_at,
            updatedAt: updatedQr.updated_at
        });
    } catch (error) {
        console.error('Error updating anonymous QR code:', error);
        res.status(500).json({ error: 'Failed to update QR code' });
    }
});

// Get full QR data by shortId (for manage page)
router.get('/:shortId/full', (req, res) => {
    try {
        const { shortId } = req.params;
        const qrCode = qrDb.findByShortId(shortId);

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        res.json({
            id: qrCode.id,
            shortId: qrCode.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${qrCode.short_id}`,
            url: qrCode.url,
            title: qrCode.title,
            visitsCount: qrCode.visits_count || 0,
            userId: qrCode.user_id,
            isAnonymous: qrCode.user_id === null,
            createdAt: qrCode.created_at,
            updatedAt: qrCode.updated_at
        });
    } catch (error) {
        console.error('Error fetching QR data:', error);
        res.status(500).json({ error: 'Failed to fetch QR data' });
    }
});

// Get analytics for a specific QR code
router.get('/:shortId/analytics', (req, res) => {
    try {
        const { shortId } = req.params;
        const qrCode = qrDb.findByShortId(shortId);

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        const stats = analyticsDb.getStats(qrCode.id);
        const byDate = analyticsDb.getVisitsByDate(qrCode.id, 7);
        const recentVisits = analyticsDb.getRecentVisits(qrCode.id, 20);

        // Calculate today and week visits
        const today = new Date().toISOString().split('T')[0];
        const todayVisits = byDate.find(d => d.date === today)?.visits || 0;
        const weekVisits = byDate.reduce((sum, d) => sum + d.visits, 0);

        res.json({
            total: stats.total_visits,
            today: todayVisits,
            week: weekVisits,
            byDate,
            recentVisits
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Update QR code via manage page (no auth required for anonymous, auth for owned)
router.put('/manage/:shortId', async (req, res) => {
    try {
        const { shortId } = req.params;
        const { url, title, alias } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const qrCode = qrDb.findByShortId(shortId);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        // Check alias if changed
        if (alias && alias !== qrCode.short_id) {
            if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
                return res.status(400).json({ error: 'El alias solo puede contener letras, números, guiones y guiones bajos.' });
            }
            if (qrDb.shortIdExists(alias)) {
                return res.status(400).json({ error: 'Este alias ya está en uso. Por favor elige otro.' });
            }
        }

        // If QR belongs to a user, require authentication
        if (qrCode.user_id !== null) {
            if (!req.isAuthenticated() || req.user.id !== qrCode.user_id) {
                return res.status(403).json({ error: 'This QR belongs to a user. Please log in to edit.' });
            }
        }

        // Update QR code
        const updatedQr = qrDb.update(qrCode.id, url, title, alias || null);

        res.json({
            shortId: updatedQr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${updatedQr.short_id}`,
            url: updatedQr.url,
            title: updatedQr.title,
            updatedAt: updatedQr.updated_at
        });
    } catch (error) {
        console.error('Error updating QR code:', error);
        res.status(500).json({ error: 'Failed to update QR code' });
    }
});

// Delete QR code via manage page
router.delete('/manage/:shortId', async (req, res) => {
    try {
        const { shortId } = req.params;
        const qrCode = qrDb.findByShortId(shortId);

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        // If QR belongs to a user, require authentication
        if (qrCode.user_id !== null) {
            if (!req.isAuthenticated() || req.user.id !== qrCode.user_id) {
                return res.status(403).json({ error: 'This QR belongs to a user. Please log in to delete.' });
            }
        }

        qrDb.delete(qrCode.id);
        res.json({ success: true, message: 'QR code deleted' });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ error: 'Failed to delete QR code' });
    }
});

module.exports = router;


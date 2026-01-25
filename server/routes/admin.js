const express = require('express');
const path = require('path');
const { qrDb, analyticsDb, userDb } = require('../db/database');
const { isAdmin, isAdminPage } = require('../middleware/auth');
const router = express.Router();
// Serve admin page
router.get('/', isAdminPage, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

// Get all QR codes (admin only)
router.get('/qr', isAdmin, (req, res) => {
    try {
        const allQrs = qrDb.findAll();

        const qrCodesWithUrls = allQrs.map(qr => {
            let userEmail = null;
            if (qr.user_id) {
                const user = userDb.findById(qr.user_id);
                if (user) userEmail = user.email;
            }

            return {
                id: qr.id,
                shortId: qr.short_id,
                shortUrl: `${process.env.BASE_URL}/qr/${qr.short_id}`,
                url: qr.url,
                title: qr.title,
                userId: qr.user_id,
                userEmail: userEmail,
                isAnonymous: qr.user_id === null,
                createdAt: qr.created_at,
                updatedAt: qr.updated_at
            };
        });

        res.json(qrCodesWithUrls);
    } catch (error) {
        console.error('Error fetching all QR codes:', error);
        res.status(500).json({ error: 'Failed to fetch QR codes' });
    }
});

// Update any QR code (admin only)
router.put('/qr/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { url, title, userEmail } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const qrCode = qrDb.findById(id);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        let updatedQr = qrDb.update(id, url, title);

        // Handle user assignment
        if (userEmail !== undefined) {
            if (userEmail === '' || userEmail === 'anonimo') {
                updatedQr = qrDb.updateOwner(id, null);
            } else {
                const user = userDb.findByEmail(userEmail);
                if (user) {
                    updatedQr = qrDb.updateOwner(id, user.id);
                }
                // If user not found, we ignore the assignment for now
            }
        }

        res.json({
            id: updatedQr.id,
            shortId: updatedQr.short_id,
            shortUrl: `${process.env.BASE_URL}/qr/${updatedQr.short_id}`,
            url: updatedQr.url,
            title: updatedQr.title,
            userId: updatedQr.user_id,
            isAnonymous: updatedQr.user_id === null,
            createdAt: updatedQr.created_at,
            updatedAt: updatedQr.updated_at
        });
    } catch (error) {
        console.error('Error updating QR code:', error);
        res.status(500).json({ error: 'Failed to update QR code' });
    }
});

// Delete any QR code (admin only)
router.delete('/qr/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;

        const qrCode = qrDb.findById(id);
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        qrDb.delete(id);

        res.json({ success: true, message: 'QR code deleted' });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ error: 'Failed to delete QR code' });
    }
});

// Get stats (admin only)
router.get('/stats', isAdmin, (req, res) => {
    try {
        const allQrs = qrDb.findAll();
        const anonymousQrs = qrDb.findAllAnonymous();
        const usersQrs = allQrs.filter(qr => qr.user_id !== null);

        // Global analytics
        const globalStats = analyticsDb.getGlobalStats();

        res.json({
            total: allQrs.length,
            anonymous: anonymousQrs.length,
            withUsers: usersQrs.length,
            clicks: globalStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;

const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Google OAuth flow
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to dashboard
        res.redirect('/dashboard.html');
    }
);

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.redirect('/');
    });
});

// Get current user info
router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            picture: req.user.picture,
            isAdmin: req.user.email === process.env.ADMIN_EMAIL
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

module.exports = router;

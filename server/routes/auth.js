const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { userDb } = require('../db/database');
const router = express.Router();

// Local Registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const existingUser = userDb.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = userDb.createLocal(email, hashedPassword, name);

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: 'Error al iniciar sesión tras el registro' });
            res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error en el servidor al registrar el usuario' });
    }
});

// Local Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message || 'Error de autenticación' });

        req.login(user, (err) => {
            if (err) return next(err);
            return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
        });
    })(req, res, next);
});

// Initiate Google OAuth flow
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
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

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDatabase } = require('./db/database');
const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const redirectRoutes = require('./routes/redirect');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (async for sql.js)
(async () => {
    await initDatabase();

    // Trust proxy for secure cookies and accurate IP logging
    app.set('trust proxy', 1);

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session configuration
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        })
    );

    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // Static files
    app.use(express.static(path.join(__dirname, '../public')));

    // Routes
    app.use('/auth', authRoutes);
    app.use('/api/qr', qrRoutes);
    app.use('/qr', redirectRoutes);
    app.use('/admin', adminRoutes);

    // Explicit route for dashboard
    app.get('/dashboard', (req, res) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.redirect('/');
        }
        res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
        console.log(`📊 Database initialized`);
        console.log(`🔐 Google OAuth configured`);
        console.log(`👑 Admin panel: ${process.env.BASE_URL || `http://localhost:${PORT}`}/admin`);
    });
})(); // Close async function

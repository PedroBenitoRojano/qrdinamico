const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { userDb } = require('../db/database');

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = userDb.findByGoogleId(profile.id);

                if (!user) {
                    // Create new user (Google)
                    user = userDb.create(
                        profile.id,
                        profile.emails[0].value,
                        profile.displayName || profile.emails[0].value.split('@')[0],
                        profile.photos && profile.photos[0] ? profile.photos[0].value : null
                    );
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Local Strategy
passport.use(
    new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = userDb.findByEmail(email);

                if (!user) {
                    return done(null, false, { message: 'Usuario no encontrado' });
                }

                if (!user.password) {
                    return done(null, false, { message: 'Por favor, inicia sesión con Google' });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Contraseña incorrecta' });
                }
            } catch (error) {
                return done(error);
            }
        }
    )
);

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    try {
        const user = userDb.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userDb } = require('../db/database');

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
                    // Create new user
                    user = userDb.create(
                        profile.id,
                        profile.emails[0].value,
                        profile.displayName,
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

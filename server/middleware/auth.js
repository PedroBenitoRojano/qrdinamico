// Admin middleware - checks if user is authenticated and is admin
function isAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (req.user.email !== adminEmail) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    next();
}

// Check if user is admin (for routes that serve HTML)
function isAdminPage(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/google');
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (req.user.email !== adminEmail) {
        return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Denegado</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          h1 { font-size: 4rem; margin: 0; }
          p { font-size: 1.5rem; }
          a {
            color: white;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚫</h1>
          <p>Acceso Denegado</p>
          <p style="font-size: 1rem;">Solo administradores pueden acceder a esta página.</p>
          <a href="/">Volver al inicio</a>
        </div>
      </body>
      </html>
    `);
    }

    next();
}

module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ error: 'Not authenticated' });
    },
    isAdmin,
    isAdminPage
};

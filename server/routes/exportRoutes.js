const router = require('express').Router();
const { db } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/export — kertakäyttöinen datavienti Postgres-migraatiota varten.
// Ei sisällä password_hashia; uusi ympäristö luo oman admin-tunnuksensa ADMIN_USERNAME/ADMIN_PASSWORD-muuttujista.
router.get('/', (_req, res) => {
  const usernameRow = db.prepare("SELECT value FROM config WHERE key='username'").get();
  const goals = db.prepare('SELECT year, goal_km FROM goals ORDER BY year').all();
  const rides = db.prepare(
    'SELECT id, date, km, bike, route, created_at, updated_at FROM rides ORDER BY id'
  ).all();

  res.json({
    exportedAt: new Date().toISOString(),
    username: usernameRow?.value || null,
    goals,
    rides,
  });
});

module.exports = router;

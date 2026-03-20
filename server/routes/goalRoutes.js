const router = require('express').Router();
const { db } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/goal?year=2026
router.get('/', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const goalRow = db.prepare('SELECT * FROM goals WHERE year = ?').get(year);
  const currentRow = db.prepare("SELECT SUM(km) as km FROM rides WHERE substr(date, 1, 4) = ?").get(String(year));

  const currentKm = parseFloat(currentRow.km) || 0;
  const goalKm = goalRow?.goal_km || null;

  res.json({
    year,
    goalKm,
    currentKm,
    progress: goalKm ? currentKm / goalKm : null,
  });
});

// PUT /api/goal
router.put('/', (req, res) => {
  const { year, goalKm } = req.body;
  if (!year || !goalKm || Number(goalKm) <= 0) {
    return res.status(400).json({ error: 'Vuosi ja tavoite (km) vaaditaan' });
  }
  db.prepare('INSERT OR REPLACE INTO goals (year, goal_km) VALUES (?, ?)').run(Number(year), Number(goalKm));
  res.json({ year: Number(year), goalKm: Number(goalKm) });
});

module.exports = router;

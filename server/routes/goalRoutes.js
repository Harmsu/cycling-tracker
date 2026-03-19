const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/goal?year=2026
router.get('/', async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const { rows: goalRows } = await pool.query('SELECT * FROM goals WHERE year = $1', [year]);
  const { rows: currentRows } = await pool.query(
    "SELECT SUM(km) as km FROM rides WHERE LEFT(date, 4) = $1", [String(year)]
  );

  const currentKm = parseFloat(currentRows[0].km) || 0;
  const goalKm = goalRows[0]?.goal_km || null;

  res.json({
    year,
    goalKm,
    currentKm,
    progress: goalKm ? currentKm / goalKm : null,
  });
});

// PUT /api/goal
router.put('/', async (req, res) => {
  const { year, goalKm } = req.body;
  if (!year || !goalKm || Number(goalKm) <= 0) {
    return res.status(400).json({ error: 'Vuosi ja tavoite (km) vaaditaan' });
  }
  await pool.query(
    'INSERT INTO goals (year, goal_km) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET goal_km = EXCLUDED.goal_km',
    [Number(year), Number(goalKm)]
  );
  res.json({ year: Number(year), goalKm: Number(goalKm) });
});

module.exports = router;

const router = require('express').Router();
const { db } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/rides/bikes — must be before /:id
router.get('/bikes', (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT bike FROM rides ORDER BY bike').all();
  res.json(rows.map(r => r.bike));
});

// GET /api/rides?year=&month=&date=&bike=&limit=&offset=
router.get('/', (req, res) => {
  const { year, month, date, bike, limit = 50, offset = 0 } = req.query;
  const where = [];
  const params = [];

  if (date) {
    params.push(date);
    where.push('date = ?');
  } else if (month) {
    params.push(month);
    where.push("substr(date, 1, 7) = ?");
  } else if (year) {
    params.push(year);
    where.push("substr(date, 1, 4) = ?");
  }

  if (bike) {
    params.push(bike);
    where.push('bike = ?');
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM rides ${whereClause}`).get(...params).c;

  const rides = db.prepare(
    `SELECT * FROM rides ${whereClause} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));

  res.json({ rides, total });
});

// GET /api/rides/:id
router.get('/:id', (req, res) => {
  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ajoa ei löydy' });
  res.json({ ride });
});

// POST /api/rides
router.post('/', (req, res) => {
  const { date, km, bike = 'Vanha sähkäri', route } = req.body;
  if (!date || km === undefined || km === null) {
    return res.status(400).json({ error: 'Päivämäärä ja km vaaditaan' });
  }
  if (Number(km) <= 0) return res.status(400).json({ error: 'km täytyy olla positiivinen' });

  const result = db.prepare(
    'INSERT INTO rides (date, km, bike, route) VALUES (?, ?, ?, ?)'
  ).run(date, Number(km), bike || 'Vanha sähkäri', route || null);

  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ride });
});

// PUT /api/rides/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ajoa ei löydy' });

  const date = req.body.date ?? existing.date;
  const km = req.body.km ?? existing.km;
  const bike = req.body.bike ?? existing.bike;
  const route = req.body.route !== undefined ? req.body.route : existing.route;

  if (Number(km) <= 0) return res.status(400).json({ error: 'km täytyy olla positiivinen' });

  db.prepare(
    "UPDATE rides SET date=?, km=?, bike=?, route=?, updated_at=datetime('now') WHERE id=?"
  ).run(date, Number(km), bike, route || null, req.params.id);

  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  res.json({ ride });
});

// DELETE /api/rides/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ajoa ei löydy' });
  db.prepare('DELETE FROM rides WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

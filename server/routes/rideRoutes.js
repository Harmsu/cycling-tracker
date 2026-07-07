const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/rides/bikes — must be before /:id
router.get('/bikes', async (_req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT bike FROM rides ORDER BY bike');
  res.json(rows.map(r => r.bike));
});

// GET /api/rides?year=&month=&date=&bike=&limit=&offset=
router.get('/', async (req, res) => {
  const { year, month, date, bike, limit = 50, offset = 0 } = req.query;
  const where = [];
  const params = [];

  if (date) {
    params.push(date);
    where.push(`date = $${params.length}`);
  } else if (month) {
    params.push(month);
    where.push(`substr(date, 1, 7) = $${params.length}`);
  } else if (year) {
    params.push(year);
    where.push(`substr(date, 1, 4) = $${params.length}`);
  }

  if (bike) {
    params.push(bike);
    where.push(`bike = $${params.length}`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as c FROM rides ${whereClause}`, params);
  const total = Number(countRows[0].c);

  const { rows: rides } = await pool.query(
    `SELECT * FROM rides ${whereClause} ORDER BY date DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, Number(limit), Number(offset)]
  );

  res.json({ rides, total });
});

// GET /api/rides/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Ajoa ei löydy' });
  res.json({ ride: rows[0] });
});

// POST /api/rides
router.post('/', async (req, res) => {
  const { date, km, bike = 'Vanha sähkäri', route } = req.body;
  if (!date || km === undefined || km === null) {
    return res.status(400).json({ error: 'Päivämäärä ja km vaaditaan' });
  }
  if (Number(km) <= 0) return res.status(400).json({ error: 'km täytyy olla positiivinen' });

  const { rows } = await pool.query(
    'INSERT INTO rides (date, km, bike, route) VALUES ($1, $2, $3, $4) RETURNING *',
    [date, Number(km), bike || 'Vanha sähkäri', route || null]
  );

  res.status(201).json({ ride: rows[0] });
});

// PUT /api/rides/:id
router.put('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Ajoa ei löydy' });

  const date = req.body.date ?? existing.date;
  const km = req.body.km ?? existing.km;
  const bike = req.body.bike ?? existing.bike;
  const route = req.body.route !== undefined ? req.body.route : existing.route;

  if (Number(km) <= 0) return res.status(400).json({ error: 'km täytyy olla positiivinen' });

  const { rows } = await pool.query(
    'UPDATE rides SET date=$1, km=$2, bike=$3, route=$4, updated_at=now() WHERE id=$5 RETURNING *',
    [date, Number(km), bike, route || null, req.params.id]
  );

  res.json({ ride: rows[0] });
});

// DELETE /api/rides/:id
router.delete('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Ajoa ei löydy' });
  await pool.query('DELETE FROM rides WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;

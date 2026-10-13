const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET /api/export/csv — kaikki ajot CSV:nä, samoilla sarakkeilla kuin CSV-tuonti odottaa
router.get('/csv', async (_req, res) => {
  const { rows } = await pool.query('SELECT date, km, bike, route FROM rides ORDER BY date, id');

  const lines = [
    ['pvm', 'km', 'pyörä', 'reitti'].join(','),
    ...rows.map(r => [r.date, String(r.km), r.bike, r.route || ''].map(csvCell).join(',')),
  ];

  // BOM, jotta Excel tunnistaa UTF-8:n (tuonti ohittaa BOMin)
  const csv = '\uFEFF' + lines.join('\r\n') + '\r\n';
  const filename = `pyorailyt-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.send(csv);
});

function csvCell(value) {
  const str = String(value ?? '');
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

module.exports = router;

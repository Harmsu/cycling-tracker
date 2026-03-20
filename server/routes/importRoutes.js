const router = require('express').Router();
const { db } = require('../database');
const { requireAuth } = require('../auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(requireAuth);

router.post('/csv', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tiedosto puuttuu' });

  const content = req.file.buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    return res.status(400).json({ error: 'Tiedosto on tyhjä tai liian lyhyt' });
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const COL_PVM = ['pvm', 'date', 'päivämäärä', 'paivamaara'];
  const COL_KM = ['km', 'matka', 'distance'];
  const COL_BIKE = ['pyörä', 'pyora', 'bike', 'polkupyörä'];
  const COL_ROUTE = ['reitti', 'route', 'kuvaus', 'description'];

  function findCol(variants) {
    for (const v of variants) {
      const idx = headers.indexOf(v);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const pvmIdx = findCol(COL_PVM);
  const kmIdx = findCol(COL_KM);
  const bikeIdx = findCol(COL_BIKE);
  const routeIdx = findCol(COL_ROUTE);

  if (pvmIdx === -1 || kmIdx === -1) {
    return res.status(400).json({ error: 'CSV-tiedostosta puuttuu pvm- tai km-sarake' });
  }

  const errors = [];
  const toInsert = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const dateStr = parts[pvmIdx]?.trim().replace(/['"]/g, '');
    const kmStr = parts[kmIdx]?.trim().replace(/['"]/g, '');

    if (!dateStr || !kmStr) continue;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push(`Rivi ${i + 1}: virheellinen päivämäärä "${dateStr}"`);
      continue;
    }

    const km = parseFloat(kmStr.replace(',', '.'));
    if (isNaN(km) || km <= 0) {
      errors.push(`Rivi ${i + 1}: virheellinen km-arvo "${kmStr}"`);
      continue;
    }

    const bike = bikeIdx >= 0 ? (parts[bikeIdx]?.trim().replace(/['"]/g, '') || 'Vanha sähkäri') : 'Vanha sähkäri';
    const route = routeIdx >= 0 ? (parts[routeIdx]?.trim().replace(/['"]/g, '') || null) : null;

    toInsert.push({ date: dateStr, km, bike, route: route || null });
  }

  let imported = 0;
  let skipped = 0;

  const checkStmt = db.prepare('SELECT id FROM rides WHERE date=? AND ABS(km-?)<=0.01 AND bike=?');
  const insertStmt = db.prepare('INSERT INTO rides (date, km, bike, route) VALUES (?, ?, ?, ?)');

  try {
    db.exec('BEGIN');
    for (const row of toInsert) {
      const existing = checkStmt.get(row.date, row.km, row.bike);
      if (existing) {
        skipped++;
      } else {
        insertStmt.run(row.date, row.km, row.bike, row.route);
        imported++;
      }
    }
    db.exec('COMMIT');
    res.json({ imported, skipped, errors });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Tuonti epäonnistui: ' + err.message });
  }
});

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

module.exports = router;

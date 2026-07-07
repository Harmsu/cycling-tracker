const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

function finToday(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });
}

function finNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
}

// Maanantaista alkavan viikon avain (sama logiikka kuin summaryn weekStart-laskennassa)
function weekKey(dateStr) {
  const d = new Date(dateStr);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - dow + 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/stats/summary?year=2026
router.get('/summary', async (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const today = finToday();

  const { rows: yearlyRows } = await pool.query(
    'SELECT SUM(km) as totalkm, COUNT(*) as totalrides FROM rides WHERE substr(date, 1, 4) = $1', [year]
  );
  const yearly = yearlyRows[0];

  const { rows: todayRows } = await pool.query('SELECT SUM(km) as km FROM rides WHERE date = $1', [today]);

  const now = finNow();
  const dow = now.getDay() || 7;
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - dow + 1);
  const weekStartStr = weekStartDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });

  const { rows: weekRows } = await pool.query(
    'SELECT SUM(km) as km FROM rides WHERE date >= $1 AND date <= $2', [weekStartStr, today]
  );

  const monthStr = today.slice(0, 7);
  const { rows: monthRows } = await pool.query(
    'SELECT SUM(km) as km FROM rides WHERE substr(date, 1, 7) = $1', [monthStr]
  );

  const { rows: allTimeRows } = await pool.query('SELECT SUM(km) as km FROM rides');

  const { rows: activeDaysRows } = await pool.query(
    'SELECT COUNT(DISTINCT date) as days FROM rides WHERE substr(date, 1, 4) = $1', [year]
  );
  const activeDaysYear = Number(activeDaysRows[0].days) || 0;

  const isCurrentYear = now.getFullYear() === Number(year);
  const jan1 = new Date(Number(year), 0, 1);

  let weeksElapsed, monthsElapsed;
  if (isCurrentYear) {
    const dayOfYear = Math.ceil((now - jan1) / 86400000);
    weeksElapsed = Math.max(dayOfYear / 7, 1);
    monthsElapsed = Math.max(now.getMonth() + 1 + now.getDate() / 30, 1);
  } else {
    weeksElapsed = 52;
    monthsElapsed = 12;
  }

  const totalKm = parseFloat(yearly.totalkm) || 0;
  const avgDaysPerWeek = activeDaysYear / weeksElapsed;
  const avgDaysPerMonth = activeDaysYear / monthsElapsed;
  const avgKmPerDay = activeDaysYear > 0 ? totalKm / activeDaysYear : 0;

  res.json({
    year: Number(year),
    today: parseFloat(todayRows[0].km) || 0,
    week: parseFloat(weekRows[0].km) || 0,
    month: parseFloat(monthRows[0].km) || 0,
    yearTotal: totalKm,
    yearRides: Number(yearly.totalrides) || 0,
    allTime: parseFloat(allTimeRows[0].km) || 0,
    activeDaysYear,
    avgDaysPerWeek,
    avgDaysPerMonth,
    avgKmPerDay,
  });
});

// GET /api/stats/heatmap?year=2026
router.get('/heatmap', async (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const { rows } = await pool.query(
    'SELECT date, SUM(km) as km FROM rides WHERE substr(date, 1, 4) = $1 GROUP BY date ORDER BY date', [year]
  );
  res.json(rows.map(r => ({ date: r.date, km: parseFloat(r.km) })));
});

// GET /api/stats/monthly?year=2026
router.get('/monthly', async (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const { rows } = await pool.query(
    `SELECT substr(date, 6, 2) as month, SUM(km) as km, COUNT(*) as rides
     FROM rides WHERE substr(date, 1, 4) = $1 GROUP BY month ORDER BY month`, [year]
  );

  const result = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = rows.find(r => r.month === m);
    return { month: m, km: found ? parseFloat(found.km) : 0, rides: found ? Number(found.rides) : 0 };
  });

  res.json(result);
});

// GET /api/stats/records
router.get('/records', async (_req, res) => {
  const { rows: longestRideRows } = await pool.query('SELECT * FROM rides ORDER BY km DESC LIMIT 1');
  const longestRide = longestRideRows[0] || null;

  const { rows: longestMonthRows } = await pool.query(
    "SELECT substr(date, 1, 7) as month, SUM(km) as km FROM rides GROUP BY month ORDER BY km DESC LIMIT 1"
  );
  const longestMonth = longestMonthRows[0] || null;

  const { rows: longestYearRows } = await pool.query(
    "SELECT substr(date, 1, 4) as year, SUM(km) as km FROM rides GROUP BY year ORDER BY km DESC LIMIT 1"
  );
  const longestYear = longestYearRows[0] || null;

  // Pisin viikko lasketaan JS:ssä samalla maanantai-pohjaisella logiikalla kuin summary-endpointissa,
  // koska Postgresin ISO-viikkonumerointi ei vastaisi alkuperäistä SQLiten strftime('%W')-tulosta.
  const { rows: allRides } = await pool.query('SELECT date, km FROM rides');
  const weekTotals = new Map();
  for (const r of allRides) {
    const key = weekKey(r.date);
    weekTotals.set(key, (weekTotals.get(key) || 0) + parseFloat(r.km));
  }
  let longestWeek = null;
  for (const [week, km] of weekTotals) {
    if (!longestWeek || km > longestWeek.km) longestWeek = { week, km };
  }

  const { rows: allDateRows } = await pool.query('SELECT DISTINCT date FROM rides ORDER BY date DESC');
  const allDates = allDateRows.map(r => r.date);

  let currentStreak = 0;
  let longestStreak = allDates.length > 0 ? 1 : 0;

  if (allDates.length > 0) {
    const today = finToday();
    const yesterday = finToday(-1);

    if (allDates[0] === today || allDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < allDates.length; i++) {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        if ((prev - curr) / 86400000 === 1) { currentStreak++; } else break;
      }
    }

    let streak = 1;
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      if ((prev - curr) / 86400000 === 1) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }
  }

  res.json({ longestRide, longestMonth, longestYear, longestWeek, currentStreak, longestStreak });
});

module.exports = router;

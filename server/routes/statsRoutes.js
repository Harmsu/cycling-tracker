const router = require('express').Router();
const db = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// Palauttaa päivämäärän YYYY-MM-DD muodossa Suomen aikavyöhykkeellä
function finToday(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });
}

// Palauttaa Date-objektin Suomen aikavyöhykkeessä
function finNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
}

// GET /api/stats/summary?year=2026
router.get('/summary', (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const today = finToday();

  const yearly = db.prepare(
    "SELECT SUM(km) as totalKm, COUNT(*) as totalRides FROM rides WHERE strftime('%Y', date) = ?"
  ).get(year);

  const todayRow = db.prepare('SELECT SUM(km) as km FROM rides WHERE date = ?').get(today);

  // Viikon alku (maanantai)
  const now = finNow();
  const dow = now.getDay() || 7;
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - dow + 1);
  const weekStartStr = weekStartDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });

  const weekRow = db.prepare(
    'SELECT SUM(km) as km FROM rides WHERE date >= ? AND date <= ?'
  ).get(weekStartStr, today);

  const monthStr = today.slice(0, 7);
  const monthRow = db.prepare(
    "SELECT SUM(km) as km FROM rides WHERE strftime('%Y-%m', date) = ?"
  ).get(monthStr);

  const allTime = db.prepare('SELECT SUM(km) as km FROM rides').get();

  // Ajopäivät (uniikit päivät joilla on ajo)
  const activeDaysYear = db.prepare(
    "SELECT COUNT(DISTINCT date) as days FROM rides WHERE strftime('%Y', date) = ?"
  ).get(year).days || 0;

  // Kuinka monta viikkoa / kuukautta on kulunut tässä vuodessa
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

  const avgDaysPerWeek = activeDaysYear / weeksElapsed;
  const avgDaysPerMonth = activeDaysYear / monthsElapsed;
  const avgKmPerDay = activeDaysYear > 0 ? (yearly.totalKm || 0) / activeDaysYear : 0;

  res.json({
    year: Number(year),
    today: todayRow.km || 0,
    week: weekRow.km || 0,
    month: monthRow.km || 0,
    yearTotal: yearly.totalKm || 0,
    yearRides: yearly.totalRides || 0,
    allTime: allTime.km || 0,
    activeDaysYear,
    avgDaysPerWeek,
    avgDaysPerMonth,
    avgKmPerDay,
  });
});

// GET /api/stats/heatmap?year=2026
router.get('/heatmap', (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const rows = db.prepare(
    "SELECT date, SUM(km) as km FROM rides WHERE strftime('%Y', date) = ? GROUP BY date ORDER BY date"
  ).all(year);
  res.json(rows);
});

// GET /api/stats/monthly?year=2026
router.get('/monthly', (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const rows = db.prepare(
    "SELECT strftime('%m', date) as month, SUM(km) as km, COUNT(*) as rides FROM rides WHERE strftime('%Y', date) = ? GROUP BY month ORDER BY month"
  ).all(year);

  const result = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = rows.find(r => r.month === m);
    return { month: m, km: found ? found.km : 0, rides: found ? found.rides : 0 };
  });

  res.json(result);
});

// GET /api/stats/records
router.get('/records', (_req, res) => {
  const longestRide = db.prepare('SELECT * FROM rides ORDER BY km DESC LIMIT 1').get();

  const longestMonth = db.prepare(
    "SELECT strftime('%Y-%m', date) as month, SUM(km) as km FROM rides GROUP BY month ORDER BY km DESC LIMIT 1"
  ).get();

  const longestYear = db.prepare(
    "SELECT strftime('%Y', date) as year, SUM(km) as km FROM rides GROUP BY year ORDER BY km DESC LIMIT 1"
  ).get();

  const longestWeek = db.prepare(
    "SELECT strftime('%Y-W%W', date) as week, SUM(km) as km FROM rides GROUP BY week ORDER BY km DESC LIMIT 1"
  ).get();

  const allDates = db.prepare('SELECT DISTINCT date FROM rides ORDER BY date DESC').all().map(r => r.date);

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

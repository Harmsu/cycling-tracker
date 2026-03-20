const router = require('express').Router();
const { db } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

function finToday(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });
}

function finNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
}

// GET /api/stats/summary?year=2026
router.get('/summary', (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const today = finToday();

  const yearly = db.prepare(
    "SELECT SUM(km) as totalkm, COUNT(*) as totalrides FROM rides WHERE substr(date, 1, 4) = ?"
  ).get(year);

  const todayRow = db.prepare('SELECT SUM(km) as km FROM rides WHERE date = ?').get(today);

  const now = finNow();
  const dow = now.getDay() || 7;
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - dow + 1);
  const weekStartStr = weekStartDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' });

  const weekRow = db.prepare('SELECT SUM(km) as km FROM rides WHERE date >= ? AND date <= ?').get(weekStartStr, today);

  const monthStr = today.slice(0, 7);
  const monthRow = db.prepare("SELECT SUM(km) as km FROM rides WHERE substr(date, 1, 7) = ?").get(monthStr);

  const allTimeRow = db.prepare('SELECT SUM(km) as km FROM rides').get();

  const activeDaysRow = db.prepare(
    "SELECT COUNT(DISTINCT date) as days FROM rides WHERE substr(date, 1, 4) = ?"
  ).get(year);
  const activeDaysYear = activeDaysRow.days || 0;

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
    today: parseFloat(todayRow.km) || 0,
    week: parseFloat(weekRow.km) || 0,
    month: parseFloat(monthRow.km) || 0,
    yearTotal: totalKm,
    yearRides: yearly.totalrides || 0,
    allTime: parseFloat(allTimeRow.km) || 0,
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
    "SELECT date, SUM(km) as km FROM rides WHERE substr(date, 1, 4) = ? GROUP BY date ORDER BY date"
  ).all(year);
  res.json(rows.map(r => ({ date: r.date, km: parseFloat(r.km) })));
});

// GET /api/stats/monthly?year=2026
router.get('/monthly', (req, res) => {
  const year = req.query.year || String(finNow().getFullYear());
  const rows = db.prepare(
    "SELECT substr(date, 6, 2) as month, SUM(km) as km, COUNT(*) as rides FROM rides WHERE substr(date, 1, 4) = ? GROUP BY month ORDER BY month"
  ).all(year);

  const result = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = rows.find(r => r.month === m);
    return { month: m, km: found ? parseFloat(found.km) : 0, rides: found ? found.rides : 0 };
  });

  res.json(result);
});

// GET /api/stats/records
router.get('/records', (_req, res) => {
  const longestRide = db.prepare('SELECT * FROM rides ORDER BY km DESC LIMIT 1').get() || null;

  const longestMonth = db.prepare(
    "SELECT substr(date, 1, 7) as month, SUM(km) as km FROM rides GROUP BY month ORDER BY km DESC LIMIT 1"
  ).get() || null;

  const longestYear = db.prepare(
    "SELECT substr(date, 1, 4) as year, SUM(km) as km FROM rides GROUP BY year ORDER BY km DESC LIMIT 1"
  ).get() || null;

  const longestWeek = db.prepare(
    "SELECT strftime('%Y-%W', date) as week, SUM(km) as km FROM rides GROUP BY week ORDER BY km DESC LIMIT 1"
  ).get() || null;

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

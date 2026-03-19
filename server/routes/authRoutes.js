const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { generateToken, requireAuth, validateUser } = require('../auth');
const { pool } = require('../database');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Käyttäjätunnus ja salasana vaaditaan' });
  }
  const valid = await validateUser(username, password);
  if (!valid) {
    return res.status(401).json({ error: 'Väärä tunnus tai salasana' });
  }
  res.json({ token: generateToken() });
});

router.get('/me', requireAuth, async (_req, res) => {
  const { rows } = await pool.query("SELECT value FROM config WHERE key='username'");
  res.json({ username: rows[0]?.value || 'admin' });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Molemmat salasanat vaaditaan' });
  }
  const { rows } = await pool.query("SELECT value FROM config WHERE key='username'");
  const valid = await validateUser(rows[0]?.value, currentPassword);
  if (!valid) return res.status(401).json({ error: 'Väärä nykyinen salasana' });
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE config SET value=$1 WHERE key='password_hash'", [hash]);
  res.json({ success: true });
});

module.exports = router;

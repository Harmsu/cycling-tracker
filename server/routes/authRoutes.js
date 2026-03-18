const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { generateToken, requireAuth, validateUser } = require('../auth');
const db = require('../database');

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

router.get('/me', requireAuth, (_req, res) => {
  const row = db.prepare("SELECT value FROM config WHERE key='username'").get();
  res.json({ username: row?.value || 'admin' });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Molemmat salasanat vaaditaan' });
  }
  const usernameRow = db.prepare("SELECT value FROM config WHERE key='username'").get();
  const valid = await validateUser(usernameRow?.value, currentPassword);
  if (!valid) return res.status(401).json({ error: 'Väärä nykyinen salasana' });
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE config SET value=? WHERE key='password_hash'").run(hash);
  res.json({ success: true });
});

module.exports = router;

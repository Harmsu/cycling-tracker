const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-vaihda-tuotannossa';
const JWT_EXPIRES = '30d';

function generateToken() {
  return jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function validateUser(username, password) {
  const { rows: usernameRows } = await pool.query("SELECT value FROM config WHERE key='username'");
  const { rows: hashRows } = await pool.query("SELECT value FROM config WHERE key='password_hash'");
  const usernameRow = usernameRows[0];
  const hashRow = hashRows[0];
  if (!usernameRow || !hashRow) return false;
  if (usernameRow.value !== username) return false;
  return bcrypt.compare(password, hashRow.value);
}

module.exports = { generateToken, requireAuth, validateUser };

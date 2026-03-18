require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const statsRoutes = require('./routes/statsRoutes');
const goalRoutes = require('./routes/goalRoutes');
const importRoutes = require('./routes/importRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: false,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/import', importRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sisäinen palvelinvirhe' });
});

app.listen(PORT, () => {
  console.log(`Palvelin käynnissä portissa ${PORT}`);
});

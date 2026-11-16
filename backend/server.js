require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const auth = require('./middleware/auth');
const seed = require('./seed');

const app = express();
app.use(cors());
app.use(express.json());

let ready = null;
const connect = () => {
  if (!ready) {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      return Promise.reject(new Error('MONGODB_URI and JWT_SECRET must be set'));
    }
    ready = mongoose.connect(process.env.MONGODB_URI).then(seed).catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
};

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/health/db', async (req, res) => {
  const raw = process.env.MONGODB_URI || '';
  const noScheme = raw.trim().replace(/^mongodb(\+srv)?:\/\//, '');
  const at = noScheme.lastIndexOf('@');
  const creds = at === -1 ? '' : noScheme.slice(0, at);
  const hostPart = at === -1 ? noScheme : noScheme.slice(at + 1);
  const colon = creds.indexOf(':');
  const user = colon === -1 ? creds : creds.slice(0, colon);
  const pass = colon === -1 ? '' : creds.slice(colon + 1);
  let connection = 'not tested';
  if (raw) {
    try {
      const conn = mongoose.createConnection(raw, { serverSelectionTimeoutMS: 8000 });
      await conn.asPromise();
      connection = 'connected';
      await conn.close();
    } catch (error) {
      connection = error.message;
    }
  }
  res.json({
    uriIsSet: Boolean(raw),
    jwtSecretIsSet: Boolean(process.env.JWT_SECRET),
    startsWithMongodb: /^mongodb(\+srv)?:\/\//.test(raw),
    hasSpaceOrQuoteAtEdges: raw !== raw.trim() || /^["']|["']$/.test(raw),
    hasAngleBrackets: /[<>]/.test(raw),
    atSignCount: (raw.match(/@/g) || []).length,
    username: user,
    passwordLength: pass.length,
    passwordHasSpecialCharacters: /[^A-Za-z0-9]/.test(pass),
    host: hostPart.split('/')[0],
    database: (hostPart.split('/')[1] || '').split('?')[0],
    connection,
  });
});
app.use('/api', (req, res, next) => connect().then(() => next(), next));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', auth);
app.use('/api', require('./routes/resources'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors)[0].message });
  if (err.code === 11000) return res.status(400).json({ error: `That ${Object.keys(err.keyValue)[0]} already exists` });
  if (err.name === 'CastError') return res.status(400).json({ error: `Invalid value for ${err.path}` });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server' });
});

if (require.main === module) {
  const port = process.env.PORT || 5000;
  connect()
    .then(() => app.listen(port, () => console.log(`Server running on port ${port}`)))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = app;

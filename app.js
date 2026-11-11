const path = require('path');
const express = require('express');
const config = require('./config');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const { initDatabase } = require('./models');
const { seedIfEmpty } = require('./utils/seed');
const { formatRupiah } = require('./utils/format');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.locals.appName = config.appName;
app.locals.tagline = config.tagline;
app.locals.formatRupiah = formatRupiah;

app.use(logger);
app.use(express.json());
app.use(routes);

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  }
  res.status(404).render('404', { title: 'Halaman tidak ditemukan' });
});
app.use(errorHandler);

function pesanDatabase(err) {
  const kode = (err.parent && err.parent.code) || (err.original && err.original.code) || err.code || '';
  if (kode === 'ECONNREFUSED') return 'MySQL belum berjalan atau host/port salah. Klik "Start All" di Laragon, lalu cek DB_HOST dan DB_PORT di .env.';
  if (kode === 'ER_ACCESS_DENIED_ERROR') return 'Username atau password salah. Cek DB_USER dan DB_PASSWORD di .env.';
  return err.message;
}

async function start() {
  try {
    await initDatabase();
    await seedIfEmpty();
    app.listen(config.port, () => {
      console.log(`${config.appName} berjalan di http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Gagal terhubung ke database:', pesanDatabase(err));
    process.exit(1);
  }
}

start();

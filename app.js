const path = require('path');
const express = require('express');
const config = require('./config');
const logger = require('./middlewares/logger');
const routes = require('./routes');
const { formatRupiah } = require('./utils/format');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Tersedia di semua view EJS
app.locals.appName = config.appName;
app.locals.tagline = config.tagline;
app.locals.formatRupiah = formatRupiah;

app.use(logger);
app.use(express.json());
app.use(routes);

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  }
  res.status(404).render('404', { title: 'Halaman tidak ditemukan' });
});

app.listen(config.port, () => {
  console.log(`${config.appName} berjalan di http://localhost:${config.port}`);
});

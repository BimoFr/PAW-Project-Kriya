// Penanganan error terpusat (JSON untuk /api, halaman untuk web).
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let pesan = status === 500 ? 'Terjadi kesalahan pada server' : err.message;
  if (err.type === 'entity.parse.failed') { status = 400; pesan = 'Body JSON tidak valid'; }
  if (status === 500) console.error(err);

  if (req.path.startsWith('/api')) return res.status(status).json({ error: pesan });
  res.status(status).render('404', { title: 'Terjadi kesalahan', kode: status, judul: 'Terjadi kesalahan', pesan });
}

module.exports = errorHandler;

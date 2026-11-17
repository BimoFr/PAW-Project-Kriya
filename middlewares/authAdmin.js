const cekAdminWeb = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
};

const cekAdminApi = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({
    status: 'error',
    message: 'Akses ditolak. Silakan login sebagai pengelola.'
  });
};

module.exports = { cekAdminWeb, cekAdminApi };
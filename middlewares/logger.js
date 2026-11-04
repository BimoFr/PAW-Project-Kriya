const { writeLog } = require('../utils/logWriter');

// Mencatat method, path, status response, dan waktu setiap request.
// Log tampil di terminal dan disimpan ke logs/logger.md.
function logger(req, res, next) {
  const mulai = process.hrtime.bigint();

  res.on('finish', () => {
    const durasi = (Number(process.hrtime.bigint() - mulai) / 1e6).toFixed(1);
    const entri = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durasi,
    };

    console.log(
      `[${entri.timestamp}] ${entri.method} ${entri.path} ${entri.status} - ${entri.durasi} ms`
    );
    writeLog(entri);
  });

  next();
}

module.exports = logger;

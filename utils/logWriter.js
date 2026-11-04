const fs = require('fs');
const path = require('path');
const config = require('../config');

const HEADER =
  '# Log Request\n\n| Waktu | Method | Path | Status | Durasi |\n|---|---|---|---|---|\n';

// Menambahkan satu baris log ke logs/logger.md (dibuat otomatis bila belum ada).
function writeLog({ timestamp, method, path: urlPath, status, durasi }) {
  try {
    fs.mkdirSync(path.dirname(config.logFile), { recursive: true });
    if (!fs.existsSync(config.logFile)) {
      fs.writeFileSync(config.logFile, HEADER);
    }
    fs.appendFileSync(
      config.logFile,
      `| ${timestamp} | ${method} | \`${urlPath}\` | ${status} | ${durasi} ms |\n`
    );
  } catch (err) {
    console.error('Gagal menulis log:', err.message);
  }
}

module.exports = { writeLog };

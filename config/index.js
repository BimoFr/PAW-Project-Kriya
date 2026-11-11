const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';

module.exports = {
  port: process.env.PORT || 3000,
  appName: 'Kriya',
  tagline: 'Batik & tenun karya pengrajin Nusantara',
  logFile: path.join(__dirname, '..', 'logs', 'logger.md'),
  db: {
    dialect,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || (dialect === 'postgres' ? 5432 : 3306),
    name: process.env.DB_NAME || 'kriya_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
};

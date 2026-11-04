const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  appName: 'Kriya',
  tagline: 'Batik & tenun karya pengrajin Nusantara',
  logFile: path.join(__dirname, '..', 'logs', 'logger.md'),
};

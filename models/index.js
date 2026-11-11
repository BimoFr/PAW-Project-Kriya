const { Sequelize } = require('sequelize');
const { db } = require('../config');

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  logging: false,
});

// Membuat database (khusus MySQL), cek koneksi, lalu membuat tabel bila belum ada.
async function initDatabase() {
  if (db.dialect === 'mysql') {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: db.host, port: db.port, user: db.user, password: db.password,
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.end();
  }
  await sequelize.authenticate();
  require('./produkModel');
  await sequelize.sync();
}

module.exports = { sequelize, initDatabase };

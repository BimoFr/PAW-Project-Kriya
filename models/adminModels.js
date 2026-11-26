const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Admin = sequelize.define(
  'Admin',
  {
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nama_lengkap: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Pengelola Kriya',
    },
    role: {
      type: DataTypes.ENUM('owner', 'staff'),
      allowNull: false,
      defaultValue: 'owner',
    },
  },
  {
    tableName: 'admin',
    timestamps: true,
  }
);

module.exports = Admin;
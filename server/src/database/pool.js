const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function getSslConfig() {
  const legacyEnabled = parseBoolean(process.env.DB_SSL, false);
  const mode = String(process.env.DB_SSL_MODE || (legacyEnabled ? 'required' : 'disabled')).trim().toLowerCase();

  if (['', 'disabled', 'false', '0'].includes(mode)) {
    return undefined;
  }

  if (mode !== 'required') {
    throw new Error('DB_SSL_MODE must be either "disabled" or "required".');
  }

  return {
    rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
  };
}

function getDatabaseConfig() {
  const ssl = getSslConfig();
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'cyberly',
    multipleStatements: false,
  };

  if (ssl) {
    config.ssl = ssl;
  }

  return config;
}

function createPool() {
  return mysql.createPool({
    ...getDatabaseConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = {
  createPool,
  getDatabaseConfig,
  getSslConfig,
};

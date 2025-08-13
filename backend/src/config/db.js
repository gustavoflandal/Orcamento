
// Configuração robusta do pool de conexões MySQL usando variáveis de ambiente
const mysql = require('mysql2/promise');

// Validação das variáveis de ambiente
['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente ${key} não definida!`);
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

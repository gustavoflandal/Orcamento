const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  async findByLoginOrEmail(loginOrEmail) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE login = ? OR email = ?', [loginOrEmail, loginOrEmail]);
    return rows[0];
  },
  async create({ email, login, senha }) {
    logger.info('[USUARIO] Criando usuário', { email, login });
    const [result] = await pool.query('INSERT INTO usuarios (email, login, senha) VALUES (?, ?, ?)', [email, login, senha]);
    logger.info('[USUARIO] Usuário criado', { id: result.insertId, email, login });
    return { id: result.insertId, email, login };
  },
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  }
};

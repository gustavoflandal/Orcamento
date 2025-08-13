const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  async listar(id_usuario) {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id_usuario = ?', [id_usuario]);
    return rows;
  },
  async obter(id, id_usuario) {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ? AND id_usuario = ?', [id, id_usuario]);
    return rows[0];
  },
  async criar({ nome, tipo, cor, id_categoria_pai, id_usuario }) {
    logger.info('[CATEGORIA] Criando categoria', { nome, tipo, cor, id_categoria_pai, id_usuario });
    const [result] = await pool.query('INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)', [nome, tipo, cor, id_categoria_pai || null, id_usuario]);
    logger.info('[CATEGORIA] Categoria criada', { id: result.insertId, nome, tipo, cor, id_categoria_pai, id_usuario });
    return { id: result.insertId, nome, tipo, cor, id_categoria_pai, id_usuario };
  },
  async atualizar(id, { nome, tipo, cor, id_categoria_pai }, id_usuario) {
    await pool.query('UPDATE categorias SET nome=?, tipo=?, cor=?, id_categoria_pai=? WHERE id=? AND id_usuario=?', [nome, tipo, cor, id_categoria_pai || null, id, id_usuario]);
  },
  async deletar(id, id_usuario) {
    await pool.query('DELETE FROM categorias WHERE id=? AND id_usuario=?', [id, id_usuario]);
  }
};

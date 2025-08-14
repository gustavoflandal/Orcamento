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
    // Verifica se o usuário já possui categorias
    const [existentes] = await pool.query('SELECT id FROM categorias WHERE id_usuario = ?', [id_usuario]);
    let categoriaPai = id_categoria_pai || null;
    // Se não existe nenhuma categoria, a categoria pai será o próprio id gerado
    if (!existentes.length) {
      const [result] = await pool.query('INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, NULL, ?)', [nome, tipo, cor, id_usuario]);
      // Atualiza o registro para que a categoria pai seja ela mesma
      await pool.query('UPDATE categorias SET id_categoria_pai = ? WHERE id = ?', [result.insertId, result.insertId]);
      logger.info('[CATEGORIA] Primeira categoria criada e ajustada como própria categoria pai', { id: result.insertId, nome, tipo, cor, id_usuario });
      return { id: result.insertId, nome, tipo, cor, id_categoria_pai: result.insertId, id_usuario };
    } else {
      const [result] = await pool.query('INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)', [nome, tipo, cor, categoriaPai, id_usuario]);
      logger.info('[CATEGORIA] Categoria criada', { id: result.insertId, nome, tipo, cor, id_categoria_pai: categoriaPai, id_usuario });
      return { id: result.insertId, nome, tipo, cor, id_categoria_pai: categoriaPai, id_usuario };
    }
  },
  async atualizar(id, { nome, tipo, cor, id_categoria_pai }, id_usuario) {
    await pool.query('UPDATE categorias SET nome=?, tipo=?, cor=?, id_categoria_pai=? WHERE id=? AND id_usuario=?', [nome, tipo, cor, id_categoria_pai || null, id, id_usuario]);
  },
  async deletar(id, id_usuario) {
    await pool.query('DELETE FROM categorias WHERE id=? AND id_usuario=?', [id, id_usuario]);
  }
};

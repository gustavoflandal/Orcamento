const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  async listar(id_usuario) {
    const [rows] = await pool.query('SELECT * FROM despesas_recorrentes WHERE id_usuario = ?', [id_usuario]);
    return rows;
  },
  async obter(id, id_usuario) {
    const [rows] = await pool.query('SELECT * FROM despesas_recorrentes WHERE id = ? AND id_usuario = ?', [id, id_usuario]);
    return rows[0];
  },
  async criar({ descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id_usuario }) {
    logger.info('[DESPESA RECORRENTE] Criando despesa', { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id_usuario });
    // Garante valor default caso não venha do frontend
    const periodoFinal = Number(periodo) || 30;
    const [result] = await pool.query('INSERT INTO despesas_recorrentes (descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?)', [descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodoFinal, id_usuario]);
    logger.info('[DESPESA RECORRENTE] Despesa criada', { id: result.insertId, descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo: periodoFinal, id_usuario });
    return { id: result.insertId, descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo: periodoFinal, id_usuario };
  },
  async deletar(id, id_usuario) {
    await pool.query('DELETE FROM despesas_recorrentes WHERE id=? AND id_usuario=?', [id, id_usuario]);
  },
  async atualizar(id, { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo }) {
    await pool.query('UPDATE despesas_recorrentes SET descricao = ?, valor_total = ?, numero_parcelas = ?, primeiro_vencimento = ?, id_categoria = ?, periodo = ? WHERE id = ?', [descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id]);
  }
};

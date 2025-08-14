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
    // Verifica se já existe despesa recorrente igual para o usuário
    const [existentes] = await pool.query(
      'SELECT id FROM despesas_recorrentes WHERE descricao = ? AND id_categoria = ? AND periodo = ? AND id_usuario = ?',
      [descricao, id_categoria, periodo, id_usuario]
    );
    if (existentes.length > 0) {
      logger.warn('[DESPESA RECORRENTE] Tentativa de criar despesa duplicada', { descricao, id_categoria, periodo, id_usuario });
      throw new Error('Despesa recorrente já existe para este usuário com os mesmos dados.');
    }
    // Garante valor default caso não venha do frontend
    const periodoFinal = Number(periodo) || 30;
    const [result] = await pool.query('INSERT INTO despesas_recorrentes (descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?)', [descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodoFinal, id_usuario]);
    logger.info('[DESPESA RECORRENTE] Despesa criada', { id: result.insertId, descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo: periodoFinal, id_usuario });
    return { id: result.insertId, descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo: periodoFinal, id_usuario };
  },
  async deletar(id, id_usuario) {
  // Exclui todas as parcelas vinculadas antes de excluir a despesa recorrente
  await pool.query('DELETE FROM parcelas WHERE id_despesa_recorrente=?', [id]);
  await pool.query('DELETE FROM despesas_recorrentes WHERE id=? AND id_usuario=?', [id, id_usuario]);
  },
  async atualizar(id, { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo }) {
    await pool.query('UPDATE despesas_recorrentes SET descricao = ?, valor_total = ?, numero_parcelas = ?, primeiro_vencimento = ?, id_categoria = ?, periodo = ? WHERE id = ?', [descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo, id]);
  }
};

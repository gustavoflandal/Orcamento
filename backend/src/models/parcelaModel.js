const pool = require('../config/db');

module.exports = {
  async listarPorDespesa(id_despesa_recorrente) {
    const [rows] = await pool.query('SELECT * FROM parcelas WHERE id_despesa_recorrente = ?', [id_despesa_recorrente]);
    return rows;
  },
  async existeParcelaPaga(id_despesa_recorrente) {
    const [rows] = await pool.query("SELECT COUNT(*) as total FROM parcelas WHERE id_despesa_recorrente = ? AND status = 'Pago'", [id_despesa_recorrente]);
    return rows[0].total > 0;
  },
  async criar({ id_despesa_recorrente, numero_parcela, data_vencimento, valor }) {
    await pool.query('INSERT INTO parcelas (id_despesa_recorrente, numero_parcela, data_vencimento, valor) VALUES (?, ?, ?, ?)', [id_despesa_recorrente, numero_parcela, data_vencimento, valor]);
  },
  async excluirPorDespesa(id_despesa_recorrente) {
    await pool.query('DELETE FROM parcelas WHERE id_despesa_recorrente = ?', [id_despesa_recorrente]);
  }
};

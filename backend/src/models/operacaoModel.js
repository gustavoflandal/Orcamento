const pool = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  async listar(id_usuario, filtros = {}) {
    let query = 'SELECT * FROM operacoes WHERE id_usuario = ?';
    const params = [id_usuario];
    
    if (filtros.dataInicio) {
      query += ' AND data >= ?';
      params.push(filtros.dataInicio);
    }
    
    if (filtros.dataFinal) {
      query += ' AND data <= ?';
      params.push(filtros.dataFinal);
    }
    
    if (filtros.categoria && filtros.categoria !== '') {
      query += ' AND id_categoria = ?';
      params.push(filtros.categoria);
    }
    
    query += ' ORDER BY data ASC, id ASC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  },
  
  async obter(id, id_usuario) {
    const [rows] = await pool.query('SELECT * FROM operacoes WHERE id = ? AND id_usuario = ?', [id, id_usuario]);
    return rows[0];
  },
  
  async criar({ data, descricao, id_categoria, valor, id_usuario }) {
    logger.info('[OPERACAO] Criando operação', { data, descricao, id_categoria, valor, id_usuario });
    const [result] = await pool.query('INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario) VALUES (?, ?, ?, ?, ?)', [data, descricao, id_categoria, valor, id_usuario]);
    logger.info('[OPERACAO] Operação criada', { id: result.insertId, data, descricao, id_categoria, valor, id_usuario });
    return { id: result.insertId, data, descricao, id_categoria, valor, id_usuario };
  },
  
  async atualizar(id, { data, descricao, id_categoria, valor }, id_usuario) {
    await pool.query('UPDATE operacoes SET data=?, descricao=?, id_categoria=?, valor=? WHERE id=? AND id_usuario=?', [data, descricao, id_categoria, valor, id, id_usuario]);
  },
  
  async deletar(id, id_usuario) {
    await pool.query('DELETE FROM operacoes WHERE id=? AND id_usuario=?', [id, id_usuario]);
  },
  
  async pagar(id, id_usuario) {
    await pool.query("UPDATE operacoes SET status='Pago' WHERE id=? AND id_usuario=?", [id, id_usuario]);
  },
  
  async estornar(id, id_usuario) {
    await pool.query("UPDATE operacoes SET status='Aberto' WHERE id=? AND id_usuario=?", [id, id_usuario]);
  }
};

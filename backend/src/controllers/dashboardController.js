const pool = require('../config/db');

exports.obterDashboard = async (req, res, next) => {
  try {
    const id_usuario = req.user.id;
    // Pizza: total por categoria
    const [pizza] = await pool.query(`
      SELECT c.nome, c.cor, SUM(CASE WHEN c.tipo='Crédito' THEN o.valor ELSE -o.valor END) as total
      FROM operacoes o
      JOIN categorias c ON o.id_categoria = c.id
      WHERE o.id_usuario = ?
      GROUP BY c.id
    `, [id_usuario]);
    // Barras: movimentações diárias
    const [barras] = await pool.query(`
      SELECT o.data, 
        SUM(CASE WHEN c.tipo='Crédito' THEN o.valor ELSE 0 END) as credito,
        SUM(CASE WHEN c.tipo='Débito' THEN o.valor ELSE 0 END) as debito
      FROM operacoes o
      JOIN categorias c ON o.id_categoria = c.id
      WHERE o.id_usuario = ?
      GROUP BY o.data
      ORDER BY o.data
    `, [id_usuario]);
    // Linha: evolução do saldo diário
    const [linha] = await pool.query(`
      SELECT o.data, 
        SUM(CASE WHEN c.tipo='Crédito' THEN o.valor ELSE -o.valor END) as saldo
      FROM operacoes o
      JOIN categorias c ON o.id_categoria = c.id
      WHERE o.id_usuario = ?
      GROUP BY o.data
      ORDER BY o.data
    `, [id_usuario]);
    // Calcular saldo acumulado
    let acumulado = 0;
    const linhaAcumulada = linha.map(l => {
      acumulado += Number(l.saldo);
      return { ...l, saldo_acumulado: acumulado };
    });
    res.json({ pizza, barras, linha: linhaAcumulada });
  } catch (err) {
    next(err);
  }
};

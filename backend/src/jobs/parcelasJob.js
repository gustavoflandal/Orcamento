const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Job para inserir parcelas vencidas automaticamente no grid de operações
 * Executa diariamente para verificar parcelas que vencem na data atual
 */
async function inserirParcelasVencidas() {
  try {
    logger.info('Iniciando job de inserção de parcelas vencidas...');
    
    // Buscar parcelas que vencem hoje e ainda não foram inseridas em operações
    const hoje = new Date().toISOString().slice(0, 10);
    
    const [parcelas] = await pool.query(`
      SELECT p.*, dr.descricao, dr.id_categoria, dr.id_usuario
      FROM parcelas p
      INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
      WHERE p.data_vencimento = ? 
      AND p.status = 'Aberto'
      AND NOT EXISTS (
        SELECT 1 FROM operacoes o 
        WHERE o.id_parcela = p.id
      )
    `, [hoje]);

    logger.info(`Encontradas ${parcelas.length} parcelas para inserir em operações`);

    for (const parcela of parcelas) {
      // Inserir a parcela como operação de débito, incluindo o número da parcela
      await pool.query(`
        INSERT INTO operacoes (descricao, valor, data, tipo, id_categoria, id_usuario, id_parcela, status)
        VALUES (?, ?, ?, 'Débito', ?, ?, ?, 'Aberto')
      `, [
        `${parcela.descricao} - Parcela ${parcela.numero_parcela}`,
        parcela.valor,
        hoje,
        parcela.id_categoria,
        parcela.id_usuario,
        parcela.id
      ]);

      logger.info(`Parcela ${parcela.id} (número ${parcela.numero_parcela}) inserida em operações`);
    }

    logger.info('Job de inserção de parcelas concluído com sucesso');
  } catch (error) {
    logger.error('Erro no job de inserção de parcelas:', error);
  }
}

module.exports = { inserirParcelasVencidas };

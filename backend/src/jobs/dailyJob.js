const cron = require('node-cron');
const pool = require('../config/db');
const winston = require('../config/winston');

async function processarParcelasVencidas() {
  try {
    winston.info('Iniciando processamento de parcelas vencidas...');
    
    // Buscar parcelas que vencem hoje e ainda não foram processadas
    const [parcelas] = await pool.query(`
      SELECT p.id, p.id_despesa_recorrente, p.data_vencimento, p.valor, 
             dr.descricao, dr.id_categoria, dr.id_usuario
      FROM parcelas p
      JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
      WHERE p.data_vencimento <= CURDATE() 
      AND p.status = 'Aberto'
      AND NOT EXISTS (
        SELECT 1 FROM operacoes o 
        WHERE o.descricao LIKE CONCAT('%Parcela ', p.id, '%')
      )
    `);
    
    winston.info(`Encontradas ${parcelas.length} parcelas para processar`);
    
    for (const parcela of parcelas) {
      // Inserir a parcela como operação
      await pool.query(`
        INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario, status, tipo)
        VALUES (?, ?, ?, ?, ?, 'Aberto', 'Débito')
      `, [
        parcela.data_vencimento, 
        `${parcela.descricao} - Parcela ${parcela.id}`, 
        parcela.id_categoria, 
        parcela.valor, 
        parcela.id_usuario
      ]);
      
      winston.info(`Parcela ${parcela.id} inserida em operações`);
    }
    
    winston.info('Processamento de parcelas concluído');
  } catch (err) {
    winston.error('Erro no job diário: ' + err.message);
  }
}

function scheduleDailyJob() {
  cron.schedule('0 0 * * *', processarParcelasVencidas, { timezone: 'America/Sao_Paulo' });
}

module.exports = { scheduleDailyJob };

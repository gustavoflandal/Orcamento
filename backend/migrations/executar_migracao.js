const mysql = require('mysql2/promise');
require('dotenv').config();

async function executarMigracao() {
  try {
    // Conectar ao banco usando as mesmas configurações do .env
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'orcamento'
    });

    console.log('Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [columns] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_schema = ? 
      AND table_name = 'operacoes' 
      AND column_name = 'id_parcela'
    `, [process.env.DB_NAME || 'orcamento']);

    if (columns[0].count === 0) {
      console.log('Adicionando coluna id_parcela...');
      await connection.query(`
        ALTER TABLE operacoes 
        ADD COLUMN id_parcela INT NULL COMMENT 'Vincula operação a uma parcela específica'
      `);
      console.log('Coluna id_parcela adicionada com sucesso');

      // Verificar se a foreign key já existe
      const [constraints] = await connection.query(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE table_schema = ? 
        AND table_name = 'operacoes' 
        AND constraint_name = 'fk_operacoes_parcela'
      `, [process.env.DB_NAME || 'orcamento']);

      if (constraints[0].count === 0) {
        console.log('Adicionando foreign key...');
        await connection.query(`
          ALTER TABLE operacoes 
          ADD CONSTRAINT fk_operacoes_parcela 
          FOREIGN KEY (id_parcela) REFERENCES parcelas(id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('Foreign key adicionada com sucesso');
      } else {
        console.log('Foreign key já existe');
      }
    } else {
      console.log('Coluna id_parcela já existe');
    }

    await connection.end();
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

executarMigracao();

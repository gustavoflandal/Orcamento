const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function executarMigracaoCompleta() {
  try {
    console.log('Conectando ao banco de dados...');
    
    // Primeiro conectar sem especificar database para criar se necessário
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    console.log('Lendo arquivo de migração...');
    const sqlScript = fs.readFileSync('./migrations/criar_tabelas_completo.sql', 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript.split(';').filter(cmd => cmd.trim().length > 0);
    
    console.log(`Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        try {
          console.log(`Executando comando ${i + 1}/${commands.length}...`);
          await connection.query(command);
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('Unknown database')) {
            console.log(`Comando com erro: ${command.substring(0, 50)}...`);
            console.log(`Erro: ${error.message}`);
          }
        }
      }
    }
    
    await connection.end();
    console.log('Migração completa executada com sucesso!');
  } catch (error) {
    console.error('Erro na migração completa:', error.message);
    process.exit(1);
  }
}

executarMigracaoCompleta();

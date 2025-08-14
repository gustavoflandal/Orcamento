const mysql = require('mysql2/promise');
require('dotenv').config();

async function testarCadastroComCategorias() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('=== TESTE DE CADASTRO COM CATEGORIAS PADRÃO ===\n');
    
    // Simular cadastro de usuário de teste
    const testEmail = 'teste@example.com';
    const testLogin = 'usuario_teste';
    const testSenha = 'senha_hash_teste';
    
    console.log('1. Inserindo usuário de teste...');
    const [userResult] = await connection.query(
      'INSERT INTO usuarios (email, login, senha) VALUES (?, ?, ?)', 
      [testEmail, testLogin, testSenha]
    );
    
    const userId = userResult.insertId;
    console.log(`   Usuário criado com ID: ${userId}`);
    
    console.log('2. Inserindo categorias padrão...');
    
    // Inserir categoria Despesa
    const [despesaResult] = await connection.query(
      'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)',
      ['Despesa', 'Débito', '#95a5a6', null, userId]
    );
    console.log(`   Categoria Despesa criada com ID: ${despesaResult.insertId}`);
    
    // Inserir categoria Receita
    const [receitaResult] = await connection.query(
      'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)',
      ['Receita', 'Crédito', '#95a5a6', null, userId]
    );
    console.log(`   Categoria Receita criada com ID: ${receitaResult.insertId}`);
    
    console.log('\n3. Verificando categorias criadas...');
    const [categorias] = await connection.query(
      'SELECT * FROM categorias WHERE id_usuario = ?', 
      [userId]
    );
    
    categorias.forEach(cat => {
      console.log(`   - ${cat.nome} (${cat.tipo}) - Cor: ${cat.cor}`);
    });
    
    console.log('\n4. Limpando dados de teste...');
    await connection.query('DELETE FROM categorias WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    console.log('   Dados de teste removidos.');
    
    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarCadastroComCategorias();

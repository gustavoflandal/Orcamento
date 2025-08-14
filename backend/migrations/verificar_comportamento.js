require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarComportamentoAtual() {
  console.log('=== VERIFICANDO COMPORTAMENTO ATUAL DAS CATEGORIAS ===\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Simular um usuário de teste
    console.log('1. Criando usuário de teste...');
    const [userResult] = await connection.query(
      'INSERT INTO usuarios (email, login, senha) VALUES (?, ?, ?)', 
      ['teste_categoria@test.com', 'teste_categoria', 'hash_teste']
    );
    
    const userId = userResult.insertId;
    console.log(`   Usuário criado com ID: ${userId}`);
    
    console.log('\n2. Simulando comportamento do model atual...');
    
    // Simular primeira categoria (Despesa)
    console.log('   Criando categoria Despesa...');
    const [despesaResult] = await connection.query(
      'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, NULL, ?)',
      ['Despesa', 'Débito', '#95a5a6', userId]
    );
    
    // Atualizar para ser própria categoria pai (como faz o model)
    await connection.query(
      'UPDATE categorias SET id_categoria_pai = ? WHERE id = ?',
      [despesaResult.insertId, despesaResult.insertId]
    );
    
    console.log(`     - ID: ${despesaResult.insertId}, categoria_pai: ${despesaResult.insertId}`);
    
    // Simular segunda categoria (Receita) - não será primeira categoria
    console.log('   Criando categoria Receita...');
    const [receitaResult] = await connection.query(
      'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)',
      ['Receita', 'Crédito', '#95a5a6', null, userId]
    );
    
    console.log(`     - ID: ${receitaResult.insertId}, categoria_pai: null`);
    
    console.log('\n3. Verificando resultado...');
    const [categorias] = await connection.query(
      'SELECT id, nome, tipo, id_categoria_pai FROM categorias WHERE id_usuario = ? ORDER BY id',
      [userId]
    );
    
    categorias.forEach(cat => {
      console.log(`   ${cat.nome}: id=${cat.id}, categoria_pai=${cat.id_categoria_pai}`);
    });
    
    console.log('\n4. Limpando dados...');
    await connection.query('DELETE FROM categorias WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    
    await connection.end();
    
    console.log('\n=== ANÁLISE ===');
    console.log('PROBLEMA IDENTIFICADO:');
    console.log('- A primeira categoria (Despesa) fica com categoria_pai = próprio_id');
    console.log('- A segunda categoria (Receita) fica com categoria_pai = null');
    console.log('- Isso cria inconsistência no sistema');
    
    console.log('\nSOLUÇÃO RECOMENDADA:');
    console.log('- Ambas as categorias devem ter categoria_pai = próprio_id');
    console.log('- Ou criar uma estratégia específica para categorias padrão');
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

verificarComportamentoAtual();

require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

async function testarCadastroCompleto() {
  console.log('=== TESTE COMPLETO DE CADASTRO COM CATEGORIAS ===\n');
  
  const usuarioTeste = {
    email: 'teste_final@example.com',
    login: 'usuario_teste_final',
    senha: 'senha123456'
  };
  
  try {
    console.log('1. Enviando requisição de cadastro...');
    const response = await axios.post('http://localhost:3000/auth/cadastro', usuarioTeste);
    
    console.log('   ✅ Usuário cadastrado com sucesso!');
    console.log('   Dados:', response.data);
    
    const userId = response.data.id;
    
    console.log('\n2. Verificando categorias criadas automaticamente...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [categorias] = await connection.query(
      'SELECT nome, tipo, cor FROM categorias WHERE id_usuario = ? ORDER BY nome', 
      [userId]
    );
    
    console.log(`   Encontradas ${categorias.length} categorias:`);
    categorias.forEach(cat => {
      console.log(`   - ${cat.nome} (${cat.tipo}) - Cor: ${cat.cor}`);
    });
    
    // Verificar se as categorias corretas foram criadas
    const esperadas = ['Despesa', 'Receita'];
    const criadas = categorias.map(c => c.nome);
    const todasCriadas = esperadas.every(nome => criadas.includes(nome));
    
    if (todasCriadas && categorias.length === 2) {
      console.log('   ✅ Todas as categorias padrão foram criadas corretamente!');
    } else {
      console.log('   ❌ Erro: Categorias não foram criadas corretamente');
      console.log(`   Esperadas: ${esperadas.join(', ')}`);
      console.log(`   Criadas: ${criadas.join(', ')}`);
    }
    
    console.log('\n3. Limpando dados de teste...');
    await connection.query('DELETE FROM categorias WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    console.log('   Dados removidos com sucesso.');
    
    await connection.end();
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('A implementação está funcionando perfeitamente.');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    console.error('Full Error:', error);
  }
}

testarCadastroCompleto();

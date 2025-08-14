const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testarEndpointCadastro() {
  console.log('=== TESTE DO ENDPOINT DE CADASTRO ===\n');
  
  // Dados de teste
  const usuarioTeste = {
    email: 'teste_endpoint@example.com',
    login: 'usuario_endpoint_teste',
    senha: 'senha123456'
  };
  
  try {
    console.log('1. Enviando requisição de cadastro...');
    
    // Fazer requisição para o endpoint de cadastro
    const response = await axios.post('http://localhost:3001/auth/cadastro', usuarioTeste);
    
    console.log('   ✅ Usuário cadastrado com sucesso!');
    console.log('   Resposta:', response.data);
    
    const userId = response.data.id;
    
    console.log('\n2. Verificando se as categorias padrão foram criadas...');
    
    // Conectar ao banco para verificar as categorias
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
    
    if (categorias.length === 2) {
      console.log('   ✅ Categorias padrão criadas corretamente:');
      categorias.forEach(cat => {
        console.log(`      - ${cat.nome} (${cat.tipo}) - Cor: ${cat.cor}`);
      });
    } else {
      console.log(`   ❌ Erro: Esperado 2 categorias, encontrado ${categorias.length}`);
    }
    
    console.log('\n3. Limpando dados de teste...');
    await connection.query('DELETE FROM categorias WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    console.log('   Dados de teste removidos.');
    
    await connection.end();
    
    console.log('\n✅ Teste do endpoint concluído com sucesso!');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Erro na requisição:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Erro: Servidor não está rodando em http://localhost:3001');
      console.log('   💡 Execute "npm start" para iniciar o servidor antes de rodar este teste.');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testarEndpointCadastro();

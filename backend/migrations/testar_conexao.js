const axios = require('axios');

async function testarConexao() {
  try {
    console.log('Testando conexão com o servidor...');
    const response = await axios.get('http://localhost:3001/');
    console.log('✅ Servidor respondeu:', response.status);
  } catch (error) {
    console.log('❌ Erro detalhado:');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testarConexao();

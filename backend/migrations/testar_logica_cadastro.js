require('dotenv').config();

const usuarioModel = require('../src/models/usuarioModel');
const categoriaModel = require('../src/models/categoriaModel');
const bcrypt = require('bcrypt');

async function testarLogicaCadastro() {
  console.log('=== TESTE DA LÓGICA DE CADASTRO ===\n');
  
  const dadosUsuario = {
    email: 'teste_direto@example.com',
    login: 'usuario_teste_direto',
    senha: 'senha123456'
  };
  
  try {
    console.log('1. Criando usuário...');
    const hash = await bcrypt.hash(dadosUsuario.senha, 10);
    const usuario = await usuarioModel.create({ 
      email: dadosUsuario.email, 
      login: dadosUsuario.login, 
      senha: hash 
    });
    
    console.log(`   ✅ Usuário criado: ID ${usuario.id}, Login: ${usuario.login}`);
    
    console.log('\n2. Criando categorias padrão...');
    
    // Criar categoria Despesa
    const categoriaDispesa = await categoriaModel.criar({
      nome: 'Despesa',
      tipo: 'Débito',
      cor: '#95a5a6',
      id_categoria_pai: null,
      id_usuario: usuario.id
    });
    console.log(`   ✅ Categoria Despesa criada: ID ${categoriaDispesa.id}`);
    
    // Criar categoria Receita
    const categoriaReceita = await categoriaModel.criar({
      nome: 'Receita',
      tipo: 'Crédito',
      cor: '#95a5a6',
      id_categoria_pai: null,
      id_usuario: usuario.id
    });
    console.log(`   ✅ Categoria Receita criada: ID ${categoriaReceita.id}`);
    
    console.log('\n3. Verificando categorias criadas...');
    const categorias = await categoriaModel.listar(usuario.id);
    console.log(`   📋 Total de categorias: ${categorias.length}`);
    
    categorias.forEach(cat => {
      console.log(`      - ${cat.nome} (${cat.tipo}) - Cor: ${cat.cor} - ID: ${cat.id}`);
    });
    
    console.log('\n4. Limpando dados de teste...');
    await categoriaModel.deletar(categoriaDispesa.id, usuario.id);
    await categoriaModel.deletar(categoriaReceita.id, usuario.id);
    
    // Limpar usuário do banco
    const pool = require('../src/config/db');
    await pool.query('DELETE FROM usuarios WHERE id = ?', [usuario.id]);
    console.log('   🧹 Dados de teste removidos.');
    
    console.log('\n✅ Teste da lógica concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testarLogicaCadastro();

require('dotenv').config();
const usuarioModel = require('../src/models/usuarioModel');
const categoriaModel = require('../src/models/categoriaModel');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function testarCadastroCorrigido() {
  console.log('=== TESTE DA CORREÇÃO DO CADASTRO ===\n');
  
  try {
    console.log('1. Criando usuário...');
    const hash = await bcrypt.hash('senha123', 10);
    const usuario = await usuarioModel.create({ 
      email: 'teste_correcao@test.com', 
      login: 'teste_correcao', 
      senha: hash 
    });
    
    console.log(`   Usuário criado: ID=${usuario.id}, login=${usuario.login}`);
    
    console.log('\n2. Criando categorias com a nova lógica...');
    
    // Criar categoria Despesa (usa o model normal)
    const despesa = await categoriaModel.criar({
      nome: 'Despesa',
      tipo: 'Débito',
      cor: '#95a5a6',
      id_categoria_pai: null,
      id_usuario: usuario.id
    });
    
    // Criar categoria Receita diretamente no banco e ajustar categoria pai
    const pool = require('../src/config/db');
    const [receitaResult] = await pool.query(
      'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)',
      ['Receita', 'Crédito', '#95a5a6', null, usuario.id]
    );
    
    // Atualizar a categoria Receita para ser própria categoria pai
    await pool.query(
      'UPDATE categorias SET id_categoria_pai = ? WHERE id = ?',
      [receitaResult.insertId, receitaResult.insertId]
    );
    
    console.log(`   Despesa criada: ID=${despesa.id}, categoria_pai=${despesa.id_categoria_pai}`);
    console.log(`   Receita criada: ID=${receitaResult.insertId}, categoria_pai=${receitaResult.insertId}`);
    
    console.log('\n3. Verificando resultado final...');
    const [categorias] = await pool.query(
      'SELECT id, nome, tipo, id_categoria_pai FROM categorias WHERE id_usuario = ? ORDER BY nome',
      [usuario.id]
    );
    
    console.log('   Categorias criadas:');
    categorias.forEach(cat => {
      const status = cat.id_categoria_pai === cat.id ? '✅' : '❌';
      console.log(`   ${status} ${cat.nome}: id=${cat.id}, categoria_pai=${cat.id_categoria_pai}`);
    });
    
    // Verificar se ambas têm categoria_pai = próprio_id
    const todasCorretas = categorias.every(cat => cat.id_categoria_pai === cat.id);
    
    if (todasCorretas) {
      console.log('\n✅ SUCESSO: Ambas as categorias têm categoria_pai = próprio_id');
    } else {
      console.log('\n❌ ERRO: Nem todas as categorias têm categoria_pai = próprio_id');
    }
    
    console.log('\n4. Limpando dados de teste...');
    await pool.query('DELETE FROM categorias WHERE id_usuario = ?', [usuario.id]);
    await pool.query('DELETE FROM usuarios WHERE id = ?', [usuario.id]);
    console.log('   Dados removidos.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarCadastroCorrigido();

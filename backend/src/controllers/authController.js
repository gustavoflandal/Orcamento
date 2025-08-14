const usuarioModel = require('../models/usuarioModel');
const categoriaModel = require('../models/categoriaModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  try {
    const { login, senha } = req.body;
    const usuario = await usuarioModel.findByLoginOrEmail(login);
    if (!usuario) return res.status(400).json({ error: 'Usuário não encontrado.' });
    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) return res.status(400).json({ error: 'Senha inválida.' });
    const token = jwt.sign({ id: usuario.id, login: usuario.login }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.cadastro = async (req, res, next) => {
  try {
    const { email, login, senha } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    const usuario = await usuarioModel.create({ email, login, senha: hash });
    
    // Criar categorias padrão para o novo usuário
    try {
      // Criar categoria Despesa
      const despesa = await categoriaModel.criar({
        nome: 'Despesa',
        tipo: 'Débito',
        cor: '#95a5a6',
        id_categoria_pai: null,
        id_usuario: usuario.id
      });
      
      // Criar categoria Receita e definir como própria categoria pai
      const pool = require('../config/db');
      const [receitaResult] = await pool.query(
        'INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES (?, ?, ?, ?, ?)',
        ['Receita', 'Crédito', '#95a5a6', null, usuario.id]
      );
      
      // Atualizar a categoria Receita para ser própria categoria pai
      await pool.query(
        'UPDATE categorias SET id_categoria_pai = ? WHERE id = ?',
        [receitaResult.insertId, receitaResult.insertId]
      );
      
      console.log(`Categorias padrão criadas para o usuário ${usuario.login} (ID: ${usuario.id})`);
      console.log(`- Despesa: ID=${despesa.id}, categoria_pai=${despesa.id_categoria_pai}`);
      console.log(`- Receita: ID=${receitaResult.insertId}, categoria_pai=${receitaResult.insertId}`);
    } catch (categoriaError) {
      console.error('Erro ao criar categorias padrão:', categoriaError);
      // Não interrompe o cadastro do usuário mesmo se houver erro nas categorias
    }
    
    res.status(201).json({ id: usuario.id, email: usuario.email, login: usuario.login });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email ou login já cadastrado.' });
    }
    next(err);
  }
};

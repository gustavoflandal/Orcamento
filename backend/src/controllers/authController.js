const usuarioModel = require('../models/usuarioModel');
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
    res.status(201).json({ id: usuario.id, email: usuario.email, login: usuario.login });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email ou login já cadastrado.' });
    }
    next(err);
  }
};

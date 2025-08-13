const categoriaModel = require('../models/categoriaModel');
const logger = require('../utils/logger');

exports.listar = async (req, res, next) => {
  try {
    const categorias = await categoriaModel.listar(req.user.id);
    res.json(categorias);
  } catch (err) {
    next(err);
  }
};

exports.obter = async (req, res, next) => {
  try {
    const categoria = await categoriaModel.obter(req.params.id, req.user.id);
    if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(categoria);
  } catch (err) {
    next(err);
  }
};


exports.criar = async (req, res, next) => {
  try {
    logger.info('[CATEGORIA][CRIAR] Dados recebidos', { body: req.body, user: req.user });
    const { nome, tipo, cor } = req.body;
    if (!nome || nome.length < 2) {
      logger.warn('[CATEGORIA][CRIAR] Nome inválido', { nome });
      return res.status(400).json({ error: 'Nome obrigatório (mínimo 2 caracteres).' });
    }
    if (!['Débito', 'Crédito'].includes(tipo)) {
      logger.warn('[CATEGORIA][CRIAR] Tipo inválido', { tipo });
      return res.status(400).json({ error: 'Tipo inválido.' });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      logger.warn('[CATEGORIA][CRIAR] Cor inválida', { cor });
      return res.status(400).json({ error: 'Cor inválida.' });
    }
    const nova = await categoriaModel.criar({ ...req.body, id_usuario: req.user.id });
    logger.info('[CATEGORIA][CRIAR] Categoria criada com sucesso', { nova });
    res.status(201).json(nova);
  } catch (err) {
    logger.error('[CATEGORIA][CRIAR] Erro ao criar categoria', { error: err, body: req.body, user: req.user });
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Já existe uma categoria com esse nome.' });
    } else {
      next(err);
    }
  }
};

exports.atualizar = async (req, res, next) => {
  try {
    logger.info('[CATEGORIA][ATUALIZAR] Dados recebidos', { body: req.body, user: req.user, id: req.params.id });
    const { nome, tipo, cor } = req.body;
    if (!nome || nome.length < 2) {
      logger.warn('[CATEGORIA][ATUALIZAR] Nome inválido', { nome });
      return res.status(400).json({ error: 'Nome obrigatório (mínimo 2 caracteres).' });
    }
    if (!['Débito', 'Crédito'].includes(tipo)) {
      logger.warn('[CATEGORIA][ATUALIZAR] Tipo inválido', { tipo });
      return res.status(400).json({ error: 'Tipo inválido.' });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      logger.warn('[CATEGORIA][ATUALIZAR] Cor inválida', { cor });
      return res.status(400).json({ error: 'Cor inválida.' });
    }
    await categoriaModel.atualizar(req.params.id, req.body, req.user.id);
    logger.info('[CATEGORIA][ATUALIZAR] Categoria atualizada com sucesso', { id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    logger.error('[CATEGORIA][ATUALIZAR] Erro ao atualizar categoria', { error: err, body: req.body, user: req.user, id: req.params.id });
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Já existe uma categoria com esse nome.' });
    } else {
      next(err);
    }
  }
};

exports.deletar = async (req, res, next) => {
  try {
    await categoriaModel.deletar(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    // Erro de integridade referencial (categoria tem filhos ou operações)
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      res.status(400).json({ error: 'Não é possível excluir: existem registros vinculados a esta categoria.' });
    } else {
      next(err);
    }
  }
};

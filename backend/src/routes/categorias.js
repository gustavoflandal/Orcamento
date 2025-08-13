const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(auth);

router.get('/', categoriaController.listar);
router.get('/:id', param('id').isInt(), validate, categoriaController.obter);
router.post('/', [
  body('nome').notEmpty(),
  body('tipo').isIn(['Débito', 'Crédito']),
  body('cor').matches(/^#[0-9A-Fa-f]{6}$/),
  body('id_categoria_pai').optional().isInt().toInt()
], validate, categoriaController.criar);
router.put('/:id', [
  param('id').isInt(),
  body('nome').notEmpty(),
  body('tipo').isIn(['Débito', 'Crédito']),
  body('cor').matches(/^#[0-9A-Fa-f]{6}$/),
  body('id_categoria_pai').optional().isInt().toInt()
], validate, categoriaController.atualizar);
router.delete('/:id', param('id').isInt(), validate, categoriaController.deletar);

module.exports = router;

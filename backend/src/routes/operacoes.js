const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const operacaoController = require('../controllers/operacaoController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(auth);

router.get('/', operacaoController.listar);
router.get('/:id', param('id').isInt(), validate, operacaoController.obter);
router.post('/', [
  body('data').matches(/^\d{2}\/\d{2}\/\d{4}$/),
  body('descricao').notEmpty(),
  body('id_categoria').isInt(),
  body('valor').isFloat({ gt: 0 })
], validate, operacaoController.criar);
router.put('/:id', [
  param('id').isInt(),
  body('data').matches(/^\d{2}\/\d{2}\/\d{4}$/),
  body('descricao').notEmpty(),
  body('id_categoria').isInt(),
  body('valor').isFloat({ gt: 0 })
], validate, operacaoController.atualizar);
router.delete('/:id', param('id').isInt(), validate, operacaoController.deletar);
router.put('/:id/pagar', param('id').isInt(), validate, operacaoController.pagar);
router.put('/:id/estornar', param('id').isInt(), validate, operacaoController.estornar);

module.exports = router;

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const despesaRecorrenteController = require('../controllers/despesaRecorrenteController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(auth);

router.get('/', despesaRecorrenteController.listar);
router.get('/:id', param('id').isInt(), validate, despesaRecorrenteController.obter);
router.post('/', [
  body('descricao').notEmpty(),
  body('valor_total').isFloat({ gt: 0 }),
  body('numero_parcelas').isInt({ gt: 0 }),
  body('primeiro_vencimento').matches(/^\d{2}\/\d{2}\/\d{4}$/),
  body('id_categoria').isInt(),
  body('periodo').isInt({ gt: 0 })
], validate, despesaRecorrenteController.criar);
router.delete('/:id', param('id').isInt(), validate, despesaRecorrenteController.deletar);
router.put('/:id', [
  param('id').isInt(),
  body('descricao').notEmpty(),
  body('valor_total').isFloat({ gt: 0 }),
  body('numero_parcelas').isInt({ gt: 0 }),
  body('primeiro_vencimento').matches(/^\d{2}\/\d{2}\/\d{4}$/),
  body('id_categoria').isInt(),
  body('periodo').isInt({ gt: 0 })
], validate, despesaRecorrenteController.atualizar);
router.post('/:id/recriar-parcelas', param('id').isInt(), validate, despesaRecorrenteController.recriarParcelas);
router.get('/:id/parcelas', param('id').isInt(), validate, despesaRecorrenteController.listarParcelas);

module.exports = router;

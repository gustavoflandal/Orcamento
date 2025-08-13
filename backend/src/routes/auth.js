const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');

router.post('/login', [
  body('login').notEmpty(),
  body('senha').isLength({ min: 6 })
], validate, authController.login);

router.post('/cadastro', [
  body('email').isEmail(),
  body('login').notEmpty(),
  body('senha').isLength({ min: 6 })
], validate, authController.cadastro);

module.exports = router;

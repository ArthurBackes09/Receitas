const express = require('express');
const configuracaoController = require('../controllers/configuracaoController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autorizacao = require('../middlewares/autorizacaoMiddleware');

const router = express.Router();

router.get('/', configuracaoController.consultar);
router.put('/', autenticacao, autorizacao('administrador'), configuracaoController.atualizar);

module.exports = router;

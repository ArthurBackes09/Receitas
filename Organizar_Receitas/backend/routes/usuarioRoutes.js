const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autorizacao = require('../middlewares/autorizacaoMiddleware');

const router = express.Router();

router.post('/cadastrar', usuarioController.cadastrar);
router.post('/login', usuarioController.login);
router.get('/eu', autenticacao, usuarioController.dadosAutenticado);
router.get('/admin', autenticacao, autorizacao('administrador'), usuarioController.dadosAdmin);

module.exports = router;

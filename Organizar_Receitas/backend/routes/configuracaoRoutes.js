const express = require('express');
const configuracaoController = require('../controllers/configuracaoController');
const imagemController = require('../controllers/imagemController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autorizacao = require('../middlewares/autorizacaoMiddleware');
const { receberImagem } = require('../middlewares/uploadImagemMiddleware');

const router = express.Router();

router.get('/', configuracaoController.consultar);
router.post('/imagem', autenticacao, autorizacao('administrador'), receberImagem, imagemController.enviarImagemConfiguracao);
router.put('/', autenticacao, autorizacao('administrador'), configuracaoController.atualizar);

module.exports = router;

const express = require('express');
const receitaController = require('../controllers/receitaController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autenticacaoOpcional = require('../middlewares/autenticacaoOpcionalMiddleware');
const autorizacao = require('../middlewares/autorizacaoMiddleware');
const { receberImagem } = require('../middlewares/uploadImagemMiddleware');
const imagemController = require('../controllers/imagemController');

const router = express.Router();

router.get('/publicas', receitaController.listarPublicas);
router.get('/minhas', autenticacao, receitaController.listarMinhas);
router.get('/administracao', autenticacao, autorizacao('administrador'), receitaController.listarAdministracao);
router.post('/imagem', autenticacao, receberImagem, imagemController.enviarImagemReceita);
router.get('/:id', autenticacaoOpcional, receitaController.consultarUma);
router.post('/', autenticacao, receitaController.cadastrar);
router.put('/:id', autenticacao, receitaController.atualizar);
router.delete('/:id', autenticacao, receitaController.excluir);

module.exports = router;

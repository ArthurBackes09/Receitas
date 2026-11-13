const express = require('express');
const categoriaController = require('../controllers/categoriaController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autorizacao = require('../middlewares/autorizacaoMiddleware');

const router = express.Router();

router.get('/', categoriaController.listar);
router.get('/:id/subcategorias', categoriaController.listarSubcategorias);
router.post('/', autenticacao, autorizacao('administrador'), categoriaController.criar);
router.put('/:id', autenticacao, autorizacao('administrador'), categoriaController.atualizar);
router.delete('/:id', autenticacao, autorizacao('administrador'), categoriaController.excluir);
router.post('/:id/subcategorias', autenticacao, autorizacao('administrador'), categoriaController.criarSubcategoria);
router.put('/subcategorias/:id', autenticacao, autorizacao('administrador'), categoriaController.atualizarSubcategoria);
router.delete('/subcategorias/:id', autenticacao, autorizacao('administrador'), categoriaController.excluirSubcategoria);

module.exports = router;

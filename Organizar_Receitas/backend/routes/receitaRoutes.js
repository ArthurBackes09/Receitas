const express = require('express');
const receitaController = require('../controllers/receitaController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');
const autenticacaoOpcional = require('../middlewares/autenticacaoOpcionalMiddleware');

const router = express.Router();

router.get('/publicas', receitaController.listarPublicas);
router.get('/minhas', autenticacao, receitaController.listarMinhas);
router.get('/:id', autenticacaoOpcional, receitaController.consultarUma);
router.post('/', autenticacao, receitaController.cadastrar);
router.put('/:id', autenticacao, receitaController.atualizar);
router.delete('/:id', autenticacao, receitaController.excluir);

module.exports = router;

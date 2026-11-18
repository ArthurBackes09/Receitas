const express = require('express');
const videoController = require('../controllers/videoController');
const autenticacao = require('../middlewares/autenticacaoMiddleware');

const router = express.Router();

router.use(autenticacao);
router.get('/minhas', videoController.listarMeus);
router.post('/', videoController.cadastrar);
router.put('/:id', videoController.atualizar);
router.delete('/:id', videoController.excluir);

module.exports = router;

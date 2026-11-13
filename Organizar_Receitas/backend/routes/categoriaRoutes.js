const express = require('express');
const categoriaController = require('../controllers/categoriaController');

const router = express.Router();

router.get('/', categoriaController.listar);
router.get('/:id/subcategorias', categoriaController.listarSubcategorias);

module.exports = router;

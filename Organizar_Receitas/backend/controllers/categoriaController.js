const conexao = require('../database/conexao');

async function listar(req, res) {
  try {
    const [categorias] = await conexao.execute(
      'SELECT id, nome FROM categorias ORDER BY nome'
    );
    return res.json({ categorias });
  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar categorias.' });
  }
}

async function listarSubcategorias(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ mensagem: 'Categoria inválida.' });
  }
  const categoriaId = Number(req.params.id);
  if (!Number.isSafeInteger(categoriaId) || categoriaId < 1) {
    return res.status(400).json({ mensagem: 'Categoria inválida.' });
  }

  try {
    const [categorias] = await conexao.execute(
      'SELECT id FROM categorias WHERE id = ?',
      [categoriaId]
    );
    if (categorias.length === 0) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }

    const [subcategorias] = await conexao.execute(
      'SELECT id, nome, categoria_id FROM subcategorias WHERE categoria_id = ? ORDER BY nome',
      [categoriaId]
    );
    return res.json({ subcategorias });
  } catch (erro) {
    console.error('Erro ao listar subcategorias:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar subcategorias.' });
  }
}

module.exports = { listar, listarSubcategorias };

const conexao = require('../database/conexao');

function validarNome(nome) {
  return typeof nome === 'string' && nome.trim().length > 0 && nome.trim().length <= 50
    ? nome.trim()
    : null;
}

function validarId(valor) {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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

async function criar(req, res) {
  const nome = validarNome(req.body && req.body.nome);
  if (!nome) return res.status(400).json({ mensagem: 'Informe um nome com até 50 caracteres.' });

  try {
    const [resultado] = await conexao.execute(
      'INSERT INTO categorias (nome) VALUES (?)',
      [nome]
    );
    return res.status(201).json({
      mensagem: 'Categoria criada com sucesso.',
      categoria: { id: resultado.insertId, nome }
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Já existe uma categoria com esse nome.' });
    }
    console.error('Erro ao criar categoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao criar categoria.' });
  }
}

async function atualizar(req, res) {
  const id = validarId(req.params.id);
  const nome = validarNome(req.body && req.body.nome);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de categoria inválido.' });
  if (!nome) return res.status(400).json({ mensagem: 'Informe um nome com até 50 caracteres.' });

  try {
    const [resultado] = await conexao.execute(
      'UPDATE categorias SET nome = ? WHERE id = ?',
      [nome, id]
    );
    if (resultado.affectedRows === 0) {
      const [categorias] = await conexao.execute('SELECT id FROM categorias WHERE id = ?', [id]);
      if (categorias.length === 0) return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }
    return res.json({ mensagem: 'Categoria atualizada com sucesso.' });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Já existe uma categoria com esse nome.' });
    }
    console.error('Erro ao atualizar categoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar categoria.' });
  }
}

async function excluir(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de categoria inválido.' });

  try {
    const [resultado] = await conexao.execute('DELETE FROM categorias WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    return res.json({ mensagem: 'Categoria excluída com sucesso.' });
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2' || erro.errno === 1451) {
      return res.status(409).json({
        mensagem: 'Não é possível excluir uma categoria que já está sendo usada por receitas ou vídeos.'
      });
    }
    console.error('Erro ao excluir categoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao excluir categoria.' });
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

async function criarSubcategoria(req, res) {
  const categoriaId = validarId(req.params.id);
  const nome = validarNome(req.body && req.body.nome);
  if (!categoriaId) return res.status(400).json({ mensagem: 'Identificador de categoria inválido.' });
  if (!nome) return res.status(400).json({ mensagem: 'Informe um nome com até 50 caracteres.' });

  try {
    const [categorias] = await conexao.execute('SELECT id FROM categorias WHERE id = ?', [categoriaId]);
    if (categorias.length === 0) return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    const [resultado] = await conexao.execute(
      'INSERT INTO subcategorias (categoria_id, nome) VALUES (?, ?)',
      [categoriaId, nome]
    );
    return res.status(201).json({
      mensagem: 'Subcategoria criada com sucesso.',
      subcategoria: { id: resultado.insertId, categoria_id: categoriaId, nome }
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Essa subcategoria já existe nesta categoria.' });
    }
    console.error('Erro ao criar subcategoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao criar subcategoria.' });
  }
}

async function atualizarSubcategoria(req, res) {
  const id = validarId(req.params.id);
  const nome = validarNome(req.body && req.body.nome);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de subcategoria inválido.' });
  if (!nome) return res.status(400).json({ mensagem: 'Informe um nome com até 50 caracteres.' });

  try {
    const [resultado] = await conexao.execute(
      'UPDATE subcategorias SET nome = ? WHERE id = ?',
      [nome, id]
    );
    if (resultado.affectedRows === 0) {
      const [subcategorias] = await conexao.execute('SELECT id FROM subcategorias WHERE id = ?', [id]);
      if (subcategorias.length === 0) return res.status(404).json({ mensagem: 'Subcategoria não encontrada.' });
    }
    return res.json({ mensagem: 'Subcategoria atualizada com sucesso.' });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Essa subcategoria já existe nesta categoria.' });
    }
    console.error('Erro ao atualizar subcategoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar subcategoria.' });
  }
}

async function excluirSubcategoria(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de subcategoria inválido.' });

  try {
    const [resultado] = await conexao.execute('DELETE FROM subcategorias WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Subcategoria não encontrada.' });
    return res.json({ mensagem: 'Subcategoria excluída com sucesso.' });
  } catch (erro) {
    console.error('Erro ao excluir subcategoria:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao excluir subcategoria.' });
  }
}

module.exports = {
  listar,
  criar,
  atualizar,
  excluir,
  listarSubcategorias,
  criarSubcategoria,
  atualizarSubcategoria,
  excluirSubcategoria
};

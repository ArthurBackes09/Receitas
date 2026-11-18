const conexao = require('../database/conexao');

function validarId(valor) {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarIdCategoria(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return null;
  if (!/^\d+$/.test(String(valor))) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarDados(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erro: 'Envie os dados do vídeo.' };
  }

  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const urlVideo = typeof body.url_video === 'string' ? body.url_video.trim() : '';
  const categoriaId = validarIdCategoria(body.categoria_id);
  const subcategoriaId = body.subcategoria_id === '' || body.subcategoria_id == null
    ? null
    : validarIdCategoria(body.subcategoria_id);

  let urlValida = false;
  try {
    const url = new URL(urlVideo);
    urlValida = ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch (erro) {
    urlValida = false;
  }

  if (!titulo || titulo.length > 150) {
    return { erro: 'O título é obrigatório e deve ter até 150 caracteres.' };
  }
  if (!urlValida || urlVideo.length > 500) {
    return { erro: 'Informe um link HTTP ou HTTPS válido com até 500 caracteres.' };
  }
  if (Buffer.byteLength(descricao, 'utf8') > 65000) {
    return { erro: 'A descrição do vídeo excede o limite permitido.' };
  }
  if (!categoriaId) return { erro: 'Selecione uma categoria válida.' };
  if (body.subcategoria_id !== '' && body.subcategoria_id != null && !subcategoriaId) {
    return { erro: 'Selecione uma subcategoria válida.' };
  }

  return {
    dados: {
      titulo,
      descricao: descricao || null,
      url_video: urlVideo,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId
    }
  };
}

async function validarCategoria(categoriaId, subcategoriaId) {
  const [categorias] = await conexao.execute(
    'SELECT id FROM categorias WHERE id = ?',
    [categoriaId]
  );
  if (categorias.length === 0) return 'A categoria selecionada não existe.';

  if (subcategoriaId) {
    const [subcategorias] = await conexao.execute(
      'SELECT id FROM subcategorias WHERE id = ? AND categoria_id = ?',
      [subcategoriaId, categoriaId]
    );
    if (subcategorias.length === 0) return 'A subcategoria não pertence à categoria selecionada.';
  }
  return null;
}

function validarFiltros(query) {
  if (query.categoria && !validarIdCategoria(query.categoria)) {
    return 'O filtro de categoria é inválido.';
  }
  if (query.busca && (typeof query.busca !== 'string' || query.busca.trim().length > 100)) {
    return 'A pesquisa deve ter até 100 caracteres.';
  }
  return null;
}

async function listarMeus(req, res) {
  const erroFiltro = validarFiltros(req.query);
  if (erroFiltro) return res.status(400).json({ mensagem: erroFiltro });

  const parametros = [req.usuario.id];
  let filtros = '';
  if (req.query.categoria) {
    filtros += ' AND v.categoria_id = ?';
    parametros.push(validarIdCategoria(req.query.categoria));
  }
  if (req.query.busca) {
    filtros += ' AND (v.titulo LIKE ? OR v.descricao LIKE ?)';
    const busca = `%${req.query.busca.trim()}%`;
    parametros.push(busca, busca);
  }

  try {
    const [videos] = await conexao.execute(
      `SELECT v.id, v.usuario_id, v.categoria_id, v.subcategoria_id,
              v.titulo, v.descricao, v.url_video, v.criado_em,
              c.nome AS categoria, s.nome AS subcategoria
       FROM videos_salvos v
       JOIN categorias c ON c.id = v.categoria_id
       LEFT JOIN subcategorias s ON s.id = v.subcategoria_id
       WHERE v.usuario_id = ?${filtros}
       ORDER BY v.criado_em DESC, v.id DESC`,
      parametros
    );
    return res.json({ videos });
  } catch (erro) {
    console.error('Erro ao listar vídeos salvos:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar vídeos salvos.' });
  }
}

async function cadastrar(req, res) {
  const validacao = validarDados(req.body);
  if (validacao.erro) return res.status(400).json({ mensagem: validacao.erro });

  try {
    const erroCategoria = await validarCategoria(
      validacao.dados.categoria_id,
      validacao.dados.subcategoria_id
    );
    if (erroCategoria) return res.status(400).json({ mensagem: erroCategoria });

    const dados = validacao.dados;
    const [resultado] = await conexao.execute(
      `INSERT INTO videos_salvos
        (usuario_id, categoria_id, subcategoria_id, titulo, descricao, url_video)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        dados.categoria_id,
        dados.subcategoria_id,
        dados.titulo,
        dados.descricao,
        dados.url_video
      ]
    );
    return res.status(201).json({
      mensagem: 'Vídeo salvo com sucesso.',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error('Erro ao salvar vídeo:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao salvar vídeo.' });
  }
}

async function atualizar(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de vídeo inválido.' });

  const validacao = validarDados(req.body);
  if (validacao.erro) return res.status(400).json({ mensagem: validacao.erro });

  try {
    const [videos] = await conexao.execute(
      'SELECT id FROM videos_salvos WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    if (videos.length === 0) {
      return res.status(404).json({ mensagem: 'Vídeo não encontrado nos seus itens salvos.' });
    }

    const erroCategoria = await validarCategoria(
      validacao.dados.categoria_id,
      validacao.dados.subcategoria_id
    );
    if (erroCategoria) return res.status(400).json({ mensagem: erroCategoria });

    const dados = validacao.dados;
    await conexao.execute(
      `UPDATE videos_salvos
       SET categoria_id = ?, subcategoria_id = ?, titulo = ?, descricao = ?, url_video = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        dados.categoria_id,
        dados.subcategoria_id,
        dados.titulo,
        dados.descricao,
        dados.url_video,
        id,
        req.usuario.id
      ]
    );
    return res.json({ mensagem: 'Vídeo atualizado com sucesso.' });
  } catch (erro) {
    console.error('Erro ao atualizar vídeo salvo:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar vídeo.' });
  }
}

async function excluir(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de vídeo inválido.' });

  try {
    const [resultado] = await conexao.execute(
      'DELETE FROM videos_salvos WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Vídeo não encontrado nos seus itens salvos.' });
    }
    return res.json({ mensagem: 'Vídeo removido dos seus itens salvos.' });
  } catch (erro) {
    console.error('Erro ao excluir vídeo salvo:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao excluir vídeo.' });
  }
}

module.exports = { listarMeus, cadastrar, atualizar, excluir };

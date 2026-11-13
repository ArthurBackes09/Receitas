const conexao = require('../database/conexao');

const camposReceita = `
  r.id, r.usuario_id, r.categoria_id, r.subcategoria_id, r.titulo, r.descricao,
  r.ingredientes, r.modo_preparo, r.foto, r.privacidade,
  c.nome AS categoria, s.nome AS subcategoria, u.nome AS autor
`;

function validarId(valor) {
  if (typeof valor !== 'number' && (typeof valor !== 'string' || !/^\d+$/.test(valor))) {
    return null;
  }
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarDados(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return { erro: 'Envie os dados da receita.' };
  }

  const titulo = typeof dados.titulo === 'string' ? dados.titulo.trim() : '';
  const descricao = typeof dados.descricao === 'string' ? dados.descricao.trim() : '';
  const ingredientes = typeof dados.ingredientes === 'string' ? dados.ingredientes.trim() : '';
  const modoPreparo = typeof dados.modo_preparo === 'string' ? dados.modo_preparo.trim() : '';
  const categoriaId = validarId(dados.categoria_id);
  const subcategoriaId = dados.subcategoria_id === '' || dados.subcategoria_id == null
    ? null
    : validarId(dados.subcategoria_id);
  const privacidade = dados.privacidade === undefined ? 'privada' : dados.privacidade;
  const foto = typeof dados.foto === 'string' ? dados.foto.trim() : '';

  const fotoValida = (() => {
    if (!foto) return true;
    try {
      const endereco = new URL(foto);
      return ['http:', 'https:'].includes(endereco.protocol) && Boolean(endereco.hostname);
    } catch (erro) {
      return false;
    }
  })();

  if (!titulo || titulo.length > 150) {
    return { erro: 'O título é obrigatório e deve ter até 150 caracteres.' };
  }
  if (!ingredientes) return { erro: 'Informe os ingredientes.' };
  if (!modoPreparo) return { erro: 'Informe o modo de preparo.' };
  if ([descricao, ingredientes, modoPreparo].some((texto) => Buffer.byteLength(texto, 'utf8') > 65000)) {
    return { erro: 'A descrição, os ingredientes ou o preparo excedem o limite permitido.' };
  }
  if (!categoriaId) return { erro: 'Selecione uma categoria válida.' };
  if (dados.subcategoria_id !== '' && dados.subcategoria_id != null && !subcategoriaId) {
    return { erro: 'Selecione uma subcategoria válida.' };
  }
  if (!['publica', 'privada'].includes(privacidade)) {
    return { erro: 'A privacidade deve ser pública ou privada.' };
  }
  if (!fotoValida || foto.length > 255) {
    return { erro: 'A foto deve ser um endereço HTTP ou HTTPS com até 255 caracteres.' };
  }

  return {
    dados: {
      titulo,
      descricao: descricao || null,
      ingredientes,
      modo_preparo: modoPreparo,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId,
      foto: foto || null,
      privacidade
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

function montarFiltros(query, parametros, incluirPrivacidade) {
  if (query.categoria) {
    const categoriaId = validarId(query.categoria);
    parametros.push(categoriaId);
    return ` AND r.categoria_id = ?${montarFiltroPrivacidade(query, parametros, incluirPrivacidade)}`;
  }
  return montarFiltroPrivacidade(query, parametros, incluirPrivacidade);
}

function validarFiltros(query, incluirPrivacidade) {
  if (query.categoria && !validarId(query.categoria)) {
    return 'O filtro de categoria é inválido.';
  }
  if (incluirPrivacidade && query.privacidade && !['publica', 'privada'].includes(query.privacidade)) {
    return 'O filtro de privacidade é inválido.';
  }
  if (query.busca && (typeof query.busca !== 'string' || query.busca.trim().length > 100)) {
    return 'A pesquisa deve ter até 100 caracteres.';
  }
  return null;
}

function montarFiltroPrivacidade(query, parametros, incluirPrivacidade) {
  if (incluirPrivacidade && ['publica', 'privada'].includes(query.privacidade)) {
    parametros.push(query.privacidade);
    return ' AND r.privacidade = ?';
  }
  return '';
}

function montarBusca(query, parametros) {
  const busca = typeof query.busca === 'string' ? query.busca.trim() : '';
  if (!busca) return '';
  parametros.push(`%${busca}%`, `%${busca}%`);
  return ' AND (r.titulo LIKE ? OR r.descricao LIKE ?)';
}

async function listarPublicas(req, res) {
  const erroFiltro = validarFiltros(req.query, false);
  if (erroFiltro) return res.status(400).json({ mensagem: erroFiltro });

  try {
    const parametros = [];
    const filtros = montarFiltros(req.query, parametros, false) + montarBusca(req.query, parametros);
    const [receitas] = await conexao.execute(
      `SELECT ${camposReceita}
       FROM receitas r
       JOIN categorias c ON c.id = r.categoria_id
       LEFT JOIN subcategorias s ON s.id = r.subcategoria_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.privacidade = 'publica'${filtros}
       ORDER BY r.id DESC`,
      parametros
    );
    return res.json({ receitas });
  } catch (erro) {
    console.error('Erro ao listar receitas públicas:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar receitas.' });
  }
}

async function listarMinhas(req, res) {
  const erroFiltro = validarFiltros(req.query, true);
  if (erroFiltro) return res.status(400).json({ mensagem: erroFiltro });

  try {
    const parametros = [req.usuario.id];
    const filtros = montarFiltros(req.query, parametros, true) + montarBusca(req.query, parametros);
    const [receitas] = await conexao.execute(
      `SELECT ${camposReceita}
       FROM receitas r
       JOIN categorias c ON c.id = r.categoria_id
       LEFT JOIN subcategorias s ON s.id = r.subcategoria_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.usuario_id = ?${filtros}
       ORDER BY r.id DESC`,
      parametros
    );
    return res.json({ receitas });
  } catch (erro) {
    console.error('Erro ao listar receitas do usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar suas receitas.' });
  }
}

async function consultarUma(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de receita inválido.' });

  try {
    const [receitas] = await conexao.execute(
      `SELECT ${camposReceita}
       FROM receitas r
       JOIN categorias c ON c.id = r.categoria_id
       LEFT JOIN subcategorias s ON s.id = r.subcategoria_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.id = ?`,
      [id]
    );
    if (receitas.length === 0) return res.status(404).json({ mensagem: 'Receita não encontrada.' });

    const receita = receitas[0];
    const proprietaria = req.usuario && Number(req.usuario.id) === Number(receita.usuario_id);
    if (receita.privacidade === 'privada' && !proprietaria) {
      return res.status(404).json({ mensagem: 'Receita não encontrada.' });
    }

    receita.proprietaria = Boolean(proprietaria);
    return res.json({ receita });
  } catch (erro) {
    console.error('Erro ao consultar receita:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar a receita.' });
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
      `INSERT INTO receitas
        (usuario_id, categoria_id, subcategoria_id, titulo, descricao, ingredientes, modo_preparo, foto, privacidade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        dados.categoria_id,
        dados.subcategoria_id,
        dados.titulo,
        dados.descricao,
        dados.ingredientes,
        dados.modo_preparo,
        dados.foto,
        dados.privacidade
      ]
    );
    return res.status(201).json({
      mensagem: 'Receita cadastrada com sucesso.',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error('Erro ao cadastrar receita:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao cadastrar receita.' });
  }
}

async function atualizar(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de receita inválido.' });

  try {
    const [receitas] = await conexao.execute(
      'SELECT usuario_id FROM receitas WHERE id = ?',
      [id]
    );
    if (receitas.length === 0) return res.status(404).json({ mensagem: 'Receita não encontrada.' });
    if (Number(receitas[0].usuario_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ mensagem: 'Você só pode editar suas próprias receitas.' });
    }

    const validacao = validarDados(req.body);
    if (validacao.erro) return res.status(400).json({ mensagem: validacao.erro });

    const erroCategoria = await validarCategoria(
      validacao.dados.categoria_id,
      validacao.dados.subcategoria_id
    );
    if (erroCategoria) return res.status(400).json({ mensagem: erroCategoria });

    const dados = validacao.dados;
    await conexao.execute(
      `UPDATE receitas
       SET categoria_id = ?, subcategoria_id = ?, titulo = ?, descricao = ?,
           ingredientes = ?, modo_preparo = ?, foto = ?, privacidade = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        dados.categoria_id,
        dados.subcategoria_id,
        dados.titulo,
        dados.descricao,
        dados.ingredientes,
        dados.modo_preparo,
        dados.foto,
        dados.privacidade,
        id,
        req.usuario.id
      ]
    );
    return res.json({ mensagem: 'Receita atualizada com sucesso.' });
  } catch (erro) {
    console.error('Erro ao atualizar receita:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar receita.' });
  }
}

async function excluir(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'Identificador de receita inválido.' });

  try {
    const [receitas] = await conexao.execute(
      'SELECT usuario_id FROM receitas WHERE id = ?',
      [id]
    );
    if (receitas.length === 0) return res.status(404).json({ mensagem: 'Receita não encontrada.' });
    if (Number(receitas[0].usuario_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ mensagem: 'Você só pode excluir suas próprias receitas.' });
    }

    await conexao.execute(
      'DELETE FROM receitas WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    return res.json({ mensagem: 'Receita excluída com sucesso.' });
  } catch (erro) {
    console.error('Erro ao excluir receita:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao excluir receita.' });
  }
}

module.exports = { listarPublicas, listarMinhas, consultarUma, cadastrar, atualizar, excluir };

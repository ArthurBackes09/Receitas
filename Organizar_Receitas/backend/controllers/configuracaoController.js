const conexao = require('../database/conexao');

const limites = {
  nome_site: 80,
  texto_rodape: 180,
  nav_categorias: 50,
  nav_explorar: 60,
  nav_inicio: 40,
  nav_entrar: 40,
  nav_minhas: 60,
  nav_admin: 60,
  nav_nova: 60,
  nav_sair: 40,
  login_botao: 40,
  titulo: 100,
  subtitulo: 150,
  descricao: 500,
  foto_destaque: 500,
  foto_cadastro: 500,
  inicio_explorar: 60,
  inicio_acessar: 60,
  categorias_subtitulo: 100,
  categorias_titulo: 100,
  receitas_subtitulo: 100,
  receitas_titulo: 100,
  login_subtitulo: 100,
  login_titulo: 120,
  login_descricao: 250,
  login_cadastro: 100,
  cadastro_subtitulo: 100,
  cadastro_titulo: 120,
  cadastro_descricao: 250,
  cadastro_form_titulo: 100,
  cadastro_botao: 60,
  cadastro_login_prompt: 100,
  cadastro_login_link: 100,
  minhas_subtitulo: 100,
  minhas_titulo: 120,
  minhas_descricao: 250,
  minhas_botao: 60,
  minhas_ver: 60,
  form_subtitulo: 100,
  form_titulo: 120,
  form_descricao: 250,
  form_sobre: 100,
  form_preparo: 100,
  form_imagem: 100,
  form_cancelar: 60,
  form_salvar: 60,
  detalhe_voltar: 80,
  detalhe_ingredientes: 60,
  detalhe_preparo: 60,
  detalhe_editar: 60,
  detalhe_excluir: 60,
  admin_subtitulo: 100,
  admin_titulo: 120,
  admin_descricao: 250,
  admin_receitas: 60,
  admin_receitas_descricao: 250,
  admin_usuarios: 60,
  admin_usuarios_descricao: 250,
  admin_categorias: 100,
  admin_conteudo: 100,
  admin_conteudo_descricao: 250
};

const camposDeUrl = new Set(['foto_destaque', 'foto_cadastro']);

function urlHttpValida(valor) {
  try {
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch (erro) {
    return false;
  }
}

function imagemConfiguracaoValida(valor) {
  if (/^\/uploads\/site\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(valor)) {
    return true;
  }
  return urlHttpValida(valor);
}

async function consultar(req, res) {
  try {
    const [linhas] = await conexao.execute(
      'SELECT chave, valor FROM configuracoes_site'
    );
    const configuracoes = {};
    linhas.forEach((linha) => {
      configuracoes[linha.chave] = linha.valor;
    });
    return res.json({ configuracoes });
  } catch (erro) {
    console.error('Erro ao consultar configurações do site:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar configurações.' });
  }
}

async function atualizar(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return res.status(400).json({ mensagem: 'Envie as configurações do site.' });
  }

  const configuracoes = {};
  for (const [chave, valor] of Object.entries(body)) {
    const limite = limites[chave];
    if (!limite) {
      return res.status(400).json({ mensagem: `O campo ${chave} não pode ser alterado.` });
    }
    if (typeof valor !== 'string' || valor.trim().length === 0 || valor.trim().length > limite) {
      return res.status(400).json({
        mensagem: `O campo ${chave} é obrigatório e deve ter até ${limite} caracteres.`
      });
    }
    configuracoes[chave] = valor.trim();
  }

  for (const chave of camposDeUrl) {
    if (configuracoes[chave] !== undefined && !imagemConfiguracaoValida(configuracoes[chave])) {
      return res.status(400).json({ mensagem: `O campo ${chave} precisa ser uma URL HTTP/HTTPS válida.` });
    }
  }

  let conexaoTransacao;
  try {
    conexaoTransacao = await conexao.getConnection();
    await conexaoTransacao.beginTransaction();
    for (const [chave, valor] of Object.entries(configuracoes)) {
      await conexaoTransacao.execute(
        `INSERT INTO configuracoes_site (chave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [chave, valor]
      );
    }
    await conexaoTransacao.commit();
    return res.json({
      mensagem: 'Conteúdo do site atualizado com sucesso.',
      configuracoes
    });
  } catch (erro) {
    if (conexaoTransacao) {
      try {
        await conexaoTransacao.rollback();
      } catch (erroRollback) {
        console.error('Erro ao desfazer atualização das configurações:', erroRollback);
      }
    }
    console.error('Erro ao atualizar configurações do site:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar configurações.' });
  } finally {
    if (conexaoTransacao) conexaoTransacao.release();
  }
}

module.exports = { consultar, atualizar };

const conexao = require('../database/conexao');

const limites = {
  titulo: 100,
  subtitulo: 150,
  descricao: 500,
  foto_destaque: 500
};

function urlHttpValida(valor) {
  try {
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch (erro) {
    return false;
  }
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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ mensagem: 'Envie as configurações do site.' });
  }

  const configuracoes = {};
  for (const [chave, limite] of Object.entries(limites)) {
    const valor = body[chave];
    if (typeof valor !== 'string' || valor.trim().length === 0 || valor.trim().length > limite) {
      return res.status(400).json({
        mensagem: `O campo ${chave} é obrigatório e deve ter até ${limite} caracteres.`
      });
    }
    configuracoes[chave] = valor.trim();
  }

  if (!urlHttpValida(configuracoes.foto_destaque)) {
    return res.status(400).json({ mensagem: 'A imagem de destaque precisa ser uma URL HTTP ou HTTPS válida.' });
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

const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

async function autenticacao(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não informado.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ mensagem: 'A autenticação não está configurada no servidor.' });
  }

  let dados;
  try {
    dados = jwt.verify(cabecalho.substring(7), process.env.JWT_SECRET);
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }

  if (!dados || !Number.isSafeInteger(Number(dados.id)) || Number(dados.id) < 1) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }

  try {
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, nivel FROM usuarios WHERE id = ?',
      [Number(dados.id)]
    );
    if (usuarios.length === 0) {
      return res.status(401).json({ mensagem: 'Usuário não encontrado.' });
    }

    req.usuario = usuarios[0];
    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = autenticacao;

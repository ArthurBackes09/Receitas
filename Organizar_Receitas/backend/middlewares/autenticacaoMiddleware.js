const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

async function autenticacao(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não informado.' });
  }

  const token = cabecalho.substring(7);

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, nivel FROM usuarios WHERE id = ?',
      [dados.id]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensagem: 'Usuário não encontrado.' });
    }

    req.usuario = usuarios[0];
    return next();
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticacao;

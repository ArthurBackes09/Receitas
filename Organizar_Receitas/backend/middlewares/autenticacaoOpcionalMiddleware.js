const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

async function autenticacaoOpcional(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) return next();
  if (!cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Formato do token inválido.' });
  }

  let dados;
  try {
    dados = jwt.verify(cabecalho.substring(7), process.env.JWT_SECRET);
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }

  try {
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
    return next(erro);
  }
}

module.exports = autenticacaoOpcional;

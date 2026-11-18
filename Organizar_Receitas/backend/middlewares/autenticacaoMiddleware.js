const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

async function autenticacao(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não informado.' });
  }

  const token = cabecalho.substring(7);

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não está configurado.');
    return res.status(500).json({ mensagem: 'A autenticação não está configurada no servidor.' });
  }

  let dados;
  try {
    dados = jwt.verify(token, process.env.JWT_SECRET);
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
    console.error('Erro ao consultar usuário autenticado:', erro);
    return res.status(500).json({ mensagem: 'Não foi possível validar sua conta agora.' });
  }
}

module.exports = autenticacao;

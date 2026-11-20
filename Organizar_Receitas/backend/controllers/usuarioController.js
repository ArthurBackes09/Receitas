const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

function usuarioPublico(usuario) {
  return {
    id: Number(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    nivel: usuario.nivel
  };
}

function validarCadastro(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erro: 'Envie nome, e-mail e senha.' };
  }

  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const senha = typeof body.senha === 'string' ? body.senha : '';

  if (nome.length < 2 || nome.length > 100) {
    return { erro: 'O nome deve ter entre 2 e 100 caracteres.' };
  }
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { erro: 'Informe um e-mail válido com até 150 caracteres.' };
  }
  if (senha.length < 6) {
    return { erro: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    return { erro: 'A senha deve ter no máximo 72 bytes.' };
  }

  return { dados: { nome, email, senha } };
}

function validarLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erro: 'Informe e-mail e senha.' };
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const senha = typeof body.senha === 'string' ? body.senha : '';
  if (!email || email.length > 150 || !senha || Buffer.byteLength(senha, 'utf8') > 72) {
    return { erro: 'Informe um e-mail e uma senha válidos.' };
  }

  return { dados: { email, senha } };
}

async function cadastrar(req, res) {
  const validacao = validarCadastro(req.body);
  if (validacao.erro) return res.status(400).json({ mensagem: validacao.erro });

  try {
    const [existentes] = await conexao.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [validacao.dados.email]
    );
    if (existentes.length > 0) {
      return res.status(409).json({ mensagem: 'Este e-mail já está cadastrado.' });
    }

    const senhaProtegida = await bcrypt.hash(validacao.dados.senha, 10);
    const [resultado] = await conexao.execute(
      'INSERT INTO usuarios (nome, email, senha, nivel) VALUES (?, ?, ?, ?)',
      [validacao.dados.nome, validacao.dados.email, senhaProtegida, 'comum']
    );

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso.',
      usuario: {
        id: Number(resultado.insertId),
        nome: validacao.dados.nome,
        email: validacao.dados.email,
        nivel: 'comum'
      }
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Este e-mail já está cadastrado.' });
    }
    console.error('Erro ao cadastrar usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao cadastrar a conta.' });
  }
}

async function login(req, res) {
  const validacao = validarLogin(req.body);
  if (validacao.erro) return res.status(400).json({ mensagem: validacao.erro });
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ mensagem: 'A autenticação não está configurada no servidor.' });
  }

  try {
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, senha, nivel FROM usuarios WHERE email = ?',
      [validacao.dados.email]
    );
    if (usuarios.length === 0) {
      return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(validacao.dados.senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
    }

    const usuarioResposta = usuarioPublico(usuario);
    const token = jwt.sign(
      { id: usuarioResposta.id, email: usuarioResposta.email, nivel: usuarioResposta.nivel },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: usuarioResposta
    });
  } catch (erro) {
    console.error('Erro ao autenticar usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao realizar login.' });
  }
}

function dadosAutenticado(req, res) {
  return res.json({ usuario: usuarioPublico(req.usuario) });
}

function dadosAdmin(req, res) {
  return res.json({
    mensagem: 'Acesso administrativo autorizado.',
    usuario: usuarioPublico(req.usuario)
  });
}

async function listarUsuariosAdmin(req, res) {
  try {
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, nivel FROM usuarios ORDER BY nome'
    );
    return res.json({ usuarios: usuarios.map(usuarioPublico) });
  } catch (erro) {
    console.error('Erro ao listar usuários para administração:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar usuários.' });
  }
}

async function atualizarNivelAdmin(req, res) {
  const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : 0;
  const nivel = req.body && req.body.nivel;
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ mensagem: 'Identificador de usuário inválido.' });
  }
  if (!['comum', 'administrador'].includes(nivel)) {
    return res.status(400).json({ mensagem: 'O nível deve ser comum ou administrador.' });
  }
  if (id === Number(req.usuario.id) && nivel !== 'administrador') {
    return res.status(403).json({ mensagem: 'Você não pode remover seu próprio acesso administrativo.' });
  }

  try {
    const [resultado] = await conexao.execute(
      'UPDATE usuarios SET nivel = ? WHERE id = ?',
      [nivel, id]
    );
    if (resultado.affectedRows === 0) {
      const [usuarios] = await conexao.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
      if (usuarios.length === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }
    return res.json({ mensagem: 'Nível de acesso atualizado com sucesso.' });
  } catch (erro) {
    console.error('Erro ao atualizar nível do usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar o nível de acesso.' });
  }
}

module.exports = {
  cadastrar,
  login,
  dadosAutenticado,
  dadosAdmin,
  listarUsuariosAdmin,
  atualizarNivelAdmin
};

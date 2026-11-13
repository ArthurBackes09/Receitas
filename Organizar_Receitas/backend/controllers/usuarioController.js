const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conexao = require('../database/conexao');

async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
    }

    const nomeNormalizado = String(nome).trim();
    const emailNormalizado = String(email).trim().toLowerCase();

    if (nomeNormalizado.length < 2) {
      return res.status(400).json({ mensagem: 'O nome deve ter pelo menos 2 caracteres.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      return res.status(400).json({ mensagem: 'Informe um email válido.' });
    }

    if (typeof senha !== 'string' || senha.length < 6) {
      return res.status(400).json({ mensagem: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const [usuarios] = await conexao.execute('SELECT id FROM usuarios WHERE email = ?', [emailNormalizado]);

    if (usuarios.length > 0) {
      return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
    }

    const senhaProtegida = await bcrypt.hash(senha, 10);
    const [resultado] = await conexao.execute(
      'INSERT INTO usuarios (nome, email, senha, nivel) VALUES (?, ?, ?, ?) ',
      [nomeNormalizado, emailNormalizado, senhaProtegida, 'comum']
    );

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: { id: resultado.insertId, nome: nomeNormalizado, email: emailNormalizado, nivel: 'comum' }
    });
  } catch (erro) {
    console.error('Erro ao cadastrar usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao cadastrar usuário.' });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      return res.status(400).json({ mensagem: 'Informe um email válido.' });
    }
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, senha, nivel FROM usuarios WHERE email = ?',
      [emailNormalizado]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nivel: usuario.nivel },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, nivel: usuario.nivel }
    });
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao fazer login.' });
  }
}

async function dadosAutenticado(req, res) {
  return res.json({ usuario: req.usuario });
}

async function dadosAdmin(req, res) {
  return res.json({ mensagem: 'Acesso administrativo permitido.', usuario: req.usuario });
}

async function listarUsuariosAdmin(req, res) {
  try {
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email, nivel FROM usuarios ORDER BY nome'
    );
    return res.json({ usuarios });
  } catch (erro) {
    console.error('Erro ao listar usuários para administração:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao consultar usuários.' });
  }
}

async function alterarNivelAdmin(req, res) {
  const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : null;
  const nivel = req.body && req.body.nivel;
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ mensagem: 'Identificador de usuário inválido.' });
  }
  if (!['comum', 'administrador'].includes(nivel)) {
    return res.status(400).json({ mensagem: 'O nível deve ser comum ou administrador.' });
  }
  if (Number(req.usuario.id) === id && nivel !== 'administrador') {
    return res.status(400).json({ mensagem: 'Não é possível remover seu próprio acesso administrativo.' });
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
    return res.json({ mensagem: 'Perfil do usuário atualizado com sucesso.' });
  } catch (erro) {
    console.error('Erro ao alterar perfil de usuário:', erro);
    return res.status(500).json({ mensagem: 'Erro interno ao atualizar perfil.' });
  }
}

module.exports = {
  cadastrar,
  login,
  dadosAutenticado,
  dadosAdmin,
  listarUsuariosAdmin,
  alterarNivelAdmin
};

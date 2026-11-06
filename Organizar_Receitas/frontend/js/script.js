async function lerResposta(resposta) {
  const texto = await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch (erro) {
    return { mensagem: texto || 'Não foi possível concluir a operação.' };
  }
}

async function enviar(url, dados, token) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: JSON.stringify(dados)
  });
  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) throw new Error(conteudo.mensagem || 'Não foi possível concluir a operação.');
  return conteudo;
}

async function consultar(url) {
  const token = localStorage.getItem('tokenReceitas');
  const resposta = await fetch(url, {
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) throw new Error(conteudo.mensagem || 'Não foi possível consultar os dados.');
  return conteudo;
}

const formCadastro = document.querySelector('#form-cadastro');
const formLogin = document.querySelector('#form-login');
const usuarioConectado = document.querySelector('#usuario-conectado');

if (formCadastro) {
  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const mensagem = document.querySelector('#mensagem-cadastro');
    try {
      const nome = document.querySelector('#cadastro-nome').value.trim();
      const email = document.querySelector('#cadastro-email').value.trim();
      const senha = document.querySelector('#cadastro-senha').value;
      const confirmacao = document.querySelector('#cadastro-confirmar-senha').value;

      if (nome.length < 2) throw new Error('Informe um nome com pelo menos 2 caracteres.');
      if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
      if (senha !== confirmacao) throw new Error('A confirmação da senha não corresponde.');

      const resultado = await enviar('/api/usuarios/cadastrar', {
        nome,
        email,
        senha
      });
      mensagem.textContent = resultado.mensagem;
      formCadastro.reset();
      window.location.href = '/index.html?cadastro=sucesso';
    } catch (erro) {
      mensagem.textContent = erro.message;
    }
  });
}

if (formLogin) {
  formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const mensagem = document.querySelector('#mensagem-login');
    try {
      const resultado = await enviar('/api/usuarios/login', {
        email: document.querySelector('#login-email').value,
        senha: document.querySelector('#login-senha').value
      });
      localStorage.setItem('tokenReceitas', resultado.token);
      localStorage.setItem('usuarioReceitas', JSON.stringify(resultado.usuario));
      usuarioConectado.textContent = `${resultado.usuario.nome} (${resultado.usuario.nivel})`;
      mensagem.textContent = resultado.mensagem;
      atualizarPainelUsuario();
    } catch (erro) {
      mensagem.textContent = erro.message;
    }
  });

  if (new URLSearchParams(window.location.search).get('cadastro') === 'sucesso') {
    document.querySelector('#mensagem-login').textContent = 'Cadastro concluído. Agora faça login.';
  }
}

function atualizarPainelUsuario() {
  const usuarioSalvo = localStorage.getItem('usuarioReceitas');
  const painelAdmin = document.querySelector('#painel-admin');
  if (!usuarioSalvo || !usuarioConectado || !painelAdmin) return;

  let usuario;
  try {
    usuario = JSON.parse(usuarioSalvo);
  } catch (erro) {
    localStorage.removeItem('usuarioReceitas');
    return;
  }
  usuarioConectado.textContent = `${usuario.nome} (${usuario.nivel})`;
  painelAdmin.hidden = usuario.nivel !== 'administrador';
}

atualizarPainelUsuario();

const botaoUsuario = document.querySelector('#botao-usuario');
if (botaoUsuario) {
  botaoUsuario.addEventListener('click', async () => {
    const mensagem = document.querySelector('#mensagem-protegida');
    try {
      const resultado = await consultar('/api/usuarios/eu');
      mensagem.textContent = `${resultado.usuario.nome} - ${resultado.usuario.email}`;
    } catch (erro) {
      mensagem.textContent = erro.message;
    }
  });
}

const botaoAdmin = document.querySelector('#botao-admin');
if (botaoAdmin) {
  botaoAdmin.addEventListener('click', async () => {
    const mensagem = document.querySelector('#mensagem-protegida');
    try {
      const resultado = await consultar('/api/usuarios/admin');
      mensagem.textContent = resultado.mensagem;
    } catch (erro) {
      mensagem.textContent = erro.message;
    }
  });
}

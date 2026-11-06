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
      ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    headers: token ? { Authorization: `Bearer ${token}` } : {}
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
      const resultado = await enviar('/api/usuarios/cadastrar', {
        nome: document.querySelector('#cadastro-nome').value,
        email: document.querySelector('#cadastro-email').value,
        senha: document.querySelector('#cadastro-senha').value
      });
      mensagem.textContent = resultado.mensagem;
      formCadastro.reset();
      window.location.href = 'index.html?cadastro=sucesso';
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
      usuarioConectado.textContent = `${resultado.usuario.nome} (${resultado.usuario.nivel})`;
      mensagem.textContent = resultado.mensagem;
    } catch (erro) {
      mensagem.textContent = erro.message;
    }
  });

  if (new URLSearchParams(window.location.search).get('cadastro') === 'sucesso') {
    document.querySelector('#mensagem-login').textContent = 'Cadastro concluído. Agora faça login.';
  }
}

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

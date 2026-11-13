const tokenAtual = () => localStorage.getItem('tokenReceitas');

async function lerResposta(resposta) {
  const texto = await resposta.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (erro) {
    if (resposta.headers.get('content-type')?.includes('text/html')) {
      return { mensagem: 'O backend não respondeu à API. Inicie-o com "npm start" na pasta Organizar_Receitas.' };
    }
    return { mensagem: texto };
  }
}

async function requisitar(url, opcoes = {}) {
  const cabecalhos = { ...(opcoes.headers || {}) };
  if (opcoes.body !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (opcoes.autenticada !== false && tokenAtual()) {
    cabecalhos.Authorization = `Bearer ${tokenAtual()}`;
  }

  const resposta = await fetch(url, {
    method: opcoes.method || 'GET',
    headers: cabecalhos,
    body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body)
  });
  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) {
    const erro = new Error(conteudo.mensagem || 'Não foi possível concluir a operação.');
    erro.status = resposta.status;
    throw erro;
  }
  return conteudo;
}

function mostrarMensagem(elemento, texto, tipo = '') {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.classList.toggle('mensagem-erro', tipo === 'erro');
  elemento.classList.toggle('mensagem-sucesso', tipo === 'sucesso');
}

function criarImagem(src, alt) {
  const area = document.createElement('div');
  area.className = 'imagem-receita';
  if (src) {
    const imagem = document.createElement('img');
    imagem.src = src;
    imagem.alt = alt;
    imagem.loading = 'lazy';
    imagem.addEventListener('error', () => imagem.remove(), { once: true });
    area.append(imagem);
  } else {
    area.setAttribute('aria-label', 'Receita sem foto');
  }
  return area;
}

function criarCartaoReceita(receita, opcoes = {}) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao-receita';
  cartao.append(criarImagem(receita.foto, receita.titulo));

  const conteudo = document.createElement('div');
  conteudo.className = 'cartao-receita-conteudo';
  const metadados = document.createElement('div');
  metadados.className = 'metadados-receita';
  const categoria = document.createElement('span');
  categoria.textContent = receita.subcategoria
    ? `${receita.categoria} · ${receita.subcategoria}`
    : receita.categoria;
  metadados.append(categoria);

  if (opcoes.mostrarPrivacidade) {
    const privacidade = document.createElement('span');
    privacidade.className = `etiqueta ${receita.privacidade}`;
    privacidade.textContent = receita.privacidade === 'publica' ? 'Pública' : 'Privada';
    metadados.append(privacidade);
  }

  const titulo = document.createElement('h3');
  titulo.textContent = receita.titulo;
  const descricao = document.createElement('p');
  descricao.className = 'descricao-cartao';
  descricao.textContent = receita.descricao || 'Uma receita especial para guardar.';
  const autor = document.createElement('p');
  autor.className = 'autor-cartao';
  autor.textContent = receita.autor ? `Por ${receita.autor}` : '';

  const acoes = document.createElement('div');
  acoes.className = 'acoes-cartao';
  const detalhes = document.createElement('a');
  detalhes.className = 'botao-pequeno';
  detalhes.href = `receita-detalhes.html?id=${encodeURIComponent(receita.id)}`;
  detalhes.textContent = 'Ver receita';
  acoes.append(detalhes);

  if (opcoes.proprietaria || opcoes.podeGerenciar) {
    const editar = document.createElement('a');
    editar.className = 'botao-pequeno botao-contorno';
    editar.href = `receita-form.html?id=${encodeURIComponent(receita.id)}`;
    editar.textContent = 'Editar';
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'botao-pequeno botao-perigo';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', async () => {
      if (await excluirReceita(receita.id, cartao) && opcoes.podeGerenciar) {
        await carregarReceitasAdmin();
      }
    });
    acoes.append(editar, excluir);
  }

  conteudo.append(metadados, titulo, descricao, autor, acoes);
  cartao.append(conteudo);
  return cartao;
}

function renderizarReceitas(container, receitas, opcoes = {}) {
  if (!container) return;
  container.replaceChildren();
  if (!receitas.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    const titulo = document.createElement('h3');
    titulo.textContent = opcoes.vazioTitulo || 'Nenhuma receita encontrada';
    const texto = document.createElement('p');
    texto.textContent = opcoes.vazioTexto || 'Tente ajustar os filtros ou volte mais tarde.';
    vazio.append(titulo, texto);
    if (opcoes.proprietaria) {
      const link = document.createElement('a');
      link.className = 'botao-principal';
      link.href = 'receita-form.html';
      link.textContent = 'Cadastrar minha primeira receita';
      vazio.append(link);
    }
    container.append(vazio);
    return;
  }
  receitas.forEach((receita) => container.append(criarCartaoReceita(receita, opcoes)));
}

async function excluirReceita(id, cartao) {
  if (!window.confirm('Tem certeza de que deseja excluir esta receita?')) return;
  const mensagem = document.querySelector('#mensagem-minhas, #mensagem-painel, #mensagem-detalhes');
  try {
    const resultado = await requisitar(`/api/receitas/${encodeURIComponent(id)}`, { method: 'DELETE' });
    mostrarMensagem(mensagem, resultado.mensagem, 'sucesso');
    if (cartao) cartao.remove();
    const listaMinhas = document.querySelector('#lista-minhas');
    if (listaMinhas && !listaMinhas.querySelector('.cartao-receita')) {
      renderizarReceitas(listaMinhas, [], { proprietaria: true });
    }
    if (document.querySelector('#lista-minhas, #lista-painel')) await carregarMinhasReceitas();
    return true;
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    return false;
  }
}

async function carregarCategorias(selects = []) {
  const resultado = await requisitar('/api/categorias', { autenticada: false });
  const categorias = resultado.categorias || [];
  const lista = document.querySelector('#lista-categorias');
  if (lista) {
    lista.replaceChildren();
    categorias.forEach((categoria) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'categoria-chip';
      botao.textContent = categoria.nome;
      botao.addEventListener('click', () => {
        const filtro = document.querySelector('#filtro-categoria-publica');
        if (filtro) {
          filtro.value = String(categoria.id);
          carregarPublicas();
          document.querySelector('#receitas-publicas').scrollIntoView({ behavior: 'smooth' });
        }
      });
      lista.append(botao);
    });
  }

  selects.filter(Boolean).forEach((select) => {
    const primeiraOpcao = select.options[0]?.textContent || 'Todas';
    select.replaceChildren(new Option(primeiraOpcao, ''));
    categorias.forEach((categoria) => select.add(new Option(categoria.nome, categoria.id)));
  });
  return categorias;
}

async function carregarConfiguracoesSite() {
  const resultado = await requisitar('/api/configuracoes', { autenticada: false });
  const configuracoes = resultado.configuracoes || {};
  const titulo = document.querySelector('#hero-titulo');
  const subtitulo = document.querySelector('#hero-subtitulo');
  const descricao = document.querySelector('#hero-descricao');
  const foto = document.querySelector('#foto-destaque');
  if (titulo && configuracoes.titulo) titulo.textContent = configuracoes.titulo;
  if (subtitulo && configuracoes.subtitulo) subtitulo.textContent = configuracoes.subtitulo;
  if (descricao && configuracoes.descricao) descricao.textContent = configuracoes.descricao;
  if (foto && configuracoes.foto_destaque) foto.src = configuracoes.foto_destaque;
}

async function carregarPublicas() {
  const container = document.querySelector('#receitas-publicas-lista');
  if (!container) return;
  const mensagem = document.querySelector('#mensagem-publicas');
  const parametros = new URLSearchParams();
  const busca = document.querySelector('#busca-publica')?.value.trim();
  const categoria = document.querySelector('#filtro-categoria-publica')?.value;
  if (busca) parametros.set('busca', busca);
  if (categoria) parametros.set('categoria', categoria);
  mostrarMensagem(mensagem, 'Carregando receitas...');
  try {
    const resultado = await requisitar(`/api/receitas/publicas?${parametros}`, { autenticada: false });
    mostrarMensagem(mensagem, '');
    renderizarReceitas(container, resultado.receitas || [], {
      vazioTitulo: 'Ainda não há receitas públicas',
      vazioTexto: 'Quando alguém compartilhar uma receita pública, ela aparecerá aqui.'
    });
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

async function carregarMinhasReceitas() {
  const lista = document.querySelector('#lista-minhas');
  const painelLista = document.querySelector('#lista-painel');
  const buscaEl = document.querySelector('#busca-minhas') || document.querySelector('#busca-painel');
  const categoriaEl = document.querySelector('#filtro-categoria-minhas') || document.querySelector('#filtro-categoria-painel');
  const privacidadeEl = document.querySelector('#filtro-privacidade') || document.querySelector('#filtro-privacidade-painel');
  const mensagem = document.querySelector('#mensagem-minhas');
  const parametros = new URLSearchParams();
  if (mensagem) mostrarMensagem(mensagem, 'Carregando suas receitas...');
  if (buscaEl?.value.trim()) parametros.set('busca', buscaEl.value.trim());
  if (categoriaEl?.value) parametros.set('categoria', categoriaEl.value);
  if (privacidadeEl?.value) parametros.set('privacidade', privacidadeEl.value);

  try {
    const resultado = await requisitar(`/api/receitas/minhas?${parametros}`);
    const receitas = resultado.receitas || [];
    if (lista || painelLista) {
      mostrarMensagem(mensagem, '');
      const opcoes = {
        proprietaria: true,
        mostrarPrivacidade: true,
        vazioTitulo: 'Seu caderno ainda está vazio',
        vazioTexto: 'Cadastre sua primeira receita e deixe-a guardada para quando quiser cozinhar.'
      };
      renderizarReceitas(lista, receitas, opcoes);
      renderizarReceitas(painelLista, receitas, opcoes);
    }
    let receitasTotais = receitas;
    if (parametros.toString()) {
      const resultadoTotal = await requisitar('/api/receitas/minhas');
      receitasTotais = resultadoTotal.receitas || [];
    }
    const quantidade = document.querySelector('#quantidade-receitas');
    if (quantidade) {
      quantidade.textContent = `${receitasTotais.length} ${receitasTotais.length === 1 ? 'receita' : 'receitas'}`;
    }
    return receitas;
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    if (erro.status === 401 && tokenAtual()) encerrarSessao();
    return [];
  }
}

function encerrarSessao() {
  localStorage.removeItem('tokenReceitas');
  localStorage.removeItem('usuarioReceitas');
  if (document.body.dataset.page !== 'inicio') {
    window.location.href = 'index.html?login=necessario';
  } else {
    atualizarInterfaceAutenticada(null);
  }
}

function atualizarInterfaceAutenticada(usuario) {
  const painel = document.querySelector('#painel-usuario');
  const acesso = document.querySelector('#acesso-conta');
  const entrar = document.querySelector('#link-entrar');
  const heroEntrar = document.querySelector('#hero-entrar');
  const minhas = document.querySelector('#link-minhas');
  const nova = document.querySelector('#link-nova');
  const sair = document.querySelector('#botao-sair');
  const admin = document.querySelector('#painel-admin');
  const linkAdmin = document.querySelector('#link-admin');

  if (painel) painel.hidden = !usuario;
  if (acesso) acesso.hidden = Boolean(usuario);
  if (entrar) entrar.hidden = Boolean(usuario);
  if (heroEntrar) heroEntrar.hidden = Boolean(usuario);
  if (minhas) minhas.hidden = !usuario;
  if (nova) nova.hidden = !usuario;
  if (sair) sair.hidden = !usuario;
  if (admin) admin.hidden = !usuario || usuario.nivel !== 'administrador';
  if (linkAdmin) linkAdmin.hidden = !usuario || usuario.nivel !== 'administrador';
  const nome = document.querySelector('#nome-usuario');
  if (nome && usuario) nome.textContent = usuario.nome;
}

async function inicializarSessao() {
  const sair = document.querySelector('#botao-sair');
  if (sair) sair.addEventListener('click', encerrarSessao);
  if (!tokenAtual()) {
    if (['minhas', 'form-receita', 'admin'].includes(document.body.dataset.page)) encerrarSessao();
    return;
  }

  try {
    const resultado = await requisitar('/api/usuarios/eu');
    localStorage.setItem('usuarioReceitas', JSON.stringify(resultado.usuario));
    atualizarInterfaceAutenticada(resultado.usuario);
    if (document.body.dataset.page !== 'admin') await carregarMinhasReceitas();
  } catch (erro) {
    encerrarSessao();
  }
}

function inicializarLogin() {
  const form = document.querySelector('#form-login');
  if (!form) return;
  const mensagem = document.querySelector('#mensagem-login');
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Entrando...';
    try {
      const resultado = await requisitar('/api/usuarios/login', {
        method: 'POST',
        autenticada: false,
        body: {
          email: document.querySelector('#login-email').value.trim(),
          senha: document.querySelector('#login-senha').value
        }
      });
      localStorage.setItem('tokenReceitas', resultado.token);
      localStorage.setItem('usuarioReceitas', JSON.stringify(resultado.usuario));
      atualizarInterfaceAutenticada(resultado.usuario);
      mostrarMensagem(mensagem, resultado.mensagem, 'sucesso');
      await carregarMinhasReceitas();
      document.querySelector('#painel-usuario')?.scrollIntoView({ behavior: 'smooth' });
    } catch (erro) {
      mostrarMensagem(mensagem, erro.message, 'erro');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('cadastro') === 'sucesso') {
    mostrarMensagem(mensagem, 'Cadastro concluído. Agora faça login.', 'sucesso');
  } else if (params.get('login') === 'necessario') {
    mostrarMensagem(mensagem, 'Entre na sua conta para acessar suas receitas.');
    document.querySelector('#acesso-conta')?.scrollIntoView();
  }
}

function inicializarCadastro() {
  const form = document.querySelector('#form-cadastro');
  if (!form) return;
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const mensagem = document.querySelector('#mensagem-cadastro');
    const nome = document.querySelector('#cadastro-nome').value.trim();
    const email = document.querySelector('#cadastro-email').value.trim();
    const senha = document.querySelector('#cadastro-senha').value;
    const confirmacao = document.querySelector('#cadastro-confirmar-senha').value;
    if (nome.length < 2) return mostrarMensagem(mensagem, 'Informe um nome com pelo menos 2 caracteres.', 'erro');
    if (senha.length < 6) return mostrarMensagem(mensagem, 'A senha deve ter pelo menos 6 caracteres.', 'erro');
    if (senha !== confirmacao) return mostrarMensagem(mensagem, 'A confirmação da senha não corresponde.', 'erro');

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Criando conta...';
    try {
      const resultado = await requisitar('/api/usuarios/cadastrar', {
        method: 'POST',
        autenticada: false,
        body: { nome, email, senha }
      });
      mostrarMensagem(mensagem, resultado.mensagem, 'sucesso');
      form.reset();
      window.location.href = 'index.html?cadastro=sucesso#acesso-conta';
    } catch (erro) {
      mostrarMensagem(mensagem, erro.message, 'erro');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Cadastrar';
    }
  });
}

function inicializarPaginaInicial() {
  const busca = document.querySelector('#busca-publica');
  const categoria = document.querySelector('#filtro-categoria-publica');
  if (busca) busca.addEventListener('input', carregarPublicas);
  if (categoria) categoria.addEventListener('change', carregarPublicas);
  ['#busca-painel', '#filtro-categoria-painel', '#filtro-privacidade-painel'].forEach((seletor) => {
    const campo = document.querySelector(seletor);
    if (campo) campo.addEventListener(campo.type === 'search' ? 'input' : 'change', carregarMinhasReceitas);
  });
}

async function inicializarListaMinhas() {
  const busca = document.querySelector('#busca-minhas');
  const categoria = document.querySelector('#filtro-categoria-minhas');
  const privacidade = document.querySelector('#filtro-privacidade');
  [busca, categoria, privacidade].filter(Boolean).forEach((campo) => {
    campo.addEventListener(campo === busca ? 'input' : 'change', carregarMinhasReceitas);
  });
  await carregarMinhasReceitas();
}

async function carregarSubcategorias(categoriaId, selecionarId) {
  const select = document.querySelector('#receita-subcategoria');
  if (!select) return;
  select.replaceChildren(new Option(categoriaId ? 'Nenhuma subcategoria' : 'Selecione uma categoria primeiro', ''));
  select.disabled = !categoriaId;
  if (!categoriaId) return;
  const resultado = await requisitar(`/api/categorias/${encodeURIComponent(categoriaId)}/subcategorias`, { autenticada: false });
  (resultado.subcategorias || []).forEach((item) => select.add(new Option(item.nome, item.id)));
  if (selecionarId) select.value = String(selecionarId);
}

async function inicializarFormularioReceita() {
  const form = document.querySelector('#form-receita');
  if (!form) return;
  if (!tokenAtual()) {
    encerrarSessao();
    return;
  }
  const mensagem = document.querySelector('#mensagem-form-receita');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const tituloPagina = document.querySelector('#titulo-pagina-form');
  const botaoSalvar = document.querySelector('#botao-salvar-receita');
  const categoria = document.querySelector('#receita-categoria');
  const foto = document.querySelector('#receita-foto');

  try {
    await requisitar('/api/usuarios/eu');
    await carregarCategorias([categoria]);
    if (id) {
      const resultado = await requisitar(`/api/receitas/${encodeURIComponent(id)}`);
      const receita = resultado.receita;
      if (!receita.pode_editar && !receita.proprietaria) throw new Error('Você só pode editar suas próprias receitas.');
      tituloPagina.textContent = 'Editar receita';
      botaoSalvar.textContent = 'Salvar alterações';
      document.querySelector('#receita-titulo').value = receita.titulo;
      document.querySelector('#receita-descricao').value = receita.descricao || '';
      document.querySelector('#receita-ingredientes').value = receita.ingredientes;
      document.querySelector('#receita-modo-preparo').value = receita.modo_preparo;
      document.querySelector('#receita-privacidade').value = receita.privacidade;
      document.querySelector('#receita-foto').value = receita.foto || '';
      categoria.value = String(receita.categoria_id);
      await carregarSubcategorias(receita.categoria_id, receita.subcategoria_id);
      atualizarPreviaFoto(foto.value);
    }
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    if (erro.status === 401 && tokenAtual()) encerrarSessao();
    return;
  }

  categoria.addEventListener('change', () => carregarSubcategorias(categoria.value).catch((erro) => {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }));
  foto.addEventListener('input', () => atualizarPreviaFoto(foto.value));

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!form.reportValidity()) return;
    const dados = {
      titulo: document.querySelector('#receita-titulo').value.trim(),
      descricao: document.querySelector('#receita-descricao').value.trim(),
      ingredientes: document.querySelector('#receita-ingredientes').value.trim(),
      modo_preparo: document.querySelector('#receita-modo-preparo').value.trim(),
      categoria_id: categoria.value,
      subcategoria_id: document.querySelector('#receita-subcategoria').value || null,
      foto: foto.value.trim(),
      privacidade: document.querySelector('#receita-privacidade').value
    };
    if (!dados.titulo || !dados.ingredientes || !dados.modo_preparo || !dados.categoria_id) {
      mostrarMensagem(mensagem, 'Preencha título, ingredientes, modo de preparo e categoria.', 'erro');
      return;
    }
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';
    try {
      const resultado = await requisitar(id ? `/api/receitas/${encodeURIComponent(id)}` : '/api/receitas', {
        method: id ? 'PUT' : 'POST',
        body: dados
      });
      mostrarMensagem(mensagem, resultado.mensagem, 'sucesso');
      window.location.href = `receita-detalhes.html?id=${encodeURIComponent(id || resultado.id)}`;
    } catch (erro) {
      mostrarMensagem(mensagem, erro.message, 'erro');
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = id ? 'Salvar alterações' : 'Salvar receita';
    }
  });
}

function atualizarPreviaFoto(url) {
  const previa = document.querySelector('#previa-foto');
  if (!previa) return;
  previa.replaceChildren();
  if (!url) {
    previa.hidden = true;
    return;
  }
  try {
    const endereco = new URL(url);
    if (!['http:', 'https:'].includes(endereco.protocol)) throw new Error('URL inválida');
    const imagem = document.createElement('img');
    imagem.src = endereco.href;
    imagem.alt = 'Prévia da foto da receita';
    imagem.addEventListener('error', () => mostrarMensagem(document.querySelector('#mensagem-form-receita'), 'Não foi possível carregar a prévia desta foto.', 'erro'), { once: true });
    previa.append(imagem);
    previa.hidden = false;
  } catch (erro) {
    previa.hidden = true;
  }
}

function dividirTexto(texto) {
  return String(texto || '').split(/\r?\n/).map((parte) => parte.trim()).filter(Boolean);
}

async function inicializarDetalhes() {
  const artigo = document.querySelector('#detalhe-receita');
  if (!artigo) return;
  const mensagem = document.querySelector('#mensagem-detalhes');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    mostrarMensagem(mensagem, 'Receita não informada.', 'erro');
    return;
  }
  try {
    const resultado = await requisitar(`/api/receitas/${encodeURIComponent(id)}`);
    const receita = resultado.receita;
    document.title = `${receita.titulo} | Organizador de Receitas`;
    document.querySelector('#detalhe-titulo').textContent = receita.titulo;
    document.querySelector('#detalhe-categoria').textContent = receita.subcategoria
      ? `${receita.categoria} · ${receita.subcategoria}`
      : receita.categoria;
    document.querySelector('#detalhe-descricao').textContent = receita.descricao || '';
    document.querySelector('#detalhe-autor').textContent = `Receita de ${receita.autor}`;
    const privacidade = document.querySelector('#detalhe-privacidade');
    privacidade.textContent = receita.privacidade === 'publica' ? 'Pública' : 'Privada';
    privacidade.classList.add(receita.privacidade);

    const fotoArea = document.querySelector('#detalhe-foto');
    fotoArea.replaceChildren();
    if (receita.foto) fotoArea.append(criarImagem(receita.foto, receita.titulo));
    const ingredientes = document.querySelector('#detalhe-ingredientes');
    dividirTexto(receita.ingredientes).forEach((item) => {
      const linha = document.createElement('li');
      linha.textContent = item;
      ingredientes.append(linha);
    });
    const preparo = document.querySelector('#detalhe-preparo');
    dividirTexto(receita.modo_preparo).forEach((etapa) => {
      const linha = document.createElement('li');
      linha.textContent = etapa;
      preparo.append(linha);
    });

    if (receita.pode_editar || receita.proprietaria) {
      const acoes = document.querySelector('#acoes-detalhe');
      acoes.hidden = false;
      document.querySelector('#editar-detalhe').href = `receita-form.html?id=${encodeURIComponent(receita.id)}`;
      document.querySelector('#excluir-detalhe').addEventListener('click', async () => {
        if (await excluirReceita(receita.id)) {
          window.location.href = receita.proprietaria ? 'minhas-receitas.html' : 'admin.html';
        }
      });
    }
    artigo.hidden = false;
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

async function carregarReceitasAdmin() {
  const container = document.querySelector('#lista-admin-receitas');
  if (!container) return;
  const parametros = new URLSearchParams();
  const busca = document.querySelector('#busca-admin-receitas')?.value.trim();
  const categoria = document.querySelector('#filtro-admin-categoria')?.value;
  const privacidade = document.querySelector('#filtro-admin-privacidade')?.value;
  if (busca) parametros.set('busca', busca);
  if (categoria) parametros.set('categoria', categoria);
  if (privacidade) parametros.set('privacidade', privacidade);

  const resultado = await requisitar(`/api/receitas/administracao?${parametros}`);
  renderizarReceitas(container, resultado.receitas || [], {
    proprietaria: true,
    podeGerenciar: true,
    mostrarPrivacidade: true,
    vazioTitulo: 'Nenhuma receita encontrada',
    vazioTexto: 'Não há receitas para os filtros selecionados.'
  });
}

async function carregarUsuariosAdmin() {
  const container = document.querySelector('#lista-admin-usuarios');
  if (!container) return;
  const resultado = await requisitar('/api/usuarios/admin/usuarios');
  const usuarioAtual = JSON.parse(localStorage.getItem('usuarioReceitas') || 'null');
  container.replaceChildren();

  (resultado.usuarios || []).forEach((usuario) => {
    const item = document.createElement('article');
    item.className = 'item-admin';
    const informacoes = document.createElement('div');
    const nome = document.createElement('strong');
    nome.textContent = usuario.nome;
    const email = document.createElement('p');
    email.textContent = usuario.email;
    informacoes.append(nome, email);

    const acoes = document.createElement('div');
    acoes.className = 'acoes-admin';
    const nivel = document.createElement('select');
    nivel.setAttribute('aria-label', `Nível de acesso de ${usuario.nome}`);
    nivel.add(new Option('Comum', 'comum'));
    nivel.add(new Option('Administrador', 'administrador'));
    nivel.value = usuario.nivel;
    if (usuarioAtual && Number(usuarioAtual.id) === Number(usuario.id)) {
      nivel.options[0].disabled = true;
    }

    const salvar = document.createElement('button');
    salvar.type = 'button';
    salvar.className = 'botao-pequeno';
    salvar.textContent = 'Salvar perfil';
    salvar.addEventListener('click', async () => {
      try {
        const atualizado = await requisitar(
          `/api/usuarios/admin/usuarios/${encodeURIComponent(usuario.id)}/nivel`,
          { method: 'PUT', body: { nivel: nivel.value } }
        );
        mostrarMensagem(document.querySelector('#mensagem-admin'), atualizado.mensagem, 'sucesso');
        await carregarUsuariosAdmin();
      } catch (erro) {
        mostrarMensagem(document.querySelector('#mensagem-admin'), erro.message, 'erro');
      }
    });
    acoes.append(nivel, salvar);
    item.append(informacoes, acoes);
    container.append(item);
  });

  if (!container.children.length) {
    const vazio = document.createElement('p');
    vazio.textContent = 'Nenhum usuário cadastrado.';
    container.append(vazio);
  }
}

async function carregarCategoriasAdmin() {
  const resultado = await requisitar('/api/categorias');
  const categorias = resultado.categorias || [];
  const container = document.querySelector('#lista-admin-categorias');
  const filtro = document.querySelector('#filtro-admin-categoria');
  const seletor = document.querySelector('#categoria-subcategoria-admin');
  const categoriaSelecionada = seletor.value;
  filtro.replaceChildren(new Option('Todas', ''));
  seletor.replaceChildren(new Option('Selecione uma categoria', ''));
  container.replaceChildren();

  categorias.forEach((categoria) => {
    filtro.add(new Option(categoria.nome, categoria.id));
    seletor.add(new Option(categoria.nome, categoria.id));

    const item = document.createElement('article');
    item.className = 'item-admin';
    const nome = document.createElement('strong');
    nome.textContent = categoria.nome;
    const acoes = document.createElement('div');
    acoes.className = 'acoes-admin';
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'botao-pequeno botao-contorno';
    editar.textContent = 'Editar';
    editar.addEventListener('click', async () => {
      const novoNome = window.prompt('Novo nome da categoria:', categoria.nome);
      if (novoNome === null) return;
      try {
        const resposta = await requisitar(`/api/categorias/${categoria.id}`, {
          method: 'PUT',
          body: { nome: novoNome }
        });
        mostrarMensagem(document.querySelector('#mensagem-admin'), resposta.mensagem, 'sucesso');
        await carregarCategoriasAdmin();
      } catch (erro) {
        mostrarMensagem(document.querySelector('#mensagem-admin'), erro.message, 'erro');
      }
    });
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'botao-pequeno botao-perigo';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', async () => {
      if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;
      try {
        const resposta = await requisitar(`/api/categorias/${categoria.id}`, { method: 'DELETE' });
        mostrarMensagem(document.querySelector('#mensagem-admin'), resposta.mensagem, 'sucesso');
        await carregarCategoriasAdmin();
        await carregarSubcategoriasAdmin();
      } catch (erro) {
        mostrarMensagem(document.querySelector('#mensagem-admin'), erro.message, 'erro');
      }
    });
    acoes.append(editar, excluir);
    item.append(nome, acoes);
    container.append(item);
  });

  if (categoriaSelecionada && categorias.some((categoria) => String(categoria.id) === categoriaSelecionada)) {
    seletor.value = categoriaSelecionada;
  }
  await carregarSubcategoriasAdmin();
}

async function carregarSubcategoriasAdmin() {
  const container = document.querySelector('#lista-admin-subcategorias');
  const categoriaId = document.querySelector('#categoria-subcategoria-admin')?.value;
  if (!container) return;
  container.replaceChildren();
  if (!categoriaId) return;

  const resultado = await requisitar(`/api/categorias/${encodeURIComponent(categoriaId)}/subcategorias`);
  (resultado.subcategorias || []).forEach((subcategoria) => {
    const item = document.createElement('article');
    item.className = 'item-admin';
    const nome = document.createElement('strong');
    nome.textContent = subcategoria.nome;
    const acoes = document.createElement('div');
    acoes.className = 'acoes-admin';
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'botao-pequeno botao-contorno';
    editar.textContent = 'Editar';
    editar.addEventListener('click', async () => {
      const novoNome = window.prompt('Novo nome da subcategoria:', subcategoria.nome);
      if (novoNome === null) return;
      try {
        const resposta = await requisitar(`/api/categorias/subcategorias/${subcategoria.id}`, {
          method: 'PUT',
          body: { nome: novoNome }
        });
        mostrarMensagem(document.querySelector('#mensagem-admin'), resposta.mensagem, 'sucesso');
        await carregarSubcategoriasAdmin();
      } catch (erro) {
        mostrarMensagem(document.querySelector('#mensagem-admin'), erro.message, 'erro');
      }
    });
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'botao-pequeno botao-perigo';
    excluir.textContent = 'Excluir';
    excluir.addEventListener('click', async () => {
      if (!window.confirm(`Excluir a subcategoria "${subcategoria.nome}"?`)) return;
      try {
        const resposta = await requisitar(`/api/categorias/subcategorias/${subcategoria.id}`, {
          method: 'DELETE'
        });
        mostrarMensagem(document.querySelector('#mensagem-admin'), resposta.mensagem, 'sucesso');
        await carregarSubcategoriasAdmin();
      } catch (erro) {
        mostrarMensagem(document.querySelector('#mensagem-admin'), erro.message, 'erro');
      }
    });
    acoes.append(editar, excluir);
    item.append(nome, acoes);
    container.append(item);
  });
}

async function carregarConfiguracoesAdmin() {
  const resultado = await requisitar('/api/configuracoes');
  const configuracoes = resultado.configuracoes || {};
  document.querySelector('#config-titulo').value = configuracoes.titulo || '';
  document.querySelector('#config-subtitulo').value = configuracoes.subtitulo || '';
  document.querySelector('#config-descricao').value = configuracoes.descricao || '';
  document.querySelector('#config-foto-destaque').value = configuracoes.foto_destaque || '';
}

async function inicializarAdmin() {
  const mensagem = document.querySelector('#mensagem-admin');
  const conteudo = document.querySelector('#conteudo-admin');
  try {
    await requisitar('/api/usuarios/admin');
    conteudo.hidden = false;
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
    return;
  }

  const manejarErro = (erro) => mostrarMensagem(mensagem, erro.message, 'erro');
  const busca = document.querySelector('#busca-admin-receitas');
  const categoriaFiltro = document.querySelector('#filtro-admin-categoria');
  const privacidadeFiltro = document.querySelector('#filtro-admin-privacidade');
  busca.addEventListener('input', () => carregarReceitasAdmin().catch(manejarErro));
  categoriaFiltro.addEventListener('change', () => carregarReceitasAdmin().catch(manejarErro));
  privacidadeFiltro.addEventListener('change', () => carregarReceitasAdmin().catch(manejarErro));
  document.querySelector('#categoria-subcategoria-admin').addEventListener('change', () => {
    carregarSubcategoriasAdmin().catch(manejarErro);
  });

  document.querySelector('#form-categoria-admin').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    try {
      const nome = document.querySelector('#nome-categoria-admin').value.trim();
      const resposta = await requisitar('/api/categorias', { method: 'POST', body: { nome } });
      mostrarMensagem(mensagem, resposta.mensagem, 'sucesso');
      evento.currentTarget.reset();
      await carregarCategoriasAdmin();
    } catch (erro) {
      manejarErro(erro);
    }
  });
  document.querySelector('#form-subcategoria-admin').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    try {
      const categoriaId = document.querySelector('#categoria-subcategoria-admin').value;
      const nome = document.querySelector('#nome-subcategoria-admin').value.trim();
      const resposta = await requisitar(`/api/categorias/${encodeURIComponent(categoriaId)}/subcategorias`, {
        method: 'POST',
        body: { nome }
      });
      mostrarMensagem(mensagem, resposta.mensagem, 'sucesso');
      evento.currentTarget.reset();
      await carregarCategoriasAdmin();
    } catch (erro) {
      manejarErro(erro);
    }
  });
  document.querySelector('#form-configuracoes-admin').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    try {
      const configuracoes = {
        titulo: document.querySelector('#config-titulo').value.trim(),
        subtitulo: document.querySelector('#config-subtitulo').value.trim(),
        descricao: document.querySelector('#config-descricao').value.trim(),
        foto_destaque: document.querySelector('#config-foto-destaque').value.trim()
      };
      const resposta = await requisitar('/api/configuracoes', { method: 'PUT', body: configuracoes });
      mostrarMensagem(mensagem, resposta.mensagem, 'sucesso');
    } catch (erro) {
      manejarErro(erro);
    }
  });

  try {
    await Promise.all([
      carregarReceitasAdmin(),
      carregarUsuariosAdmin(),
      carregarCategoriasAdmin(),
      carregarConfiguracoesAdmin()
    ]);
  } catch (erro) {
    manejarErro(erro);
  }
}

async function inicializar() {
  inicializarLogin();
  inicializarCadastro();
  await inicializarSessao();

  const pagina = document.body.dataset.page;
  if (['minhas', 'form-receita', 'admin'].includes(pagina) && !tokenAtual()) return;
  if (pagina === 'inicio') {
    inicializarPaginaInicial();
    try {
      const categoria = document.querySelector('#filtro-categoria-publica');
      await carregarCategorias([
        categoria,
        document.querySelector('#filtro-categoria-painel')
      ]);
      await carregarConfiguracoesSite().catch((erro) => {
        mostrarMensagem(document.querySelector('#mensagem-configuracoes'), erro.message, 'erro');
      });
      await carregarPublicas();
    } catch (erro) {
      mostrarMensagem(document.querySelector('#mensagem-publicas'), erro.message, 'erro');
    }
  } else if (pagina === 'minhas') {
    const categoria = document.querySelector('#filtro-categoria-minhas');
    try {
      await carregarCategorias([categoria]);
      await inicializarListaMinhas();
    } catch (erro) {
      mostrarMensagem(document.querySelector('#mensagem-minhas'), erro.message, 'erro');
    }
  } else if (pagina === 'form-receita') {
    await inicializarFormularioReceita();
  } else if (pagina === 'detalhes') {
    await inicializarDetalhes();
  } else if (pagina === 'admin') {
    await inicializarAdmin();
  }
}

inicializar();

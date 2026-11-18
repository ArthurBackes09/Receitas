const test = require('node:test');
const assert = require('node:assert/strict');

const consultas = [];
let resultadoConsulta = [];
const conexaoFalsa = {
  async execute(sql, parametros) {
    consultas.push({ sql, parametros });
    if (sql.includes('FROM categorias WHERE id')) return [[{ id: 2 }]];
    if (sql.includes('FROM subcategorias WHERE id')) return [[{ id: 4 }]];
    return resultadoConsulta;
  }
};

const caminhoConexao = require.resolve('../database/conexao');
require.cache[caminhoConexao] = {
  id: caminhoConexao,
  filename: caminhoConexao,
  loaded: true,
  exports: conexaoFalsa
};
const controller = require('../controllers/videoController');

function criarResposta() {
  return {
    statusCode: 200,
    body: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(dados) {
      this.body = dados;
      return this;
    }
  };
}

function dadosVideo(overrides = {}) {
  return {
    titulo: 'Pão de queijo',
    descricao: 'Receita simples',
    url_video: 'https://www.youtube.com/watch?v=abc123',
    categoria_id: '2',
    subcategoria_id: '4',
    ...overrides
  };
}

test('recusa links que não sejam HTTP ou HTTPS antes de consultar o banco', async () => {
  consultas.length = 0;
  const res = criarResposta();

  await controller.cadastrar({
    body: dadosVideo({ url_video: 'javascript:alert(1)' }),
    usuario: { id: 8 }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.mensagem, /link HTTP ou HTTPS/i);
  assert.equal(consultas.length, 0);
});

test('salva vídeo associado à conta autenticada e à categoria validada', async () => {
  consultas.length = 0;
  resultadoConsulta = [{ insertId: 31 }];
  const res = criarResposta();

  await controller.cadastrar({
    body: dadosVideo(),
    usuario: { id: 8 }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.id, 31);
  const insercao = consultas.find(({ sql }) => sql.includes('INSERT INTO videos_salvos'));
  assert.ok(insercao);
  assert.equal(insercao.parametros[0], 8);
  assert.equal(insercao.parametros[1], 2);
  assert.equal(insercao.parametros[2], 4);
});

test('consulta somente vídeos da conta atual e aplica os filtros', async () => {
  consultas.length = 0;
  resultadoConsulta = [[{ id: 31, titulo: 'Pão de queijo' }]];
  const res = criarResposta();

  await controller.listarMeus({
    usuario: { id: 8 },
    query: { busca: 'queijo', categoria: '2' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.videos.length, 1);
  assert.match(consultas[0].sql, /WHERE v\.usuario_id = \? AND v\.categoria_id = \?/);
  assert.deepEqual(consultas[0].parametros, [8, 2, '%queijo%', '%queijo%']);
});

test('impede editar vídeo salvo por outra conta', async () => {
  consultas.length = 0;
  resultadoConsulta = [[]];
  const res = criarResposta();

  await controller.atualizar({
    params: { id: '31' },
    body: dadosVideo(),
    usuario: { id: 9 }
  }, res);

  assert.equal(res.statusCode, 404);
  assert.match(res.body.mensagem, /não encontrado/i);
  assert.equal(consultas.some(({ sql }) => sql.includes('UPDATE videos_salvos')), false);
});

test('impede remover vídeo salvo por outra conta', async () => {
  consultas.length = 0;
  resultadoConsulta = [{ affectedRows: 0 }];
  const res = criarResposta();

  await controller.excluir({
    params: { id: '31' },
    usuario: { id: 9 }
  }, res);

  assert.equal(res.statusCode, 404);
  assert.match(consultas[0].sql, /DELETE FROM videos_salvos WHERE id = \? AND usuario_id = \?/);
  assert.deepEqual(consultas[0].parametros, [31, 9]);
});

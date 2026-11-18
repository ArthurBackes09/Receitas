const test = require('node:test');
const assert = require('node:assert/strict');

let executarBanco;
const conexaoFalsa = {
  execute(...argumentos) {
    return executarBanco(...argumentos);
  }
};

const caminhoConexao = require.resolve('../database/conexao');
require.cache[caminhoConexao] = {
  id: caminhoConexao,
  filename: caminhoConexao,
  loaded: true,
  exports: conexaoFalsa
};
const controller = require('../controllers/usuarioController');

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

test('rejeita corpo ausente ou campos com tipos incorretos no cadastro', async () => {
  let consultas = 0;
  executarBanco = async () => {
    consultas += 1;
    return [[]];
  };

  for (const body of [undefined, [], { nome: {}, email: 'a@b.com', senha: 'senha123' }]) {
    const res = criarResposta();
    await controller.cadastrar({ body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(consultas, 0);
});

test('limita o tamanho da senha antes de acessar o banco', async () => {
  let consultas = 0;
  executarBanco = async () => {
    consultas += 1;
    return [[]];
  };
  const res = criarResposta();

  await controller.cadastrar({
    body: { nome: 'Arthur', email: 'arthur@example.com', senha: 'á'.repeat(37) }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.mensagem, /72 bytes/);
  assert.equal(consultas, 0);
});

test('responde conflito se o email for repetido durante a gravação', async () => {
  executarBanco = async (sql) => {
    if (sql.startsWith('SELECT id FROM usuarios')) return [[]];
    const erro = new Error('duplicate key');
    erro.code = 'ER_DUP_ENTRY';
    throw erro;
  };
  const res = criarResposta();

  await controller.cadastrar({
    body: { nome: 'Arthur', email: 'arthur@example.com', senha: 'senha123' }
  }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.mensagem, /já está cadastrado/i);
});

test('rejeita corpo inválido no login em vez de responder erro interno', async () => {
  let consultas = 0;
  executarBanco = async () => {
    consultas += 1;
    return [[]];
  };
  const res = criarResposta();

  await controller.login({ body: 'inválido' }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(consultas, 0);
});

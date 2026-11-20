const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const conexao = require('./database/conexao');
const corsMiddleware = require('./middlewares/corsMiddleware');
const usuarioRoutes = require('./routes/usuarioRoutes');
const receitaRoutes = require('./routes/receitaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const videoRoutes = require('./routes/videoRoutes');
const configuracaoRoutes = require('./routes/configuracaoRoutes');

const app = express();
const porta = Number(process.env.PORT || 3000);

app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res, next) => {
  try {
    await conexao.query('SELECT 1');
    return res.json({ status: 'online', banco: 'conectado' });
  } catch (erro) {
    return next(erro);
  }
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/configuracoes', configuracaoRoutes);

app.use('/api', (req, res) => {
  return res.status(404).json({ mensagem: 'Rota da API não encontrada.' });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  console.error('Erro ao processar requisição:', erro);
  const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500
    ? erro.status
    : 500;
  const mensagem = status === 400
    ? 'O corpo da requisição não contém JSON válido.'
    : 'Erro interno no servidor.';
  return res.status(status).json({ mensagem });
});

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Configure JWT_SECRET no arquivo .env antes de iniciar o servidor.');
  }

  const servidor = app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
  });
  servidor.on('error', (erro) => {
    if (erro.code === 'EADDRINUSE') {
      console.error(`A porta ${porta} já está ocupada. Feche o servidor existente antes de iniciar outro.`);
      return;
    }
    console.error('Erro ao iniciar o servidor:', erro);
    process.exitCode = 1;
  });
}

module.exports = app;

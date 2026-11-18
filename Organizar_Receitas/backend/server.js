require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path = require('path');
const conexao = require('./database/conexao');
const usuarioRoutes = require('./routes/usuarioRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const receitaRoutes = require('./routes/receitaRoutes');
const videoRoutes = require('./routes/videoRoutes');
const configuracaoRoutes = require('./routes/configuracaoRoutes');
const corsMiddleware = require('./middlewares/corsMiddleware');

const app = express();
const porta = process.env.PORT || 3000;

app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny', index: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', async (req, res) => {
  try {
    await conexao.query('SELECT 1');
    return res.json({ status: 'online', banco: 'conectado' });
  } catch (erro) {
    console.error('Erro ao verificar a conexão com o banco:', erro);
    return res.status(500).json({ status: 'online', banco: 'erro de conexão' });
  }
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/configuracoes', configuracaoRoutes);

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 600
    ? erro.status
    : 500;
  if (status >= 500) console.error('Erro não tratado na API:', erro);
  return res.status(status).json({
    mensagem: status === 400
      ? 'A requisição contém dados inválidos.'
      : status === 413
        ? 'A requisição excede o limite permitido.'
        : 'Erro interno do servidor.'
  });
});

if (!process.env.JWT_SECRET) {
  console.warn('Aviso: JWT_SECRET não foi configurado no arquivo .env.');
}

const servidor = app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`Erro: a porta ${porta} já está sendo utilizada por outro servidor.`);
    console.error(`Acesse http://localhost:${porta} ou encerre o servidor existente antes de iniciar outro.`);
    return;
  }

  console.error('Erro ao iniciar o servidor:', erro.message);
});

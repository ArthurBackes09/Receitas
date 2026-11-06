require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path = require('path');
const conexao = require('./database/conexao');
const usuarioRoutes = require('./routes/usuarioRoutes');
const corsMiddleware = require('./middlewares/corsMiddleware');

const app = express();
const porta = process.env.PORT || 3000;

app.use(corsMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', async (req, res) => {
  try {
    await conexao.query('SELECT 1');
    return res.json({ status: 'online', banco: 'conectado' });
  } catch (erro) {
    return res.status(500).json({ status: 'online', banco: 'erro de conexão' });
  }
});

app.use('/api/usuarios', usuarioRoutes);

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

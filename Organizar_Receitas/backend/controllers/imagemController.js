const { salvarImagem } = require('../middlewares/uploadImagemMiddleware');

async function enviarImagem(req, res, diretorio) {
  try {
    const url = await salvarImagem(req.file, diretorio);
    return res.status(201).json({ url });
  } catch (erro) {
    console.error('Erro ao salvar imagem enviada:', erro);
    return res.status(500).json({ mensagem: 'Não foi possível salvar a imagem enviada.' });
  }
}

function enviarImagemReceita(req, res) {
  return enviarImagem(req, res, 'receitas');
}

function enviarImagemConfiguracao(req, res) {
  return enviarImagem(req, res, 'site');
}

module.exports = { enviarImagemReceita, enviarImagemConfiguracao };

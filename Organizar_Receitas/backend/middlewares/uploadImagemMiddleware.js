const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const tiposPermitidos = {
  'image/jpeg': { extensao: 'jpg', assinatura: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/png': { extensao: 'png', assinatura: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extensao: 'webp', assinatura: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }
};

const receberArquivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, arquivo, callback) {
    if (!tiposPermitidos[arquivo.mimetype]) {
      const erro = new Error('Selecione uma imagem JPEG, PNG ou WebP.');
      erro.status = 400;
      callback(erro);
      return;
    }
    callback(null, true);
  }
}).single('imagem');

function receberImagem(req, res, next) {
  receberArquivo(req, res, (erro) => {
    if (erro) {
      const limiteExcedido = erro.code === 'LIMIT_FILE_SIZE';
      return res.status(limiteExcedido ? 413 : (erro.status || 400)).json({
        mensagem: limiteExcedido ? 'A imagem deve ter no máximo 5 MB.' : erro.message
      });
    }
    if (!req.file) return res.status(400).json({ mensagem: 'Selecione uma imagem para enviar.' });

    const tipo = tiposPermitidos[req.file.mimetype];
    if (!tipo || !tipo.assinatura(req.file.buffer)) {
      return res.status(400).json({ mensagem: 'O arquivo não é uma imagem JPEG, PNG ou WebP válida.' });
    }
    req.tipoImagem = tipo;
    return next();
  });
}

async function salvarImagem(arquivo, diretorio) {
  const tipo = tiposPermitidos[arquivo.mimetype];
  if (!tipo || !tipo.assinatura(arquivo.buffer)) {
    throw new Error('O conteúdo do arquivo não corresponde a uma imagem permitida.');
  }

  const nome = `${crypto.randomUUID()}.${tipo.extensao}`;
  const pasta = path.join(__dirname, '..', 'uploads', diretorio);
  await fs.mkdir(pasta, { recursive: true });
  await fs.writeFile(path.join(pasta, nome), arquivo.buffer, { flag: 'wx' });
  return `/uploads/${diretorio}/${nome}`;
}

module.exports = { receberImagem, salvarImagem };

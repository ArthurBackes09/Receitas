function autorizacao(...niveisPermitidos) {
  return function (req, res, next) {
    if (!req.usuario || !niveisPermitidos.includes(req.usuario.nivel)) {
      return res.status(403).json({ mensagem: 'Você não possui permissão para acessar este recurso.' });
    }

    return next();
  };
}

module.exports = autorizacao;

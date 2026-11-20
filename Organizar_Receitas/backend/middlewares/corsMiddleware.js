module.exports = function cors(req, res, next) {
  const origem = req.headers.origin;
  const origemLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origem || '');

  if (origemLocal) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
};

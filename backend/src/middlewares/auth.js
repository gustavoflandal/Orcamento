const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT robusto
 * - Verifica se o token está presente e válido
 * - Retorna erro 401 se ausente ou inválido/expirado
 * - Adiciona o usuário decodificado em req.user
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
};

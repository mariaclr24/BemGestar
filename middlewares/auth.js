const jwt = require('jsonwebtoken');
const segredoJWT = 'segredo_supersecreto'; // Usa .env para guardar o segredo

function autenticarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, segredoJWT, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    req.user = user; // Exemplo: { id_utilizador: ..., tipo_utilizador: ... }
    next();
  });
}

module.exports = autenticarJWT;

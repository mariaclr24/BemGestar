const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findUserByEmail, updatePassword } = require('../models/userModel');
const { enviarEmail } = require('../config/email'); // <- usa o teu módulo

async function solicitarRecuperacaoSenha(req, res) {
  const { email } = req.body;
  const user = await findUserByEmail(email);

  if (!user) return res.status(404).json({ error: 'Email não encontrado' });

  const token = jwt.sign({ id: user.id_utilizador }, process.env.JWT_SECRET, { expiresIn: '30m' });
  const resetLink = `http://localhost:3000/redefinir_senha.html?token=${token}`;

  const corpo = `
Recebemos um pedido para redefinir a sua palavra-passe na plataforma BemGestar.
Clique no link abaixo para continuar:

${resetLink}

Este link é válido por 30 minutos.
Se não foi você que fez este pedido, ignore este email.
`;

  await enviarEmail(email, 'Recuperação de Palavra-Passe - BemGestar', corpo);

  res.json({ message: 'Email de recuperação enviado com sucesso' });
}

async function redefinirSenha(req, res) {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(newPassword, 10);
    await updatePassword(decoded.id, hashed);
    res.json({ message: 'Palavra-passe redefinida com sucesso' });
  } catch (err) {
    res.status(400).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = {
  solicitarRecuperacaoSenha,
  redefinirSenha
};

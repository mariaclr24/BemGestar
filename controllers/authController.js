const authModel = require('../models/authModel');
const jwt = require('jsonwebtoken');
const segredoJWT = 'segredo_supersecreto'; // Ideal guardar num .env

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(password, user.senha);
    if (!match) return res.status(401).json({ error: "Credenciais inválidas" });

    // Geração do JWT após login válido
    const token = jwt.sign({
      id_utilizador: user.id_utilizador,
      tipo_utilizador: user.tipo_utilizador
    }, segredoJWT, { expiresIn: '8h' });

    res.json({
      message: "Login bem-sucedido",
      token,
      id_utilizador: user.id_utilizador,
      tipo_utilizador: user.tipo_utilizador
    });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
};


exports.register = async (req, res) => {
  const { senha, codigo, contacto, contacto_emergencia } = req.body;
  try {
    // Para obter os dados temporários, primeiro pega o temp da authModel
    const temp = await authModel.getTempAvaliation(codigo);
    await authModel.createUser(temp, senha, contacto, contacto_emergencia, codigo);
    res.status(201).json({ message: 'Registo concluído com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao concluir o registo.' });
  }
};

exports.validarCodigo = async (req, res) => {
  const { codigo } = req.params;
  try {
    const avaliacao = await authModel.getTempAvaliation(codigo);
    res.json({ avaliacao });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

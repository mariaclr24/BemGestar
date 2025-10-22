const bcrypt = require('bcrypt');
const profissionalModel = require('../models/profissionalModel');
exports.registarProfissional = async (req, res) => {
  const {
    nome,
    email,
    senha,
    especialidade,
    hora_almoco_inicio,
    hora_almoco_fim,
    id_clinica
  } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    const id_utilizador = await profissionalModel.createProfissional({
      nome,
      email,
      senhaHash,
      especialidade,
      hora_almoco_inicio,
      hora_almoco_fim,
      id_clinica
    });

    res.status(201).json({ message: 'Profissional registado com sucesso.', id_utilizador });
  } catch (err) {
    console.error('Erro ao registar profissional:', err);
    res.status(400).json({ error: err.message || 'Erro ao registar profissional.' });
  }
};

exports.listarProfissionais = async (req, res) => {
  try {
    const profissionais = await profissionalModel.getAllProfissionais();
    res.json(profissionais);
  } catch (err) {
    console.error('Erro ao listar profissionais:', err);
    res.status(500).json({ error: 'Erro ao listar profissionais.' });
  }
};


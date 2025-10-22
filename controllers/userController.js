const userModel = require('../models/userModel');


exports.getAllUsersSeparated = async (req, res) => {
  try {
    const data = await userModel.getAllUsersSeparated();
    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar utilizadores separados:', err);
    res.status(500).json({ error: 'Erro ao buscar utilizadores.' });
  }
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  try {
    await userModel.toggleActive(id, ativo);
    res.json({ message: 'Estado atualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar estado.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await userModel.deleteUser(id);
    res.json({ message: 'Utilizador removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao apagar utilizador.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    await userModel.updateUser(id, req.body.nome, req.body.email, req.body.contacto, req.body.contacto_emergencia, req.body.novaSenha, req.body.senhaAtual);
    res.json({ message: "Perfil atualizado com sucesso." });
  } catch (err) {
    if (err.message.includes('palavra-passe')) return res.status(401).json({ error: err.message });
    if (err.message.includes('necessário')) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Erro ao atualizar dados." });
  }
};

exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;
  try {
    await userModel.changePassword(id, senhaAtual, novaSenha);
    res.json({ message: 'Palavra-passe atualizada com sucesso.' });
  } catch (err) {
    if (err.message.includes('incorreta')) return res.status(401).json({ error: err.message });
    if (err.message.includes('não encontrado')) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Erro ao atualizar palavra-passe.' });
  }
};

exports.getTerapiasUtente = async (req, res) => {
  try {
    const terapias = await userModel.getTerapiasUtente(req.params.id);
    res.json(terapias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar terapias.' });
  }
};

exports.getAllUtentes = async (req, res) => {
  try {
    const utentes = await userModel.getAllUtentesWithTerapias();
    res.json(utentes);
  } catch (err) {
    console.error('Erro ao buscar utentes:', err);
    res.status(500).json({ error: 'Erro ao buscar utentes.' });
  }
};

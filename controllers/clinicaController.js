const clinicaModel = require('../models/clinicaModel');

exports.addClinica = async (req, res) => {
  try {
    await clinicaModel.addClinica(
      req.body.nome,
      req.body.localizacao,
      req.body.hora_abertura,
      req.body.hora_fecho,
      req.body.dias_funcionamento
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar clínica.' });
  }
};

exports.getClinicas = async (req, res) => {
  try {
    const clinicas = await clinicaModel.getClinicas();
    res.json(clinicas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter clínicas.' });
  }
};

exports.updateClinica = async (req, res) => {
  try {
    await clinicaModel.updateClinica(
      req.params.id,
      req.body.nome,
      req.body.localizacao,
      req.body.hora_abertura,
      req.body.hora_fecho,
      req.body.dias_funcionamento
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar clínica.' });
  }
};

exports.deleteClinica = async (req, res) => {
  try {
    await clinicaModel.deleteClinica(req.params.id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao apagar clínica.' });
  }
};

exports.getEspacos = async (req, res) => {
  try {
    const espacos = await clinicaModel.getEspacos(req.params.id);
    res.json(espacos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter espaços.' });
  }
};

exports.addEspaco = async (req, res) => {
  try {
    await clinicaModel.addEspaco(req.params.id, req.body.nome, req.body.max_vagas);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar espaço.' });
  }
};

exports.updateEspaco = async (req, res) => {
  try {
    await clinicaModel.updateEspaco(req.params.id, req.body.nome, req.body.max_vagas);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar espaço.' });
  }
};

exports.deleteEspaco = async (req, res) => {
  try {
    await clinicaModel.deleteEspaco(req.params.id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao apagar espaço.' });
  }
};

exports.getClinicasSimples = async (req, res) => {
  try {
    const clinicas = await clinicaModel.getClinicasSimples();
    res.json(clinicas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clínicas.' });
  }
};

exports.getEspacosSimples = async (req, res) => {
  try {
    const espacos = await clinicaModel.getEspacosSimples();
    res.json(espacos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar espaços.' });
  }
};

exports.getTerapiasSimples = async (req, res) => {
  try {
    const terapias = await clinicaModel.getTerapiasSimples();
    res.json(terapias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar terapias.' });
  }
};

exports.getProfissionaisSimples = async (req, res) => {
  try {
    const profs = await clinicaModel.getProfissionaisSimples();
    res.json(profs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar profissionais.' });
  }
};

exports.getAulasDisponiveis = async (req, res) => {
  try {
    const aulas = await clinicaModel.getAulasDisponiveis(req.params.id);
    res.json(aulas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar aulas disponíveis.' });
  }
};

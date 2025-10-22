const model = require('../models/terapiaModel');

exports.getTerapias = async (req, res) => {
  try {
    const terapias = await model.getTerapias();
    res.json(terapias);
  } catch (err) {
    console.error('Erro ao obter terapias:', err);
    res.status(500).json({ error: 'Erro ao obter terapias.' });
  }
};

exports.getallterapias = async (req, res) => {
  try {
    const terapias1 = await model.getallterapias();
    res.json(terapias1);
  } catch (err) {
    console.error('Erro ao obter terapias:', err);
    res.status(500).json({ error: 'Erro ao obter terapias.' });
  }
};

exports.getTerapiaById = async (req, res) => {
  try {
    const terapia = await model.getTerapiaById(req.params.id);
    if (!terapia) {
      return res.status(404).json({ error: 'Terapia não encontrada.' });
    }
    res.json(terapia);
  } catch (err) {
    console.error('Erro ao buscar terapia:', err);
    res.status(500).json({ error: 'Erro ao buscar dados da terapia.' });
  }
};

exports.createTerapia = async (req, res) => {
  const t = req.body;

  if (!t.nome || !t.descricao || !t.n_vagas || !t.duracao || !t.valor || !t.id_profissional) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (t.n_vagas > 15) {
    return res.status(400).json({ error: 'O número máximo de vagas é 15.' });
  }

  if (t.duracao <= 0) {
    return res.status(400).json({ error: 'A duração deve ser maior que 0 minutos.' });
  }

  if (t.valor < 0) {
    return res.status(400).json({ error: 'O valor não pode ser negativo.' });
  }

  try {
    const id = await model.createTerapia(t);
    res.status(201).json({ message: 'Terapia criada com sucesso.', id });
  } catch (err) {
    console.error('Erro ao criar terapia:', err);
    res.status(500).json({ error: 'Erro ao criar terapia.' });
  }
};

exports.updateTerapia = async (req, res) => {
  const id = req.params.id;
  const t = req.body;

  if (!t.nome || !t.descricao || !t.n_vagas || !t.duracao || !t.valor || !t.id_profissional) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (t.n_vagas > 15) {
    return res.status(400).json({ error: 'O número máximo de vagas é 15.' });
  }

  if (t.duracao <= 0) {
    return res.status(400).json({ error: 'A duração deve ser maior que 0 minutos.' });
  }

  if (t.valor < 0) {
    return res.status(400).json({ error: 'O valor não pode ser negativo.' });
  }

  try {
    await model.updateTerapia(id, t);
    res.json({ message: 'Terapia atualizada com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar terapia:', err);
    res.status(500).json({ error: 'Erro ao atualizar terapia.' });
  }
};

exports.deleteTerapia = async (req, res) => {
  try {
    await model.deleteTerapia(req.params.id);
    res.json({ message: 'Terapia removida com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover terapia:', err);
    res.status(500).json({ error: 'Erro ao remover terapia.' });
  }
};

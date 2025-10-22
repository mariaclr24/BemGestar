const presencaModel = require('../models/presencaModel');


exports.marcarPresenca = async (req, res) => {
  try {
    await presencaModel.marcarPresenca(req.body.id_utilizador, req.body.id_aula);
    res.json({ message: 'Presença confirmada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao confirmar presença.' });
  }
};

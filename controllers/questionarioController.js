
const model = require('../models/questionarioModel');
exports.verificarResposta = async (req, res) => {
  const id_utilizador = req.user.id_utilizador;
  const { id_aula } = req.params;

  try {
    const jaRespondeu = await model.jaRespondeu(id_utilizador, id_aula);
    res.json({ respondido: jaRespondeu });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar resposta.' });
  }
};
exports.verResposta = async (req, res) => {
  const id_utilizador = req.user.id_utilizador;
  const id_aula = req.params.id_aula;

  try {
    const resposta = await model.obterResposta(id_utilizador, id_aula);
    if (!resposta) {
      return res.status(404).json({ erro: 'Resposta não encontrada.' });
    }
    res.json(resposta);
  } catch (err) {
    console.error('[ERRO]', err.message);
    res.status(500).json({ erro: 'Erro ao obter resposta.' });
  }
};

exports.submeterQuestionario = async (req, res) => {
  const id_utilizador = req.user.id_utilizador;
  const dados = req.body;

  try {
    await model.inserirResposta(id_utilizador, dados);
    res.json({ mensagem: 'Questionário submetido com sucesso.' });
  } catch (err) {
    console.error('[ERRO]', err.message);
    res.status(500).json({ erro: 'Erro ao submeter questionário.' });
  }
};

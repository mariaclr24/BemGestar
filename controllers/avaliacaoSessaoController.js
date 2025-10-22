// controllers/avaliacaoSessaoController.js
const path = require('path');
const model = require('../models/avaliacaoSessaoModel');
const fs = require('fs');


exports.listarPresencas = async (req, res) => {
  try {
    const id_aula = parseInt(req.params.id);
    const aula = await model.getResumoAula(id_aula);
    const participantes = await model.getParticipantesPresentes(id_aula);
    res.json({ aula, participantes });
  } catch (err) {
    console.error('[listarPresencas]', err.message);
    res.status(500).json({ erro: 'Erro ao obter presenças.' });
  }
};
exports.listarUtentesPresencas = async (req, res) => {
  try {
    const id_aula = parseInt(req.params.id);
    const participantes = await model.getParticipantesPresentes(id_aula);
    res.json(participantes); // 🔹 Agora retorna apenas os participantes
  } catch (err) {
    console.error('[listarPresencas]', err.message);
    res.status(500).json({ erro: 'Erro ao obter presenças.' });
  }
};

exports.uploadAvaliacaoSessao = async (req, res) => {
  const { id_utilizador, id_aula } = req.body;
  const ficheiro = req.file;

  if (!ficheiro || ficheiro.mimetype !== 'application/pdf') {
    return res.status(400).json({ erro: 'Apenas ficheiros PDF são permitidos.' });
  }

  try {
    const extensao = '.pdf';
    const baseNome = path.parse(ficheiro.originalname).name.replace(/\s+/g, '_');
    const novoNome = `${Date.now()}_${baseNome}${extensao}`;

    const caminhoOriginal = ficheiro.path; // caminho real sem extensão
    const caminhoNovo = path.join(ficheiro.destination, novoNome); // destino com .pdf

    fs.renameSync(caminhoOriginal, caminhoNovo); // renomeia o ficheiro fisicamente

    const caminhoRelativo = path.join('/uploads', novoNome);

    // Apagar ficheiro anterior se existir
    const anterior = await model.getAvaliacaoExistente(id_utilizador, id_aula);
    if (anterior) {
      const antigoPath = path.resolve(anterior);
      if (fs.existsSync(antigoPath)) fs.unlinkSync(antigoPath);
    }

    const resultado = await model.submeterAvaliacaoSessao(
      parseInt(id_utilizador),
      parseInt(id_aula),
      caminhoRelativo
    );

    res.json({ mensagem: resultado });

  } catch (err) {
    console.error('[uploadAvaliacaoSessao]', err.message);
    res.status(500).json({ erro: 'Erro ao submeter avaliação da sessão.' });
  }
};
exports.verQuestionario = async (req, res) => {
  const { id_aula, id_utilizador } = req.params;

  try {
    const resposta = await model.getRespostasQuestionario(id_aula, id_utilizador);
    if (!resposta) {
      return res.status(404).json({ erro: 'Questionário não encontrado.' });
    }

    res.json({ resposta });
  } catch (err) {
    console.error('[verQuestionario]', err.message);
    res.status(500).json({ erro: 'Erro ao obter questionário.' });
  }
};



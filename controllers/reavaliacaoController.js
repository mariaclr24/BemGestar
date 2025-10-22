const model = require('../models/reavaliacaoModel');

async function listarAvaliacoes(req, res) {
  try {
    const avaliacoes = await model.getAvaliacoes();
    res.status(200).json(avaliacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function definirTerapia(req, res) {
  try {
    const { id_avaliacao, id_terapia, tipo } = req.body;

    if (!id_avaliacao || !id_terapia || !tipo) {
      console.error("Erro de validação: Campos obrigatórios ausentes.");
      return res.status(400).json({ 
        error: "Todos os campos são obrigatórios!", 
        details: { id_avaliacao, id_terapia, tipo } 
      });
    }

    const result = await definirTerapia(id_avaliacao, id_terapia, tipo);
    res.status(200).json(result);

  } catch (error) {
    console.error("Erro ao definir terapia:", error); // Log completo no servidor
    res.status(500).json({ 
      error: "Erro ao definir terapia.", 
      details: error.message 
    });
  }
}

async function listarReavaliacoes(req, res) {
  try {
    const id_utente = req.user.id_utilizador;
    const reavaliacoes = await model.getReavaliacoesPorUtente(id_utente);
    res.json(reavaliacoes); // <-- Isto tem de ser JSON
  } catch (err) {
    res.status(500).json({ erro: err.message }); // <-- e aqui também
  }
}

async function criarReavaliacao(req, res) {
  const id_utente = req.user.id_utilizador; // vem do token
  const { data, hora } = req.body;

  try {
    const resultado = await model.marcarReavaliacao(id_utente, data, hora);
    res.json({ mensagem: 'Reavaliação marcada com sucesso', ...resultado });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}


module.exports = {
  listarReavaliacoes,
  criarReavaliacao,
  listarAvaliacoes, 
  definirTerapia
};

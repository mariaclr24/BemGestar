const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const model = require('../models/biosinalModel');
const presenteModel = require('../models/avaliacaoSessaoModel');

exports.uploadBiosinal = async (req, res) => {
  const id_utilizador = req.user.id_utilizador;
  const { id_aula } = req.body;
  const ficheiro = req.file;

  if (!ficheiro) {
    return res.status(400).json({ erro: 'Ficheiro não enviado.' });
  }

  try {
    const tipo = 'EMG';
    const extensao = path.extname(ficheiro.originalname) || '.txt';
    const novoNome = ficheiro.filename + extensao;
    const caminhoOriginal = path.join(ficheiro.destination, ficheiro.filename);
    const caminhoNovo = path.join(ficheiro.destination, novoNome);
    fs.renameSync(caminhoOriginal, caminhoNovo);

    const caminhoRelativo = path.join('uploads', novoNome);
    await model.inserirBiosinal(tipo, caminhoRelativo, id_aula, id_utilizador);

    res.json({ mensagem: 'Ficheiro de biosinal enviado e associado com sucesso.' });
  } catch (err) {
    console.error('[ERRO uploadBiosinal]', err.message);
    res.status(500).json({ erro: 'Erro ao guardar ficheiro de biosinal.' });
  }
};


exports.verificarBiosinal = async (req, res) => {
  const id_utilizador = req.user.id_utilizador;
  const id_aula = req.params.id_aula;

  try {
    const existe = await model.verificarBiosinal(id_utilizador, id_aula);
    res.json({ existe });
  } catch (err) {
    console.error('Erro ao verificar biosinal:', err.message);
    res.status(500).json({ error: 'Erro ao verificar biosinal.' });
  }
};
exports.analiseBiosinal = async (req, res) => {
  const id_profissional = req.user.id_utilizador;
  const id_aula = parseInt(req.params.id_aula);
  const id_utilizador = parseInt(req.query.id_utilizador); // <-- vem por query

  try {
    // Verifica se o profissional tem acesso à aula
    const participantes = await presenteModel.getParticipantesPresentes(id_aula);
    const utente = participantes.find(p => p.id_utilizador === id_utilizador);

    if (!utente) {
      return res.status(403).json({ erro: 'Sem permissão para ver este biosinal.' });
    }

    const rawPath = await model.getCaminhoBiosinal(id_utilizador, id_aula);
    if (!rawPath) {
      return res.status(404).json({ erro: 'Ficheiro de biosinal não encontrado.' });
    }

    const caminhoRelativo = rawPath.replace(/\\/g, '/');
    const caminhoAbsoluto = path.resolve(caminhoRelativo);
    const pastaResultados = path.resolve('resultados');
    const script = path.resolve('scripts', 'analise_emg.py');

    if (!fs.existsSync(caminhoAbsoluto)) {
      return res.status(404).json({ erro: 'Ficheiro não existe fisicamente.' });
    }

    if (!fs.existsSync(pastaResultados)) {
      fs.mkdirSync(pastaResultados, { recursive: true });
    }

    const processo = spawn('python', [script, caminhoAbsoluto, pastaResultados]);

    processo.stdout.on('data', (data) => console.log('[PYTHON]', data.toString()));
    processo.stderr.on('data', (data) => console.error('[PYTHON ERRO]', data.toString()));

    processo.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ erro: 'Erro ao gerar análise.' });
    }

    // 🔍 Lê os valores calculados do ficheiro (ex: JSON ou .txt)
    const statsPath = path.resolve(pastaResultados, 'estatisticas.json');
    let rms = null, media = null, desvio = null;

    if (fs.existsSync(statsPath)) {
      try {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        rms = stats.rms;
        media = stats.media;
        desvio = stats.desvio;
      } catch (err) {
        console.warn('Erro a ler estatísticas:', err.message);
      }
    }

    res.json({
      mensagem: 'Análise concluída.',
      grafico: '/resultados/emg_com_picos_e_rms_com_tabela.png',
      tabela: '/resultados/tabela_picos.csv',
      rms,
      media,
      desvio
    });
});

  } catch (err) {
    console.error('[ERRO analiseBiosinal]', err.message);
    res.status(500).json({ erro: 'Erro ao executar análise de biosinal.' });
  }
};

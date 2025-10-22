const aulaModel = require('../models/aulaModel');
const { enviarEmail } = require('../config/email');
const pool = require('../config/db');

exports.getAllAulas = async (req, res) => {
  try {
    const aulas = await aulaModel.getAllAulas();
    res.json(aulas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar aulas' });
  }
};

exports.getAulasDoDia = async (req, res) => {
  try {
    const aulas = await aulaModel.getAulasDoDia(req.params.id_utilizador);
    res.json(aulas);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar aulas do dia." });
  }
};

exports.getAulasRealizadas = async (req, res) => {
  try {
    const aulas = await aulaModel.getAulasRealizadas(req.params.userId);
    res.json(aulas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar aulas realizadas' });
  }
};
exports.getDetalhesAula = async (req, res) => {
  const id_aula = req.params.id;
  try {
    const detalhes = await aulaModel.getDetalhesAula(id_aula);
    res.json(detalhes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar detalhes da aula.' });
  }
};
exports.getAulasProfissional = async (req, res) => {
  const id_profissional = req.user.id_utilizador;
  try {
    const aulas = await aulaModel.getAulasProfissional(id_profissional);
    res.json(aulas);
  } catch (err) {
    console.error('Erro ao buscar aulas do profissional:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar aulas do profissional.' });
  }
};
exports.getAgendadosAula = async (req, res) => {
  const id_aula = req.params.id_aula;
  try {
    const utentes = await aulaModel.getAgendadosPorAula(id_aula);
    res.json(utentes);
  } catch (err) {
    console.error('[getAgendadosPorAula]', err.message);
    res.status(500).json({ erro: 'Erro ao obter agendados.' });
  }
};

exports.getFilaEspera = async (req, res) => {
  const { id_aula } = req.params;

  try {
    const filaEspera = await aulaModel.getFilaEspera(id_aula);
    res.json(filaEspera);
  } catch (err) {
    console.error('[ERRO] Falha ao buscar fila de espera:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar fila de espera.' });
  }
};
exports.enviarSolicitacaoAdicaoManual = async (req, res) => {
  const {
    id_aula,
    id_utilizador,
    email_profissional,
    mensagem_admin,
    nome_utente
  } = req.body;

  try {
    // Get class details
    const aula = await aulaModel.getDetalhesAula(id_aula);
    
    // Create approval token (expires in 24h)
    const token = jwt.sign(
      { id_aula, id_utilizador, tipo: 'aprovacao_adicao_manual' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const linkAprovacao = `${process.env.FRONTEND_URL}/api/aulas/aprovar-adicao-manual?token=${token}`;
    
    // Send email to professional
    await enviarEmail({
      to: email_profissional,
      subject: 'Solicitação de Adição Manual de Participante',
      html: `
        <h2>Solicitação de Adição Manual</h2>
        <p>O administrador solicitou a adição do utente <strong>${nome_utente}</strong> à aula:</p>
        <ul>
          <li><strong>Terapia:</strong> ${aula.nome_terapia}</li>
          <li><strong>Data:</strong> ${new Date(aula.data).toLocaleDateString()}</li>
          <li><strong>Hora:</strong> ${aula.hora}</li>
        </ul>
        <p><strong>Mensagem do Administrador:</strong></p>
        <p>${mensagem_admin}</p>
        <p>Para aprovar esta adição, clique no link abaixo:</p>
        <a href="${linkAprovacao}">Aprovar Adição Manual</a>
        <p>Este link expira em 24 horas.</p>
      `
    });

    res.json({ mensagem: 'Solicitação enviada com sucesso.' });
  } catch (err) {
    console.error('Erro ao enviar solicitação:', err);
    res.status(500).json({ erro: 'Erro ao enviar solicitação.' });
  }
};


exports.adicionarParticipanteManual = async (req, res) => {
  const { id_aula, id_utilizador } = req.body;

  try {
    const cheia = await aulaModel.aulaEstaCheia(id_aula);
    if (!cheia) {
      return res.status(400).json({ erro: 'Só pode adicionar participantes manualmente quando a aula estiver cheia.' });
    }

    // Inserir na agenda
    await pool.query(`
      INSERT INTO agenda (id_utilizador, id_aula, data_agendamento, pago, presente)
      VALUES ($1, $2, NOW(), false, false)
    `, [id_utilizador, id_aula]);

    res.json({ mensagem: 'Participante adicionado manualmente com sucesso.' });

  } catch (err) {
    console.error("Erro ao adicionar participante manual:", err);
    res.status(500).json({ erro: 'Erro ao adicionar participante.' });
  }
};

exports.getAulasRealizadasAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id_aula, a.data, t.nome AS nome_terapia, u.nome AS profissional, e.nome AS espaco, c.nome AS clinica
      FROM aula a
      JOIN terapia t ON t.id_terapia = a.id_terapia
      JOIN espaco e ON e.id_espaco = a.id_espaco
      JOIN clinica c ON c.id_clinica = e.id_clinica
      JOIN utilizador u ON u.id_utilizador = a.id_utilizador
      WHERE a.data < NOW() -- FILTRA APENAS AULAS PASSADAS
      ORDER BY a.data DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar aulas realizadas:", err);
    res.status(500).json({ erro: "Erro ao carregar aulas realizadas." });
  }
};

exports.getAgendados = async (req, res) => {
  try {
    const agendados = await aulaModel.getAgendados(req.params.userId);
    res.json(agendados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar aulas agendadas' });
  }
};

exports.agendarAula = async (req, res) => {
  const { id_utilizador, id_aula } = req.body;

  try {
    const resultado = await aulaModel.agendarAula(id_utilizador, id_aula);

    // Enviar email conforme o tipo de agendamento
    if (resultado.em_espera) {
  const assunto = 'Lista de Espera - BemGestar';
  const mensagem = `Olá ${resultado.nome},

  A aula para ${new Date(resultado.data).toLocaleString('pt-PT')} já se encontra cheia.

  Foi adicionada à lista de espera e será notificada caso surja uma vaga.

  Obrigado,
  Equipa BemGestar`;

    await enviarEmail(resultado.email, assunto, mensagem);

    await pool.query(`
      INSERT INTO notificacao (id_utilizador, assunto, mensagem)
      VALUES ($1, $2, $3)
    `, [id_utilizador, assunto, mensagem]);

  } else {
    const assunto = 'Confirmação de Agendamento - BemGestar';
    const mensagem = `Olá ${resultado.nome},

  A sua aula foi marcada com sucesso para ${new Date(resultado.data).toLocaleString('pt-PT')}.

  Obrigado,
  Equipa BemGestar`;

    await enviarEmail(resultado.email, assunto, mensagem);

    await pool.query(`
      INSERT INTO notificacao (id_utilizador, assunto, mensagem)
      VALUES ($1, $2, $3)
    `, [id_utilizador, assunto, mensagem]);
  }

    res.json({
      message: resultado.em_espera
        ? 'Aula cheia. Utilizador colocado na lista de espera.'
        : 'Agendamento concluído.',
      pago: resultado.pago ?? false,
      falta_pagar: resultado.falta_pagar ?? null,
      em_espera: resultado.em_espera ?? false
    });

  } catch (err) {
    console.error("Erro ao agendar aula:", err.message);

    if (err.message.includes('agendada')) {
      res.status(400).json({ error: 'Já tem esta aula agendada.' });
    } else if (err.message.includes('conflito')) {
      res.status(400).json({ error: 'Já tem outra aula nesse horário.' });
    } else {
      res.status(500).json({ error: 'Erro ao agendar aula.' });
    }
  }
};
exports.cancelarAgendamento = async (req, res) => {
  const { id_utilizador, id_aula } = req.body;

  try {
    const resultado = await aulaModel.cancelarAgendamento(id_utilizador, id_aula);

    const assunto = 'Cancelamento de Aula - BemGestar';
    const mensagem = `Olá ${resultado.nome},

    A sua aula marcada para ${new Date(resultado.data).toLocaleString('pt-PT')} foi cancelada com sucesso.

    Obrigado,
    Equipa BemGestar`;

    await enviarEmail(resultado.email, assunto, mensagem);

    await pool.query(`
      INSERT INTO notificacao (id_utilizador, assunto, mensagem)
      VALUES ($1, $2, $3)
    `, [id_utilizador, assunto, mensagem]);

    res.json({ message: 'Aula cancelada com sucesso.' });

  } catch (err) {
    console.error("Erro ao cancelar agendamento:", err.message);

    if (err.message.includes('24h')) {
      res.status(400).json({ error: 'Cancelamento só é permitido até 24h antes da aula.' });
    } else if (err.message.includes('não encontrada')) {
      res.status(400).json({ error: 'A aula não foi encontrada ou não está agendada.' });
    } else {
      res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
    }
  }
};

exports.alterarHorario = async (req, res) => {
  const { id_utilizador, id_aula_atual, id_aula_nova } = req.body;

  try {
    const resultado = await aulaModel.alterarHorario(id_utilizador, id_aula_atual, id_aula_nova); 

    const assunto = 'Alteração de Aula - BemGestar';
    const mensagem = `Olá ${resultado.nome},

    A sua aula foi reagendada com sucesso para ${new Date(resultado.data).toLocaleString('pt-PT')}.

    Obrigado,
    Equipa BemGestar`;

    await enviarEmail(resultado.email, assunto, mensagem);

    await pool.query(`
      INSERT INTO notificacao (id_utilizador, assunto, mensagem)
      VALUES ($1, $2, $3)
    `, [id_utilizador, assunto, mensagem]);


    res.json({ message: 'Horário alterado com sucesso.' });

  } catch (err) {
    if (err.message.includes('lotada')) {
      res.status(400).json({ error: 'A nova aula já está lotada. Escolha outro horário.' });
    } else if (err.message.includes('terapia')) {
      res.status(400).json({ error: 'As aulas não pertencem à mesma terapia.' });
    } else if (err.message.includes('alterações')) {
      res.status(400).json({ error: 'Alterações só são permitidas até 24h antes da aula.' });
    } else if (err.message.includes('agendada')) {
      res.status(400).json({ error: 'Já tem esta aula agendada.' });
    } else {
      res.status(500).json({ error: 'Erro ao alterar aula.' });
    }
  }
};

exports.createAula = async (req, res) => {
  const { id_clinica, id_terapia, id_espaco, data, hora, n_vagas, id_utilizador } = req.body;

  try {
    // Validações de data (passada e limite 1 mês)
    const hoje = new Date();
    const dataAula = new Date(data + 'T00:00:00');
    const umMesDepois = new Date();
    umMesDepois.setMonth(hoje.getMonth() + 1);

    hoje.setHours(0,0,0,0);
    dataAula.setHours(0,0,0,0);
    umMesDepois.setHours(0,0,0,0);

    if (dataAula < hoje) {
      return res.status(400).json({ error: "Não pode criar aulas para datas passadas." });
    }
    if (dataAula > umMesDepois) {
      return res.status(400).json({ error: "Só pode criar aulas até 1 mês à frente." });
    }

    // Buscar dados da clínica
    const clinicaResult = await pool.query(
      'SELECT hora_abertura, hora_fecho, dias_funcionamento FROM clinica WHERE id_clinica = $1',
      [id_clinica]
    );
    if (clinicaResult.rows.length === 0) {
      return res.status(404).json({ error: "Clínica não encontrada." });
    }
    const { hora_abertura, hora_fecho, dias_funcionamento } = clinicaResult.rows[0];

    // Verifica dia da semana da aula
    const diaSemana = dataAula.getDay();
    if (!dias_funcionamento.includes(diaSemana)) {
      return res.status(400).json({ error: "A clínica está fechada neste dia." });
    }

    // Conversão horários para minutos
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const horaAulaMin = toMinutes(hora);
    const aberturaMin = toMinutes(hora_abertura);
    const fechoMin = toMinutes(hora_fecho);

    if (horaAulaMin < aberturaMin || horaAulaMin >= fechoMin) {
      return res.status(400).json({ error: "A clínica está fechada neste horário." });
    }

    // Buscar pausa do profissional
    const profResult = await pool.query(
      'SELECT hora_almoco_inicio, hora_almoco_fim FROM ProfissionalSaude WHERE id_utilizador = $1',
      [id_utilizador]
    );
    if (profResult.rows.length === 0) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }
    const { hora_almoco_inicio, hora_almoco_fim } = profResult.rows[0];

    const almocoInicioMin = hora_almoco_inicio ? toMinutes(hora_almoco_inicio) : null;
    const almocoFimMin = hora_almoco_fim ? toMinutes(hora_almoco_fim) : null;

    if (almocoInicioMin !== null && almocoFimMin !== null) {
      if (horaAulaMin >= almocoInicioMin && horaAulaMin < almocoFimMin) {
        return res.status(400).json({ error: "A aula não pode ser marcada durante a hora de almoço do profissional." });
      }
    }

    // Buscar duração da terapia
    const duracaoResult = await pool.query(
      'SELECT duracao FROM terapia WHERE id_terapia = $1',
      [id_terapia]
    );
    if (duracaoResult.rows.length === 0) {
      return res.status(404).json({ error: "Terapia não encontrada." });
    }
    const duracaoMin = duracaoResult.rows[0].duracao;

    // Timestamp da aula
    const tsInicio = `${data} ${hora}`;
    const tsFimQuery = `
      TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI') + INTERVAL '${duracaoMin} minutes'
    `;

    // Verificar conflito com aulas existentes do profissional
    const conflitoAula = await pool.query(`
      SELECT 1
      FROM aula a
      JOIN agenda ag ON a.id_aula = ag.id_aula 
      WHERE a.id_utilizador = $2
        AND a.data < ${tsFimQuery}
        AND a.data + INTERVAL '${duracaoMin} minutes' > TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI')
    `, [tsInicio, id_utilizador]);

    if (conflitoAula.rows.length > 0) {
      return res.status(400).json({ error: "O profissional está ocupado com outra aula nesse horário." });
    }

    // Verificar conflito com avaliações clínicas
    const conflitoAvaliacao = await pool.query(`
      SELECT 1
      FROM avaliacaoclinica ac
      WHERE ac.id_utilizador_profissional = $2
        AND ac.data_avaliacao < ${tsFimQuery}
        AND ac.data_avaliacao + INTERVAL '${duracaoMin} minutes' > TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI')
    `, [tsInicio, id_utilizador]);

    if (conflitoAvaliacao.rows.length > 0) {
      return res.status(400).json({ error: "O profissional está ocupado com uma avaliação clínica nesse horário." });
    }

    // Inserir aula
    await pool.query(`
      INSERT INTO Aula (id_terapia, id_espaco, data, n_vagas, id_utilizador)
      VALUES ($1, $2, TO_TIMESTAMP($3 || ' ' || $4, 'YYYY-MM-DD HH24:MI'), $5, $6)
    `, [id_terapia, id_espaco, data, hora, n_vagas, id_utilizador]);

    return res.status(201).json({ message: "Aula criada com sucesso." });

  } catch (err) {
    console.error("Erro ao criar aula:", err);
    return res.status(500).json({ error: "Erro ao criar aula." });
  }
};

exports.getAllAulasAdmin = async (req, res) => {
  try {
    const aulas = await aulaModel.getAllAulasAdmin();
    res.json(aulas);
  } catch (err) {
    console.error('Erro ao buscar aulas admin:', err);
    res.status(500).json({ error: 'Erro ao buscar aulas' });
  }
};

exports.deleteAula = async (req, res) => {
  try {
    await aulaModel.deleteAula(req.params.id);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao apagar aula:', err);
    res.status(500).json({ error: 'Erro ao apagar aula.' });
  }
};

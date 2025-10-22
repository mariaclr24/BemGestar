const pool = require('../config/db');
const { enviarEmail } = require('../config/email');

exports.getFilaEspera = async (id_aula) => {
  const query = `
    SELECT fe.id_utilizador, u.nome, u.email, fe.data_entrada_fila, fe.prioridade
    FROM filaespera fe
    JOIN utilizador u ON u.id_utilizador = fe.id_utilizador
    WHERE fe.id_aula = $1
    ORDER BY fe.prioridade ASC, fe.data_entrada_fila ASC
  `;
  
  const result = await pool.query(query, [id_aula]);
  return result.rows;
};

exports.aulaEstaCheia = async (id_aula) => {
  const query = `
    SELECT a.vagas_ocupadas , t.n_vagas AS limite_participantes
    FROM aula a
    JOIN terapia t ON a.id_terapia = t.id_terapia
    LEFT JOIN agenda ag ON ag.id_aula = a.id_aula
    WHERE a.id_aula = $1
    GROUP BY t.n_vagas, a.vagas_ocupadas
  `;
  const result = await pool.query(query, [id_aula]);
  if (result.rows.length === 0) return false;

  const { vagas_ocupadas, limite_participantes } = result.rows[0];
  return Number(vagas_ocupadas) >= Number(limite_participantes);
};
exports.getAgendadosPorAula = async (id_aula) => {
  const result = await pool.query(`
    SELECT u.nome, u.email, ut.contacto
    FROM agenda ag
    JOIN utilizador u ON u.id_utilizador = ag.id_utilizador
    JOIN utente ut ON ut.id_utilizador = u.id_utilizador
    WHERE ag.id_aula = $1`, [id_aula]);
  return result.rows;
};


exports.getAllAulas = async () => {
  const query = `
    SELECT 
      a.id_aula,
      a.data,
      a.id_terapia,
      t.nome AS nome_terapia,
      t.descricao,
      t.valor,
      t.duracao,
      u.nome AS nome_profissional,
      e.nome AS nome_espaco,
      c.nome AS nome_clinica
    FROM aula a
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN ProfissionalSaude ps ON a.id_utilizador = ps.id_utilizador
    JOIN utilizador u ON ps.id_utilizador = u.id_utilizador
    JOIN espaco e ON a.id_espaco = e.id_espaco
    JOIN clinica c ON e.id_clinica = c.id_clinica
    ORDER BY a.data ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getAulasDoDia = async (id_utilizador) => {
  const query = `
    SELECT 
      a.id_aula,
      a.data,
      t.nome AS nome_terapia
    FROM agenda ag
    JOIN aula a ON ag.id_aula = a.id_aula
    JOIN terapia t ON a.id_terapia = t.id_terapia
    WHERE ag.id_utilizador = $1
      AND a.data::date = CURRENT_DATE
      AND a.data >= NOW() - INTERVAL '30 minutes'
      AND a.data <= NOW() + INTERVAL '2 hours'
    ORDER BY a.data
  `;
  const { rows } = await pool.query(query, [id_utilizador]);
  return rows;
};

exports.getAulasRealizadas = async (userId) => {
  const query = `
    SELECT 
      a.id_aula,
      a.data,
      t.nome AS nome_terapia,
      u.nome AS nome_profissional,
      e.nome AS nome_espaco,
      c.nome AS nome_clinica,
      ag.presente
    FROM agenda ag
    JOIN aula a ON ag.id_aula = a.id_aula
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN profissionalsaude ps ON a.id_utilizador = ps.id_utilizador
    JOIN utilizador u ON ps.id_utilizador = u.id_utilizador
    JOIN espaco e ON a.id_espaco = e.id_espaco
    JOIN clinica c ON e.id_clinica = c.id_clinica
    WHERE ag.id_utilizador = $1
    AND a.data < NOW()
    AND ag.presente = true
    ORDER BY a.data DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};
exports.getDetalhesAula = async (id_aula) => {
  const result = await pool.query(
    `SELECT a.data,
       t.nome AS terapia,
       u.nome AS profissional,
       s.caminho_arquivo AS relatorio
    FROM aula a
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN profissionalsaude p ON a.id_utilizador = p.id_utilizador
    JOIN utilizador u ON u.id_utilizador = p.id_utilizador
    LEFT JOIN participacao pa ON pa.id_aula = a.id_aula
    LEFT JOIN avaliacao_sessao s ON s.id_avaliacao = pa.id_avaliacao
    WHERE a.id_aula = $1
    LIMIT 1`,
    [id_aula]
  );

  if (result.rows.length === 0) throw new Error('Aula não encontrada.');
  return result.rows[0];
};

exports.getAulasProfissional = async (id_profissional) => {
  const query = `
    SELECT a.id_aula, a.data, t.nome AS nome_terapia,
       e.nome AS nome_espaco, c.nome AS nome_clinica,
       a.vagas_ocupadas,
       e.max_vagas AS limite_participantes
    FROM aula a
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN espaco e ON a.id_espaco = e.id_espaco
    JOIN clinica c ON e.id_clinica = c.id_clinica
    LEFT JOIN participacao p ON p.id_aula = a.id_aula
    WHERE a.id_utilizador = $1
    GROUP BY a.id_aula, t.nome, e.nome, c.nome, e.max_vagas
    ORDER BY a.data DESC;
  `;
  const result = await pool.query(query, [id_profissional]);
  return result.rows;
};
exports.getAgendados = async (userId) => {
  const query = `
    SELECT 
      a.id_aula,
      t.nome AS nome_terapia,
      t.descricao,
      a.data,
      u.nome AS nome_profissional,
      e.nome AS nome_espaco,
      c.nome AS nome_clinica,
      ag.pago
    FROM agenda ag
    JOIN aula a ON ag.id_aula = a.id_aula
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN profissionalsaude ps ON a.id_utilizador = ps.id_utilizador
    JOIN utilizador u ON ps.id_utilizador = u.id_utilizador
    JOIN espaco e ON a.id_espaco = e.id_espaco
    JOIN clinica c ON e.id_clinica = c.id_clinica
    WHERE ag.id_utilizador = $1
      AND a.data > NOW()
    ORDER BY a.data ASC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

exports.agendarAula = async (id_utilizador, id_aula) => {
  const client = await pool.connect();
  await client.query('BEGIN');

  try {
    // Obter dados da aula + número máximo de vagas
    const result = await client.query(`
      SELECT a.id_terapia, t.valor, a.data, t.duracao, t.n_vagas
      FROM aula a
      JOIN terapia t ON a.id_terapia = t.id_terapia
      WHERE a.id_aula = $1
    `, [id_aula]);

    if (result.rows.length === 0) {
      throw new Error('Aula não encontrada.');
    }

    const { id_terapia, valor, data, duracao, n_vagas } = result.rows[0];

    // Já está inscrito?
    const existe = await client.query(`
      SELECT 1 FROM agenda WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula]);

    if (existe.rows.length > 0) {
      throw new Error('Já tem esta aula agendada.');
    }

    // Verificar conflitos de horário
    const conflito = await client.query(`
      SELECT 1
      FROM agenda ag
      JOIN aula a1 ON ag.id_aula = a1.id_aula
      JOIN terapia t1 ON a1.id_terapia = t1.id_terapia
      JOIN aula a2 ON a2.id_aula = $1
      JOIN terapia t2 ON a2.id_terapia = t2.id_terapia
      WHERE ag.id_utilizador = $2
        AND a1.data < a2.data + (t2.duracao || ' minutes')::interval
        AND a1.data + (t1.duracao || ' minutes')::interval > a2.data
        AND a1.id_aula != a2.id_aula
    `, [id_aula, id_utilizador]);

    if (conflito.rows.length > 0) {
      throw new Error('Já tem outra aula nesse horário.');
    }

    // Ver saldo
    const saldoResult = await client.query(`SELECT saldo FROM utente WHERE id_utilizador = $1`, [id_utilizador]);
    const saldo = parseFloat(saldoResult.rows[0].saldo);
    let novoSaldo = saldo;
    let pago = false;

    if (saldo >= valor) {
      novoSaldo -= valor;
      pago = true;
    } else {
      novoSaldo = 0;
      pago = false;
    }

    // Contar inscritos
    const inscritosResult = await client.query(`SELECT a.vagas_ocupadas as total FROM aula a WHERE id_aula = $1`, [id_aula]);
    const inscritos = parseInt(inscritosResult.rows[0].total);

    // Aula cheia → verificar se já está na fila
    if (inscritos >= n_vagas) {
      const filaExiste = await client.query(`
        SELECT 1 FROM filaespera WHERE id_utilizador = $1 AND id_aula = $2
      `, [id_utilizador, id_aula]);

      if (filaExiste.rows.length > 0) {
        throw new Error('Já está em lista de espera para esta aula.');
      }

      // 1. Obter data da aula
    const { rows } = await client.query(`
      SELECT data FROM aula WHERE id_aula = $1
    `, [id_aula]);

    if (rows.length === 0) throw new Error('Aula não encontrada');
    const dataAula = rows[0].data;

    // 2. Inserir na fila com data_expiracao = data da aula - 24h
    await client.query(`
      INSERT INTO filaespera (id_utilizador, id_aula, data_entrada_fila, prioridade, notificado, data_expiracao)
      VALUES ($1, $2, NOW(), 0, false, $3::timestamp - INTERVAL '24 hours')
    `, [id_utilizador, id_aula, dataAula]);

      const userResult = await client.query(`SELECT nome, email FROM utilizador WHERE id_utilizador = $1`, [id_utilizador]);
      const { nome, email } = userResult.rows[0];

      await enviarEmail?.(email, 'Lista de Espera - BemGestar',
        `Olá ${nome},\n\nA aula em ${new Date(data).toLocaleString()} já está cheia.\nFoi colocada em lista de espera e será notificada caso surja uma vaga.\n\nBem-vinda à BemGestar!`);

      await client.query('COMMIT');
      return {
        em_espera: true,
        nome,
        email,
        data,
        mensagem: 'A aula está cheia. Foi colocada em lista de espera.'
      };
    }

    // Atualizar saldo
    await client.query(`UPDATE utente SET saldo = $1 WHERE id_utilizador = $2`, [novoSaldo, id_utilizador]);

    // Agendar aula
    await client.query(`
      INSERT INTO agenda (id_utilizador, id_aula, data_agendamento, pago)
      VALUES ($1, $2, NOW(), $3)
    `, [id_utilizador, id_aula, pago]);
    
    await client.query(`
  DELETE FROM filaespera WHERE id_utilizador = $1 AND id_aula = $2
`, [id_utilizador, id_aula]);

    const userResult = await client.query(`SELECT nome, email FROM utilizador WHERE id_utilizador = $1`, [id_utilizador]);
    const { nome, email } = userResult.rows[0];

    await enviarEmail?.(email, 'Confirmação de Aula - BemGestar',
      `Olá ${nome},\n\nA sua inscrição na aula em ${new Date(data).toLocaleString()} foi confirmada com sucesso.\n\nBem-vinda à BemGestar!`);

    await client.query('COMMIT');

    return {
      pago,
      falta_pagar: pago ? 0 : (valor - saldo).toFixed(2),
      nome,
      email,
      data
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.cancelarAgendamento = async (id_utilizador, id_aula) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      SELECT a.data, t.valor, ag.pago
      FROM aula a
      JOIN terapia t ON a.id_terapia = t.id_terapia
      JOIN agenda ag ON ag.id_aula = a.id_aula AND ag.id_utilizador = $1
      WHERE a.id_aula = $2
    `, [id_utilizador, id_aula]);

    if (rows.length === 0) {
      throw new Error('Aula não encontrada ou não agendada.');
    }

    const { data, valor, pago } = rows[0];
    const agora = new Date();
    const dataAula = new Date(data);

    if (dataAula - agora < 24 * 60 * 60 * 1000) {
      throw new Error('Cancelamento só permitido até 24h antes da aula.');
    }

    if (pago) {
      await client.query(`
        UPDATE utente SET saldo = saldo + $1 WHERE id_utilizador = $2
      `, [valor, id_utilizador]);
    }

    await client.query(`
      DELETE FROM agenda WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula]);

    // buscar nome e email do utilizador
    const userResult = await client.query(`
      SELECT nome, email FROM utilizador WHERE id_utilizador = $1
    `, [id_utilizador]);

    const { nome, email } = userResult.rows[0];

    await client.query('COMMIT');

    return {
      email,
      nome,
      data: dataAula
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.alterarHorario = async (id_utilizador, id_aula_atual, id_aula_nova) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const aulas = await client.query(`
      SELECT id_aula, id_terapia, data FROM aula WHERE id_aula IN ($1, $2)
    `, [id_aula_atual, id_aula_nova]);

    if (aulas.rows.length !== 2) {
      throw new Error('Uma das aulas não existe.');
    }

    const terapiaAtual = aulas.rows.find(a => a.id_aula == id_aula_atual)?.id_terapia;
    const terapiaNova = aulas.rows.find(a => a.id_aula == id_aula_nova)?.id_terapia;

    if (terapiaAtual !== terapiaNova) {
      throw new Error('As aulas não pertencem à mesma terapia.');
    }

    const dataAulaAtual = new Date(aulas.rows.find(a => a.id_aula == id_aula_atual)?.data);
    const dataAulaNova = new Date(aulas.rows.find(a => a.id_aula == id_aula_nova)?.data);

    const agora = new Date();

    if (dataAulaAtual - agora < 24 * 60 * 60 * 1000) {
      throw new Error('Alterações só são permitidas até 24h antes da aula.');
    }

    const existe = await client.query(`
      SELECT 1 FROM agenda WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula_nova]);

    if (existe.rows.length > 0) {
      throw new Error('Já tem esta aula agendada.');
    }

    const pagamento = await client.query(`
      SELECT pago FROM agenda WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula_atual]);

    const pago = pagamento.rows[0]?.pago ?? false;

    await client.query(`
      DELETE FROM agenda WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula_atual]);

    await client.query(`
      INSERT INTO agenda (id_utilizador, id_aula, data_agendamento, pago)
      VALUES ($1, $2, NOW(), $3)
    `, [id_utilizador, id_aula_nova, pago]);

    const userResult = await client.query(`
      SELECT nome, email FROM utilizador WHERE id_utilizador = $1
    `, [id_utilizador]);

    const { nome, email } = userResult.rows[0];

    await client.query('COMMIT');

    return {
      nome,
      email,
      data: dataAulaNova
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.createAula = async (id_terapia, id_espaco, data, hora, n_vagas, id_utilizador) => {
  await pool.query(`
    INSERT INTO Aula (id_terapia, id_espaco, data, n_vagas, id_utilizador)
    VALUES ($1, $2, TO_TIMESTAMP($3 || ' ' || $4, 'YYYY-MM-DD HH24:MI'), $5, $6)
  `, [id_terapia, id_espaco, data, hora, n_vagas, id_utilizador]);
};


exports.getAllAulasAdmin = async () => {
  const query = `
    SELECT 
      a.id_aula,
      a.data,
      TO_CHAR(a.data, 'HH24:MI') as hora,
      c.nome AS nome_clinica,
      e.nome AS nome_espaco,
      t.nome AS nome_terapia,
      t.n_vagas,
      u.nome AS nome_profissional,
      a.vagas_ocupadas,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id_utilizador', u2.id_utilizador, 'nome', u2.nome))
               FILTER (WHERE u2.id_utilizador IS NOT NULL), '[]') AS inscritos
    FROM Aula a
    JOIN Espaco e ON e.id_espaco = a.id_espaco
    JOIN Clinica c ON c.id_clinica = e.id_clinica
    JOIN Terapia t ON t.id_terapia = a.id_terapia
    JOIN Utilizador u ON u.id_utilizador = a.id_utilizador
    LEFT JOIN Agenda ag ON ag.id_aula = a.id_aula 
    LEFT JOIN Utilizador u2 ON ag.id_utilizador = u2.id_utilizador
    GROUP BY a.id_aula, c.nome, e.nome, t.nome, t.n_vagas, u.nome
    ORDER BY a.data ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};
exports.deleteAula = async (id) => {
  await pool.query('DELETE FROM Aula WHERE id_aula = $1', [id]);
};

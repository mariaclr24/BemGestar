const pool = require('../config/db');
async function definirTerapia(id_avaliacao, id_terapia, tipo) {
  
    await pool.query(
      `INSERT INTO definicaoterapia (id_avaliacao, id_terapia, tipo) VALUES ($1, $2, $3)`,
      [id_avaliacao, id_terapia, tipo]
    );
    return { status: "success" };
}

async function getAvaliacoes() {
    const result = await pool.query(`
      SELECT a.id_avaliacao, a.data_avaliacao, u.nome AS nome_utente
      FROM avaliacaoclinica a
      JOIN utilizador u ON a.id_utilizador_utente = u.id_utilizador
      WHERE DATE(data_avaliacao) = CURRENT_DATE
      ORDER BY data_avaliacao;
    `);
    return result.rows;
}


async function getReavaliacoesPorUtente(id_utente) {
  const query = `
    SELECT a.id_avaliacao, a.data_avaliacao, u.nome AS profissional
    FROM AvaliacaoClinica a
    JOIN ProfissionalSaude p ON a.id_utilizador_profissional = p.id_utilizador
    JOIN Utilizador u ON u.id_utilizador = p.id_utilizador
    WHERE a.id_utilizador_utente = $1
    ORDER BY a.data_avaliacao DESC
  `;
  const result = await pool.query(query, [id_utente]);
  return result.rows;
}

async function marcarReavaliacao(id_utente, data, hora) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obter id_profissional da última avaliação
    const { rows } = await client.query(`
      SELECT id_utilizador_profissional FROM AvaliacaoClinica
      WHERE id_utilizador_utente = $1
      ORDER BY data_avaliacao DESC
      LIMIT 1
    `, [id_utente]);

    if (rows.length === 0) throw new Error('Sem avaliação anterior');
    const id_profissional = rows[0].id_utilizador_profissional;

    // 2. Obter info da clínica e hora de almoço do profissional
    const result = await client.query(`
      SELECT 
        c.hora_abertura, c.hora_fecho,
        p.hora_almoco_inicio, p.hora_almoco_fim
      FROM ProfissionalSaude p
      JOIN Clinica c ON p.id_clinica = c.id_clinica
      WHERE p.id_utilizador = $1
    `, [id_profissional]);

    if (result.rows.length === 0) throw new Error('Clínica ou profissional não encontrados');

    const { hora_abertura, hora_fecho, hora_almoco_inicio, hora_almoco_fim } = result.rows[0];

    // 3. Validar horário da clínica
    if (hora < hora_abertura || hora >= hora_fecho) {
      throw new Error('Fora do horário de funcionamento da clínica');
    }

    // 4. Validar se está dentro do horário de almoço do profissional
    if (hora >= hora_almoco_inicio && hora < hora_almoco_fim) {
      throw new Error('Não é possível marcar durante a hora de almoço do profissional');
    }

    const conflitoAvaliacao = await client.query(`
    SELECT 1 FROM AvaliacaoClinica
    WHERE id_utilizador_profissional = $1
      AND DATE(data_avaliacao) = $2
      AND TO_CHAR(data_avaliacao, 'HH24:MI') = $3
  `, [id_profissional, data, hora]);

    if (conflitoAvaliacao.rowCount > 0)
      throw new Error('Profissional já tem uma avaliação marcada nesse horário');

    const conflitoAulaProf = await client.query(`
    SELECT 1 FROM Aula
    WHERE id_utilizador = $1
      AND DATE(data) = $2
      AND TO_CHAR(data, 'HH24:MI') = $3
  `, [id_profissional, data, hora]);

    if (conflitoAulaProf.rowCount > 0)
      throw new Error('Profissional está a dar uma aula nesse horário');
     
    const conflitoUtente = await client.query(`
    SELECT 1 FROM Agenda ag
    JOIN Aula a ON ag.id_aula = a.id_aula
    WHERE ag.id_utilizador = $1
      AND DATE(a.data) = $2
      AND TO_CHAR(a.data, 'HH24:MI') = $3
  `, [id_utente, data, hora]);

    if (conflitoUtente.rowCount > 0)
      throw new Error('Já tens uma aula marcada nesse horário');

    // 7. Marcar reavaliação
    const dataHora = `${data}T${hora}`; // ex: 2025-06-01T15:30

await client.query(`
  INSERT INTO AvaliacaoClinica (id_utilizador_utente, id_utilizador_profissional, data_avaliacao)
  VALUES ($1, $2, $3)
`, [id_utente, id_profissional, dataHora]);

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


module.exports = {
  getReavaliacoesPorUtente,
  marcarReavaliacao,
   getAvaliacoes,
  definirTerapia,
};

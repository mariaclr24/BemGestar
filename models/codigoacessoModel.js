const pool = require('../config/db');

async function criarCodigoAcesso(data) {
  const {
    nome, email, estado, semanas_gestacao, nif, data_nascimento, id_profissional,
    terapias_recomendadas = [],
    terapias_nao_recomendadas = [],
    terapias_proibidas = []
  } = data;

  const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resAvaliacaoTemp = await client.query(`
      INSERT INTO avaliacao_temp (nome, email, estado, semanas_gestacao, nif, data_nascimento, id_profissional)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_temp
    `, [nome, email, estado, semanas_gestacao, nif, data_nascimento, id_profissional]);

    const id_temp = resAvaliacaoTemp.rows[0].id_temp;

    const insertTerapiaText = `
      INSERT INTO DefinicaoTerapiaTemp (id_temp, id_terapia, tipo)
      VALUES ($1, $2, $3)
    `;

    for (const tId of terapias_recomendadas) {
      await client.query(insertTerapiaText, [id_temp, tId, 'recomendada']);
    }
    for (const tId of terapias_nao_recomendadas) {
      await client.query(insertTerapiaText, [id_temp, tId, 'nao_recomendada']);
    }
    for (const tId of terapias_proibidas) {
      await client.query(insertTerapiaText, [id_temp, tId, 'proibida']);
    }

    await client.query(`
      INSERT INTO codigoacesso (codigo, id_temp, utilizado, data_validade)
      VALUES ($1, $2, false, CURRENT_DATE + INTERVAL '30 days')
    `, [codigo, id_temp]);

    await client.query('COMMIT');

    return { codigo, validade: '30 dias', id_temp };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  criarCodigoAcesso
};

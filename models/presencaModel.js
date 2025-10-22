const pool = require('../config/db');

exports.marcarPresenca = async (id_utilizador, id_aula) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT a.data, t.duracao
      FROM aula a
      JOIN terapia t ON a.id_terapia = t.id_terapia
      WHERE a.id_aula = $1
    `, [id_aula]);

    if (result.rows.length === 0) throw new Error('Aula não encontrada.');

    const { data, duracao } = result.rows[0];
    const agora = new Date();
    const inicio = new Date(data.getTime() - 15 * 60000);
    const fim = new Date(data.getTime() + (duracao + 15) * 60000);

    if (agora < inicio || agora > fim) {
      throw new Error('Só pode marcar presença durante o horário permitido.');
    }

    // Atualiza a agenda
    await client.query(`
      UPDATE agenda
      SET presente = true
      WHERE id_utilizador = $1 AND id_aula = $2
    `, [id_utilizador, id_aula]);

    // Insere a participação (sem biosinal e sem avaliação no início)
    await client.query(`
      INSERT INTO participacao (id_utilizador, id_aula, presente)
      VALUES ($1, $2, true)
      ON CONFLICT (id_utilizador, id_aula) DO NOTHING
    `, [id_utilizador, id_aula]);

  } finally {
    client.release();
  }
};

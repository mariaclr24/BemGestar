const pool = require('../config/db');
const bcrypt = require('bcrypt');

const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    "SELECT id_utilizador, email, senha, tipo_utilizador FROM utilizador WHERE email = $1",
    [email]
  );
  return rows[0];
};

const createUser = async (temp, senha, contacto, contacto_emergencia, codigo) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const profissionalId = temp.id_profissional; // ✅ corresponde ao nome na tabela

    const { rows: codigoRows } = await client.query(
      `SELECT * FROM CodigoAcesso WHERE codigo = $1 AND utilizado = false AND data_validade >= CURRENT_DATE`,
      [codigo]
    );

    if (codigoRows.length === 0) {
      throw new Error('Código inválido ou expirado.');
    }

    const id_temp = codigoRows[0].id_temp;

    const { rows: existing } = await client.query(
      `SELECT 1 FROM Utilizador WHERE email = $1`,
      [temp.email]
    );

    if (existing.length > 0) {
      throw new Error('Este utilizador já se encontra registado.');
    }

    const hash = await bcrypt.hash(senha, 10);
    const { rows: userRows } = await client.query(
      `INSERT INTO Utilizador (nome, email, senha, tipo_utilizador, ativo)
       VALUES ($1, $2, $3, 'utente', true) RETURNING id_utilizador`,
      [temp.nome, temp.email, hash]
    );

    const id_utilizador = userRows[0].id_utilizador;

    await client.query(
      `INSERT INTO Utente (
        id_utilizador, estado, semanas_gestacao, nif, data_nascimento, saldo, contacto, contacto_emergencia
      ) VALUES ($1, $2, $3, $4, $5, 0.00, $6, $7)`,
      [
        id_utilizador,
        temp.estado,
        temp.semanas_gestacao,
        temp.nif,
        temp.data_nascimento,
        contacto,
        contacto_emergencia
      ]
    );
    const { rows: avaliacaoRows } = await client.query(
  `INSERT INTO AvaliacaoClinica (
    id_utilizador_profissional, id_utilizador_utente, data_avaliacao
  ) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id_avaliacao`,
  [temp.id_profissional, id_utilizador]
    );


    const id_avaliacao = avaliacaoRows[0].id_avaliacao;

    await client.query(
      `INSERT INTO DefinicaoTerapia (id_avaliacao, id_terapia, tipo)
       SELECT $1, id_terapia, tipo FROM DefinicaoTerapiaTemp WHERE id_temp = $2`,
      [id_avaliacao, id_temp]
    );

    await client.query(
      `UPDATE CodigoAcesso SET utilizado = true WHERE codigo = $1`,
      [codigo]
    );

    await client.query(`DELETE FROM DefinicaoTerapiaTemp WHERE id_temp = $1`, [id_temp]);
    await client.query(`DELETE FROM avaliacao_temp WHERE id_temp = $1`, [id_temp]);

    await client.query('COMMIT');

    return true;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getTempAvaliation = async (codigo) => {
  const { rows: codigoRows } = await pool.query(
    `SELECT id_temp FROM CodigoAcesso WHERE codigo = $1 AND utilizado = false AND data_validade >= CURRENT_DATE`,
    [codigo]
  );

  if (codigoRows.length === 0) {
    throw new Error('Código inválido, expirado ou já utilizado.');
  }

  const id_temp = codigoRows[0].id_temp;

  const { rows: avaliacaoRows } = await pool.query(
    `SELECT nome, email, estado, semanas_gestacao, nif, data_nascimento, id_profissional FROM avaliacao_temp WHERE id_temp = $1`,
    [id_temp]
  );

  if (avaliacaoRows.length === 0) {
    throw new Error('Avaliação associada não encontrada.');
  }

  return avaliacaoRows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
  getTempAvaliation,
};

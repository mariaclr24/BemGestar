const pool = require('../config/db');

exports.getTerapias = async () => {
  const query = `
    SELECT t.*, u.nome AS profissional, pt.id_utilizador AS id_profissional
    FROM Terapia t
    LEFT JOIN ProfissionalTerapia pt ON pt.id_terapia = t.id_terapia
    LEFT JOIN Utilizador u ON pt.id_utilizador = u.id_utilizador
    ORDER BY t.id_terapia;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getallterapias = async () => {
  const query = `
    SELECT *
    FROM Terapia 
    ORDER BY id_terapia;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getTerapiaById = async (id) => {
  const query = `
    SELECT t.*, pt.id_utilizador AS id_profissional
    FROM Terapia t
    LEFT JOIN ProfissionalTerapia pt ON pt.id_terapia = t.id_terapia
    WHERE t.id_terapia = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

exports.createTerapia = async (t) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO Terapia (nome, descricao, n_vagas, duracao, valor)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_terapia
    `, [t.nome, t.descricao, t.n_vagas, t.duracao, t.valor]);

    const id = result.rows[0].id_terapia;

    await client.query(`
      INSERT INTO ProfissionalTerapia (id_utilizador, id_terapia)
      VALUES ($1, $2)
    `, [t.id_profissional, id]);

    await client.query('COMMIT');
    return id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.updateTerapia = async (id, t) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE Terapia
      SET nome = $1, descricao = $2, n_vagas = $3, duracao = $4, valor = $5
      WHERE id_terapia = $6
    `, [t.nome, t.descricao, t.n_vagas, t.duracao, t.valor, id]);

    await client.query(`DELETE FROM ProfissionalTerapia WHERE id_terapia = $1`, [id]);
    await client.query(`
      INSERT INTO ProfissionalTerapia (id_utilizador, id_terapia)
      VALUES ($1, $2)
    `, [t.id_profissional, id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.deleteTerapia = async (id) => {
  await pool.query('DELETE FROM Terapia WHERE id_terapia = $1', [id]);
};

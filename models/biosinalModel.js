// models/biosinalModel.js
const pool = require('../config/db');

exports.inserirBiosinal = async (tipo, caminho_arquivo, id_aula, id_utilizador) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Inserir o biosinal
    const res = await client.query(`
      INSERT INTO biosinal (tipo, caminho_arquivo)
      VALUES ($1, $2)
      RETURNING id_biosinal
    `, [tipo, caminho_arquivo]);

    const id_biosinal = res.rows[0].id_biosinal;

    // Atualizar a participação com o biosinal
    await client.query(`
      UPDATE participacao
      SET id_biosinal = $1
      WHERE id_utilizador = $2 AND id_aula = $3
    `, [id_biosinal, id_utilizador, id_aula]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.verificarBiosinal = async (id_utilizador, id_aula) => {
  const result = await pool.query(
    'SELECT id_biosinal FROM participacao WHERE id_utilizador = $1 AND id_aula = $2 AND id_biosinal IS NOT NULL',
    [id_utilizador, id_aula]
  );
  return result.rowCount > 0;
};


exports.getCaminhoBiosinal = async (id_utilizador, id_aula) => {
  const query = `
    SELECT b.caminho_arquivo
    FROM participacao p
    JOIN biosinal b ON b.id_biosinal = p.id_biosinal
    WHERE p.id_utilizador = $1 AND p.id_aula = $2
  `;

  const result = await pool.query(query, [id_utilizador, id_aula]);
  return result.rows[0]?.caminho_arquivo || null;
};

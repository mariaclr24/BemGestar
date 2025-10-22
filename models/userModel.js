const pool = require('../config/db');

async function getAllUsersSeparated() {
  const profissionaisQuery = `
  SELECT 
    u.id_utilizador, 
    u.nome, 
    u.email, 
    'profissional' AS tipo,
    ps.especialidade,
    c.nome AS clinica,
    u.ativo
  FROM utilizador u
  JOIN profissionalsaude ps ON u.id_utilizador = ps.id_utilizador
  LEFT JOIN clinica c ON ps.id_clinica = c.id_clinica
  ORDER BY u.nome
`;

 const utentesQuery = `
  SELECT 
    u.id_utilizador, 
    u.nome, 
    u.email, 
    'utente' AS tipo,
    ut.estado, 
    u.ativo,
    ps.nome AS profissional_responsavel
  FROM utilizador u
  JOIN utente ut ON u.id_utilizador = ut.id_utilizador
  LEFT JOIN avaliacaoclinica ac ON ac.id_utilizador_utente = u.id_utilizador
  LEFT JOIN utilizador ps ON ps.id_utilizador = ac.id_utilizador_profissional
  WHERE ac.id_avaliacao = (
    SELECT MAX(id_avaliacao)
    FROM avaliacaoclinica
    WHERE id_utilizador_utente = u.id_utilizador
  )
  ORDER BY u.nome
`;

  const profissionaisRes = await pool.query(profissionaisQuery);
  const utentesRes = await pool.query(utentesQuery);

  return {
    profissionais: profissionaisRes.rows,
    utentes: utentesRes.rows
  };
}
async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM utilizador WHERE email = $1', [email]);
  return result.rows[0];
}

async function updatePassword(userId, hashedPassword) {
  await pool.query('UPDATE utilizador SET senha = $1 WHERE id_utilizador = $2', [hashedPassword, userId]);
}


const toggleActive = async (id, ativo) => {
  await pool.query('UPDATE utilizador SET ativo = $1 WHERE id_utilizador = $2', [ativo, id]);
};

const deleteUser = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM agenda WHERE id_utilizador = $1', [id]);
    await client.query('DELETE FROM avaliacaoclinica WHERE id_utilizador_utente = $1 OR id_utilizador_profissional = $1', [id]);
    await client.query('DELETE FROM utente WHERE id_utilizador = $1', [id]);
    await client.query('DELETE FROM profissionalsaude WHERE id_utilizador = $1', [id]);
    await client.query('DELETE FROM utilizador WHERE id_utilizador = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getUserById = async (id) => {
  const query = `
    SELECT u.nome, u.email, u.tipo_utilizador, ut.data_nascimento, ut.estado, ut.semanas_gestacao, ut.saldo, ut.nif, ut.contacto_emergencia, ut.contacto
    FROM utilizador u
    LEFT JOIN utente ut ON u.id_utilizador = ut.id_utilizador
    WHERE u.id_utilizador = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const updateUser = async (id, nome, email, contacto, contacto_emergencia, novaSenha, senhaAtual) => {
  const { rows } = await pool.query(
    'SELECT u.*, ut.contacto, ut.contacto_emergencia FROM utilizador u LEFT JOIN utente ut ON u.id_utilizador = ut.id_utilizador WHERE u.id_utilizador = $1',
    [id]
  );
  if (rows.length === 0) throw new Error('Utilizador não encontrado.');
  const utilizador = rows[0];
  let senhaHash = utilizador.senha;

  if (novaSenha) {
    if (!senhaAtual) throw new Error('É necessário fornecer a palavra-passe atual.');
    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(senhaAtual, utilizador.senha);
    if (!match) throw new Error('Palavra-passe atual incorreta.');
    senhaHash = await bcrypt.hash(novaSenha, 10);
  }

  await pool.query(
    `UPDATE utilizador SET 
       nome = COALESCE($1, nome), 
       email = COALESCE($2, email), 
       senha = $3 
     WHERE id_utilizador = $4`,
    [nome || utilizador.nome, email || utilizador.email, senhaHash, id]
  );

  await pool.query(
    `UPDATE utente SET 
       contacto = COALESCE($1, contacto), 
       contacto_emergencia = COALESCE($2, contacto_emergencia)
     WHERE id_utilizador = $3`,
    [contacto || utilizador.contacto, contacto_emergencia || utilizador.contacto_emergencia, id]
  );
};

const changePassword = async (id, senhaAtual, novaSenha) => {
  const { rows } = await pool.query('SELECT senha FROM utilizador WHERE id_utilizador = $1', [id]);
  if (rows.length === 0) throw new Error('Utilizador não encontrado.');
  const bcrypt = require('bcrypt');
  const match = await bcrypt.compare(senhaAtual, rows[0].senha);
  if (!match) throw new Error('Palavra-passe atual incorreta.');
  const novaHash = await bcrypt.hash(novaSenha, 10);
  await pool.query('UPDATE utilizador SET senha = $1 WHERE id_utilizador = $2', [novaHash, id]);
};

const getTerapiasUtente = async (id) => {
  const query = `
    SELECT t.nome AS nome_terapia, dt.tipo
    FROM DefinicaoTerapia dt
    JOIN AvaliacaoClinica ac ON dt.id_avaliacao = ac.id_avaliacao
    JOIN Terapia t ON dt.id_terapia = t.id_terapia
    WHERE ac.id_utilizador_utente = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows;
};

const getAllUtentesWithTerapias = async () => {
  const query = `
    SELECT 
      u.id_utilizador,
      u.nome,
      u.email,
      ut.data_nascimento,
      ut.estado,
      ut.semanas_gestacao,
      ut.nif,
      ut.contacto,
      ut.contacto_emergencia,
      DATE_PART('year', AGE(ut.data_nascimento)) AS idade,
      COALESCE(
        json_agg(
          json_build_object('nome_terapia', t.nome, 'tipo', dt.tipo)
        ) FILTER (WHERE t.id_terapia IS NOT NULL),
        '[]'
      ) AS terapias_permitidas
    FROM utilizador u
    JOIN utente ut ON u.id_utilizador = ut.id_utilizador
    LEFT JOIN avaliacaoclinica ac ON ut.id_utilizador = ac.id_utilizador_utente
    LEFT JOIN definicaoterapia dt ON dt.id_avaliacao = ac.id_avaliacao
    LEFT JOIN terapia t ON dt.id_terapia = t.id_terapia
    GROUP BY u.id_utilizador, ut.data_nascimento, ut.estado, ut.semanas_gestacao, ut.nif, ut.contacto, ut.contacto_emergencia
    ORDER BY u.nome;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  toggleActive,
  deleteUser,
  getUserById,
  updateUser,
  changePassword,
  getTerapiasUtente,
  getAllUsersSeparated,
  getAllUtentesWithTerapias,
  findUserByEmail,
  updatePassword,
};

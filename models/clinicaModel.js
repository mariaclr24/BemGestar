const pool = require('../config/db');
exports.addClinica = async (nome, localizacao, hora_abertura, hora_fecho, dias_funcionamento) => {
  await pool.query(`
    INSERT INTO clinica (nome, localizacao, hora_abertura, hora_fecho, dias_funcionamento)
    VALUES ($1, $2, $3, $4, $5)
  `, [nome, localizacao, hora_abertura, hora_fecho, dias_funcionamento]);
};

exports.getClinicas = async () => {
  const result = await pool.query('SELECT * FROM clinica ORDER BY id_clinica');
  return result.rows;
};

exports.updateClinica = async (id, nome, localizacao, hora_abertura, hora_fecho, dias_funcionamento) => {
  await pool.query(`
    UPDATE clinica SET nome = $1, localizacao = $2, hora_abertura = $3, hora_fecho = $4, dias_funcionamento = $5
    WHERE id_clinica = $6
  `, [nome, localizacao, hora_abertura, hora_fecho, dias_funcionamento, id]);
};

exports.deleteClinica = async (id) => {
  await pool.query('DELETE FROM clinica WHERE id_clinica = $1', [id]);
};

exports.getEspacos = async (id) => {
  const result = await pool.query('SELECT * FROM espaco WHERE id_clinica = $1 ORDER BY id_espaco', [id]);
  return result.rows;
};

exports.addEspaco = async (idClinica, nome, max_vagas) => {
  await pool.query(
    'INSERT INTO espaco (nome, max_vagas, id_clinica) VALUES ($1, $2, $3)',
    [nome, max_vagas, idClinica]
  );
};

exports.updateEspaco = async (id, nome, max_vagas) => {
  await pool.query(
    'UPDATE espaco SET nome = $1, max_vagas = $2 WHERE id_espaco = $3',
    [nome, max_vagas, id]
  );
};

exports.deleteEspaco = async (id) => {
  await pool.query('DELETE FROM espaco WHERE id_espaco = $1', [id]);
};

exports.getClinicasSimples = async () => {
  const r = await pool.query('SELECT id_clinica, nome FROM clinica');
  return r.rows;
};

exports.getEspacosSimples = async () => {
  const r = await pool.query('SELECT id_espaco, nome FROM espaco');
  return r.rows;
};

exports.getTerapiasSimples = async () => {
  const r = await pool.query('SELECT id_terapia, nome FROM terapia');
  return r.rows;
};

exports.getProfissionaisSimples = async () => {
  const r = await pool.query(`
    SELECT ps.id_utilizador, u.nome
    FROM ProfissionalSaude ps
    JOIN Utilizador u ON u.id_utilizador = ps.id_utilizador
  `);
  return r.rows;
};

exports.getAulasDisponiveis = async (idUtente) => {
  const result = await pool.query(`
    SELECT 
      a.id_aula,
      a.data,
      TO_CHAR(a.data, 'HH24:MI') AS hora,
      t.nome AS terapia,
      u.nome AS profissional,
      e.nome AS espaco,
      c.nome AS clinica,
      t.duracao,
      t.valor,
      dt.tipo,
      COUNT(ag.id_utilizador) AS vagas_preenchidas,
      t.n_vagas
    FROM Aula a
    JOIN Terapia t ON t.id_terapia = a.id_terapia
    JOIN Espaco e ON e.id_espaco = a.id_espaco
    JOIN Clinica c ON c.id_clinica = e.id_clinica
    JOIN Utilizador u ON u.id_utilizador = a.id_utilizador
    JOIN AvaliacaoClinica ac ON ac.id_utilizador_utente = $1
    JOIN DefinicaoTerapia dt ON dt.id_avaliacao = ac.id_avaliacao AND dt.id_terapia = t.id_terapia
    LEFT JOIN Agenda ag ON ag.id_aula = a.id_aula
    WHERE 
      a.data >= NOW()
      AND dt.tipo != 'proibida'
    GROUP BY a.id_aula, t.nome, u.nome, e.nome, c.nome, t.duracao, t.valor, dt.tipo, t.n_vagas
    HAVING COUNT(ag.id_utilizador) < t.n_vagas
    ORDER BY a.data ASC;
  `, [idUtente]);
  return result.rows;
};

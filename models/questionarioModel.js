const pool = require('../config/db');
exports.jaRespondeu = async (id_utilizador, id_aula) => {
  const res = await pool.query(
    `SELECT 1 FROM resposta_questionario WHERE id_utilizador = $1 AND id_aula = $2`,
    [id_utilizador, id_aula]
  );
  return res.rowCount > 0;
};
exports.obterResposta = async (id_utilizador, id_aula) => {
  const { rows } = await pool.query(`
    SELECT * FROM resposta_questionario
    WHERE id_utilizador = $1 AND id_aula = $2
  `, [id_utilizador, id_aula]);

  return rows[0];
};

exports.inserirResposta = async (id_utilizador, dados) => {
  const {
    id_aula,
    classificacao_geral,
    aula_foi_clara,
    acompanhou_profissional,
    colocou_duvidas,
    ajudou_bem_estar,
    contribuicao_positiva,
    nivel_esforco,
    dor_muscular,
    sentiu_desconforto,
    fadiga,
    coordenacao,
    equilibrio,
    comentarios
  } = dados;

  
  await pool.query(
    `INSERT INTO resposta_questionario (
      id_aula, id_utilizador, classificacao_geral, aula_foi_clara,
      acompanhou_profissional, colocou_duvidas,
      ajudou_bem_estar, contribuicao_positiva, nivel_esforco,
      dor_muscular, sentiu_desconforto, fadiga, coordenacao, equilibrio, comentarios
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      id_aula, id_utilizador, classificacao_geral, aula_foi_clara === 'true',
      acompanhou_profissional === 'true', colocou_duvidas,
      ajudou_bem_estar, contribuicao_positiva, nivel_esforco,
      dor_muscular === 'true', sentiu_desconforto === 'true',
      fadiga, coordenacao, equilibrio === 'true', comentarios
    ]
  );
};

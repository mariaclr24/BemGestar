// models/avaliacaoSessaoModel.js

const pool = require('../config/db');

exports.getParticipantesPresentes = async (id_aula) => {
  const result = await pool.query(`
    SELECT u.id_utilizador, u.nome, u.email,
       EXISTS (
         SELECT 1 FROM resposta_questionario q 
         WHERE q.id_utilizador = u.id_utilizador AND q.id_aula = $1
       ) AS questionario,
       EXISTS (
         SELECT 1 FROM biosinal b 
         WHERE b.id_biosinal = p.id_biosinal AND p.id_biosinal IS NOT NULL
       ) AS biosinal
    FROM participacao p
    JOIN utilizador u ON u.id_utilizador = p.id_utilizador
    WHERE p.id_aula = $1 AND p.presente = true
  `, [id_aula]);

  return result.rows;
};

exports.submeterAvaliacaoSessao = async (id_utilizador, id_aula, caminho) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica se já existe avaliação
    const check = await client.query(`
      SELECT id_avaliacao
      FROM participacao
      WHERE id_utilizador = $1 AND id_aula = $2 AND id_avaliacao IS NOT NULL
    `, [id_utilizador, id_aula]);

    if (check.rows.length > 0) {
      const id_avaliacao = check.rows[0].id_avaliacao;

      // Atualiza o caminho no mesmo registo
      await client.query(`
        UPDATE avaliacao_sessao
        SET caminho_arquivo = $1
        WHERE id_avaliacao = $2
      `, [caminho, id_avaliacao]);

    } else {
      // Cria nova avaliação
      const nova = await client.query(`
        INSERT INTO avaliacao_sessao (caminho_arquivo)
        VALUES ($1)
        RETURNING id_avaliacao
      `, [caminho]);

      const id_avaliacao = nova.rows[0].id_avaliacao;

      await client.query(`
        UPDATE participacao
        SET id_avaliacao = $1
        WHERE id_utilizador = $2 AND id_aula = $3
      `, [id_avaliacao, id_utilizador, id_aula]);
    }

    await client.query('COMMIT');
    return 'Avaliação submetida com sucesso.';
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.getAvaliacaoExistente = async (id_utilizador, id_aula) => {
  const result = await pool.query(`
    SELECT caminho_arquivo
    FROM avaliacao_sessao s
    JOIN participacao p ON p.id_avaliacao = s.id_avaliacao
    WHERE p.id_utilizador = $1 AND p.id_aula = $2
  `, [id_utilizador, id_aula]);

  return result.rows[0]?.caminho_arquivo || null;
};

exports.getResumoAula = async (id_aula) => {
  const result = await pool.query(`
    SELECT a.data, t.nome AS nome_terapia, e.nome AS nome_espaco
    FROM aula a
    JOIN terapia t ON a.id_terapia = t.id_terapia
    JOIN espaco e ON a.id_espaco = e.id_espaco
    WHERE a.id_aula = $1
  `, [id_aula]);

  return result.rows[0];
};

exports.getRespostasQuestionario = async (id_aula, id_utilizador) => {
  const result = await pool.query(`
    SELECT
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
    FROM resposta_questionario
    WHERE id_aula = $1 AND id_utilizador = $2
  `, [id_aula, id_utilizador]);

  return result.rows[0] || null;
};

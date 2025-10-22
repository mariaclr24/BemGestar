const cron = require('node-cron');
const pool = require('./db');
const { enviarEmail } = require('./email');

cron.schedule('0 10 * * *', async () => {
  try {
    const query = `
      SELECT a.id_utilizador_utente, u.nome, u.email
      FROM AvaliacaoClinica a
      JOIN (
        SELECT id_utilizador_utente, MAX(data_avaliacao) AS ultima_avaliacao
        FROM AvaliacaoClinica
        GROUP BY id_utilizador_utente
      ) ult ON ult.id_utilizador_utente = a.id_utilizador_utente
        AND a.data_avaliacao = ult.ultima_avaliacao
      JOIN Utilizador u ON u.id_utilizador = a.id_utilizador_utente
      WHERE CURRENT_DATE >= a.data_avaliacao::date + INTERVAL '27 days'
        AND CURRENT_DATE < a.data_avaliacao::date + INTERVAL '30 days';
    `;

    const { rows } = await pool.query(query);

    for (const utente of rows) {
      // envia email
      await enviarEmail(
        utente.email,
        'Reavaliação Clínica - BemGestar',
        `Olá ${utente.nome},

        Está a aproximar-se a data da sua reavaliação clínica (30 dias desde a última).

        Por favor, aceda à plataforma para agendar a nova avaliação.

        Com os melhores cumprimentos,  
        Equipa BemGestar`
        );


      // regista no histórico de notificações
      await pool.query(`
        INSERT INTO Notificacao (id_utilizador, assunto, mensagem, data_envio)
        VALUES ($1, $2, $3, NOW())
      `, [
        utente.id_utilizador_utente,
        'Reavaliação Clínica',
        `Foi enviada uma notificação de reavaliação clínica para ${utente.email}.`
      ]);
    }

    console.log(`[CRON] ${rows.length} notificações de reavaliação geradas e enviadas por email.`);
  } catch (err) {
    console.error('[CRON] Erro ao enviar notificações:', err.message);
  }
});

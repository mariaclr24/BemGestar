const cron = require('node-cron');
const pool = require('./db');
const { enviarEmail } = require('./email');

cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Verificação de inscrições não pagas...');

  try {
    const result = await pool.query(`
      SELECT a.id_agenda, a.id_utilizador, a.id_aula, u.email, u.nome
      FROM agenda a
      JOIN utilizador u ON u.id_utilizador = a.id_utilizador
      WHERE a.pago = false
        AND a.data_agendamento <= NOW() - INTERVAL '2 hours'
    `);

    for (const row of result.rows) {
      await pool.query('DELETE FROM agenda WHERE id_agenda = $1', [row.id_agenda]);

      const assunto = 'Perda de Vaga - BemGestar';
      const mensagem = `Olá ${row.nome},

A tua inscrição na aula (ID: ${row.id_aula}) foi removida automaticamente por falta de pagamento no prazo de 2 horas.

Se ainda desejares participar, volta a entrar na lista de espera através da plataforma.

Com os melhores cumprimentos,  
Equipa BemGestar`;

      await enviarEmail(row.email, assunto, mensagem);

      await pool.query(`
        INSERT INTO notificacao (id_utilizador, assunto, mensagem)
        VALUES ($1, $2, $3)
      `, [row.id_utilizador, assunto, mensagem]);

      console.log(`→ Removido ${row.id_agenda} e notificado ${row.email}`);
    }

    console.log(`[CRON] ${result.rows.length} inscrições expiradas processadas.`);
  } catch (err) {
    console.error('[CRON] Erro ao processar inscrições expiradas:', err.message);
  }
});

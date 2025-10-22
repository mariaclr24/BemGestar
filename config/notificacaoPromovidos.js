
// notificacaoPromovidos.js
const cron = require('node-cron');
const pool = require('./db');
const { enviarEmail } = require('./email');

// Corre a cada 5 minutos para notificar utentes promovidos da fila
cron.schedule('* * * * *', async () => {
  console.log('[CRON] A verificar utentes promovidos para envio de notificação e email...');

  try {
    const { rows } = await pool.query(`
      SELECT ag.id_agenda, ag.id_utilizador, ag.id_aula, ag.data_agendamento, u.email, u.nome
      FROM agenda ag
      JOIN utilizador u ON u.id_utilizador = ag.id_utilizador
      WHERE ag.pago = false
        AND NOT EXISTS (
          SELECT 1 FROM notificacao n
          WHERE n.id_utilizador = ag.id_utilizador
            AND n.assunto = 'Promoção da Fila de Espera'
            AND n.data_envio >= ag.data_agendamento
        )
        AND EXISTS (
          SELECT 1 FROM filaespera f
          WHERE f.id_utilizador = ag.id_utilizador
            AND f.id_aula = ag.id_aula
        )
    `);

    for (const utente of rows) {
      const mensagem = `Olá ${utente.nome}, conseguiste uma vaga na aula!
Tens 2 horas para realizar o pagamento, ou a vaga será automaticamente cancelada.`;

      const linkPagamento = `https://localhost:3000/pagamento.html?id_agenda=${utente.id_agenda}`;

      // 1. Notificação na base de dados
      await pool.query(`
        INSERT INTO notificacao (id_utilizador, assunto, mensagem)
        VALUES ($1, $2, $3)
      `, [
        utente.id_utilizador,
        'Promoção da Fila de Espera',
        mensagem + '\nLink de pagamento: ' + linkPagamento
      ]);

      await enviarEmail(
      utente.email,
      'Promoção da Fila de Espera - BemGestar',
      `Olá ${utente.nome},

      Conseguiste uma vaga na aula!  
      Tens 2 horas para realizar o pagamento, ou a vaga será automaticamente cancelada.

      Faz o pagamento aqui: ${linkPagamento}

      Com os melhores cumprimentos,  
      Equipa BemGestar`
      );


      // 3. Remover da fila de espera
      await pool.query(`
        DELETE FROM filaespera
        WHERE id_utilizador = $1 AND id_aula = $2
      `, [utente.id_utilizador, utente.id_aula]);

      console.log(`→ Email enviado e notificação registada para ${utente.nome} (${utente.email})`);
    }

    console.log(`[CRON] ${rows.length} utentes promovidos notificados.`);
  } catch (err) {
    console.error('[CRON] Erro ao processar utentes promovidos:', err.message);
  }
});

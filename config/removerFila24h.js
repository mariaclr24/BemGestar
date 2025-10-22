const cron = require('node-cron');
const pool = require('./db');
const { enviarEmail } = require('./email');

cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Remoção de utentes da fila de espera com menos de 24h...');

  try {
    const result = await pool.query(`
      DELETE FROM filaespera f
      USING aula a, utilizador u
      WHERE f.id_aula = a.id_aula
        AND f.id_utilizador = u.id_utilizador
        AND a.data <= NOW() + INTERVAL '24 hours'
        AND f.data_expiracao > NOW()
      RETURNING f.id_utilizador, f.id_aula, u.email, u.nome
    `);

    for (const r of result.rows) {
      const assunto = 'Remoção da Fila de Espera - BemGestar';
      const mensagem = `Olá ${r.nome},

Faltam menos de 24 horas para a aula (ID: ${r.id_aula}), e não foi possível inscrever-te a tempo.

Foste removido da lista de espera desta sessão.

Poderás tentar agendar outra aula similar ou falar com o teu profissional.

Com os melhores cumprimentos,  
Equipa BemGestar`;

      await enviarEmail(r.email, assunto, mensagem);

      await pool.query(`
        INSERT INTO notificacao (id_utilizador, assunto, mensagem)
        VALUES ($1, $2, $3)
      `, [r.id_utilizador, assunto, mensagem]);

      console.log(`→ Utente ${r.id_utilizador} removido da fila da aula ${r.id_aula} e notificado.`);
    }

    console.log(`[CRON] ${result.rowCount} utentes removidos da fila.`);
  } catch (err) {
    console.error('[CRON] Erro ao remover da fila:', err.message);
  }
});
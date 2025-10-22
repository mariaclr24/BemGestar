const cron = require('node-cron');
const pool = require('../config/db');

async function executarLimpeza() {
  const client = await pool.connect();
  try {
    await client.query('SELECT eliminar_nao_registados()');
    console.log('Limpeza de registros não validados executada com sucesso:', new Date());
  } catch (err) {
    console.error('Erro ao executar limpeza de registros não validados:', err);
  } finally {
    client.release();
  }
}

// Agenda para rodar todos os dias à meia-noite
function iniciarCronJobs() {
  cron.schedule('0 0 * * *', () => {
    console.log('Executando limpeza diária de registros não validados...');
    executarLimpeza();
  });
  
  console.log('Cron jobs agendados');
}

module.exports = iniciarCronJobs;
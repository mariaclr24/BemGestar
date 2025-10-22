const express = require('express');
const path = require('path');
const app = express();
const port = 3000

const iniciarCronJobs = require('./config/verificarCodigo.js');
iniciarCronJobs();

require('dotenv').config();
require('./config/notificacoesReavaliacao.js');
require('./config/notificacaoPromovidos.js');
require('./config/verificarPagamentos.js');
require('./config/removerFila24h.js');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importar rotas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const aulaRoutes = require('./routes/aulaRoutes');
const clinicaRoutes = require('./routes/clinicaRoutes');
const presencaRoutes = require('./routes/presencaRoutes');
const qrcodeRoutes = require('./routes/qrcodeRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const codigoAcessoRoutes = require('./routes/codigoacessoRoutes');
const passwordRoutes = require('./routes/passRoutes');
const reavaliacaoRoutes = require('./routes/reavaliacaoRoutes');
const questionarioRoutes = require('./routes/questionarioRoutes');
const terapiaRoutes = require('./routes/terapiaRoutes');
const avaliacaoSessaoRoutes = require('./routes/avaliacaoSessaoRoutes');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/resultados', express.static(path.join(__dirname, 'resultados')));
app.use(express.static(path.join(__dirname, 'public')));

// Usar rotas
app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', aulaRoutes);
app.use('/api', clinicaRoutes);
app.use('/api', presencaRoutes);
app.use('/api', qrcodeRoutes);
app.use('/api', profissionalRoutes);
app.use('/api', codigoAcessoRoutes);
app.use('/api', passwordRoutes);
app.use('/api', terapiaRoutes);
app.use('/api', reavaliacaoRoutes);
app.use('/api', questionarioRoutes);
app.use('/api', avaliacaoSessaoRoutes);
// Teste ligação à base de dados
const pool = require('./config/db.js');
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.send("A base de dados ativa é: " + result.rows[0].current_database);
  } catch (err) {
    console.error("Erro ao ligar à base de dados:", err);
    res.status(500).send("Erro ao ligar à base de dados");
  }
});

app.listen(port, () => {
  console.log(`Servidor a correr em http://localhost:${port}`);
});

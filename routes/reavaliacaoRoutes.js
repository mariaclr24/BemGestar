const express = require('express');
const router = express.Router();
const autenticarJWT = require('../middlewares/auth');
const {
  listarReavaliacoes,
  criarReavaliacao,
  definirTerapia,
  listarAvaliacoes
} = require('../controllers/reavaliacaoController');

// GET: Listar reavaliações por utente
router.get('/reavaliacoes/',autenticarJWT, listarReavaliacoes);
router.post('/definir-terapia', definirTerapia);
// POST: Marcar nova reavaliação
router.post('/reavaliacoes',autenticarJWT, criarReavaliacao);
router.get('/avaliacoes', listarAvaliacoes);
module.exports = router;

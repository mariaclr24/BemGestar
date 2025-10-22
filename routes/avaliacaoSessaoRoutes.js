// routes/avaliacaoSessaoRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/avaliacaoSessaoController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const autenticarJWT = require('../middlewares/auth');

// GET: listar presenças de uma aula
router.get('/presencas/:id', autenticarJWT, controller.listarPresencas);
router.get('/utentes-presencas/:id', autenticarJWT, controller.listarUtentesPresencas);

router.get('/questionario/:id_aula/:id_utilizador', autenticarJWT, controller.verQuestionario);

// POST: submeter avaliação da sessão
router.post('/avaliacao-sessao/upload', autenticarJWT, upload.single('ficheiro'), controller.uploadAvaliacaoSessao);

module.exports = router;

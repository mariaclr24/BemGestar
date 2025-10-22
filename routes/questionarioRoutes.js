
const express = require('express');
const router = express.Router();
const controller = require('../controllers/questionarioController');
const autenticarJWT = require('../middlewares/auth');

router.post('/questionario', autenticarJWT, controller.submeterQuestionario);
router.get('/questionario/ja-respondeu/:id_aula', autenticarJWT, controller.verificarResposta);
router.get('/questionario/resposta/:id_aula', autenticarJWT, controller.verResposta);

module.exports = router;

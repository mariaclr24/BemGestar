const express = require('express');
const router = express.Router();
const codigoAcessoController = require('../controllers/codigoacessoController');
const autenticarJWT = require('../middlewares/auth');
// Rota para criar código de acesso
router.post('/codigoacesso', autenticarJWT, codigoAcessoController.criarCodigoAcesso);

module.exports = router;

const express = require('express');
const router = express.Router();
const { solicitarRecuperacaoSenha, redefinirSenha } = require('../controllers/passwordController');

router.post('/recuperar-senha', solicitarRecuperacaoSenha);
router.post('/redefinir-senha', redefinirSenha);

module.exports = router;

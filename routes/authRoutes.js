const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/registar', authController.register);
router.get('/validar-codigo/:codigo', authController.validarCodigo);

module.exports = router;

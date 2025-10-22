const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcodeController');

router.get('/qrcode/:id_utilizador/:id_aula', qrcodeController.gerarQRCode);

module.exports = router;

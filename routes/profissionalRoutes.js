const express = require('express');
const profissionalController = require('../controllers/profissionalController');

const router = express.Router();

router.post('/admin/profissionais', profissionalController.registarProfissional);

router.get('/admin/profissionais', profissionalController.listarProfissionais);

module.exports = router;

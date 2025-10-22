const express = require('express');
const router = express.Router();
const presencaController = require('../controllers/presencaController');

router.post('/presenca', presencaController.marcarPresenca);

module.exports = router;

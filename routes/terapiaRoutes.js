const express = require('express');
const router = express.Router();
const controller = require('../controllers/terapiaController');

router.get('/admin/terapias', controller.getTerapias);
router.get('/admin/terapias/:id', controller.getTerapiaById);
router.post('/admin/terapias', controller.createTerapia);
router.put('/admin/terapias/:id', controller.updateTerapia);
router.delete('/admin/terapias/:id', controller.deleteTerapia);
router.get('/allterapias', controller.getallterapias);

module.exports = router;

const express = require('express');
const router = express.Router();
const clinicaController = require('../controllers/clinicaController');

router.post('/admin/clinicas', clinicaController.addClinica);
router.get('/admin/clinicas', clinicaController.getClinicas);
router.put('/admin/clinicas/:id', clinicaController.updateClinica);
router.delete('/admin/clinicas/:id', clinicaController.deleteClinica);

router.get('/admin/clinicas/:id/espacos', clinicaController.getEspacos);
router.post('/admin/clinicas/:id/espacos', clinicaController.addEspaco);
router.put('/admin/espacos/:id', clinicaController.updateEspaco);
router.delete('/admin/espacos/:id', clinicaController.deleteEspaco);

router.get('/clinicas', clinicaController.getClinicasSimples);
router.get('/espacos', clinicaController.getEspacosSimples);
router.get('/terapias', clinicaController.getTerapiasSimples);
router.get('/profissionais', clinicaController.getProfissionaisSimples);

router.get('/cliente/:id/aulas-disponiveis', clinicaController.getAulasDisponiveis);

module.exports = router;

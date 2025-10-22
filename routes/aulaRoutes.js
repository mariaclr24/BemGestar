const express = require('express');
const router = express.Router();
const aulaController = require('../controllers/aulaController');
const biosinalController = require('../controllers/biosinalController');
const autenticarJWT = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/biosinal/check/:id_aula', autenticarJWT, biosinalController.verificarBiosinal);
router.get('/aulas', aulaController.getAllAulas);
router.get('/aulas-hoje/:id_utilizador', aulaController.getAulasDoDia);
router.get('/aulas-realizadas/:userId', aulaController.getAulasRealizadas);
router.get('/agendados/:userId', aulaController.getAgendados);
router.get('/admin/aulas', aulaController.getAllAulasAdmin);
router.get('/aula/detalhes/:id', autenticarJWT, aulaController.getDetalhesAula);
router.get('/aulas-profissional', autenticarJWT, aulaController.getAulasProfissional);
router.get('/agendados-aulas/:id_aula', aulaController.getAgendadosAula);

router.post('/aulas/adicionar-participante-manual', autenticarJWT, aulaController.adicionarParticipanteManual);
router.post('/adicionar-participante', autenticarJWT, aulaController.adicionarParticipanteManual);

router.post('/biosinal/upload', autenticarJWT, upload.single('ficheiro'), biosinalController.uploadBiosinal);
router.get('/biosinal/analise/:id_aula', autenticarJWT, biosinalController.analiseBiosinal);
router.get('/fila-espera/:id_aula', autenticarJWT, aulaController.getFilaEspera);
router.post('/agendar', aulaController.agendarAula);
router.post('/cancelarAgendamento', aulaController.cancelarAgendamento);
router.post('/alterar-horario', aulaController.alterarHorario);
router.post('/admin/aulas', aulaController.createAula);
router.get('/admin/aulas-realizadas', aulaController.getAulasRealizadasAdmin);
router.delete('/admin/aulas/:id', aulaController.deleteAula);

module.exports = router;

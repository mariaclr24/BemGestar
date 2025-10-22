const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Utilizadores
router.put('/utilizadores/:id/ativo', userController.toggleActive);
router.delete('/utilizadores/:id', userController.deleteUser);

// Utilizador individual
router.get('/utilizador/:id', userController.getUserById);
router.put('/utilizador/:id', userController.updateUser);
router.put('/utilizador/:id/senha', userController.changePassword);

// Terapias do utente
router.get('/terapias-utente/:id', userController.getTerapiasUtente);
router.get('/utilizadores/separados', userController.getAllUsersSeparated);
router.get('/utentes', userController.getAllUtentes);

module.exports = router;

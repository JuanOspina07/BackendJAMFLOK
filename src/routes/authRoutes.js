const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/registro', authController.register);
router.post('/login', authController.login);
router.post('/recuperar', authController.requestPasswordReset);
router.post('/restablecer-contrasena', authController.resetPassword);
router.get('/restablecer/:token', authController.validateToken);

module.exports = router;
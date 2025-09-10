const express = require ('express');
const router = express.Router();

//Importar controladores de autenticacion
const{
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
} = require('../controllers/AuthController');

//importar middlewares
const {verifyToken: authMiddleware} = require('../middlewares/auth');

//Ruta login
router.post('/login', login);

//Ruta obtener datos de usuario
router.get('/me', authMiddleware, getMe);

//Ruta para cambiar contraseña
router.put('/change-password', authMiddleware,changePassword);

//Ruta logout privada
router.post('/logout', authMiddleware, logout);

//Rutas para verificar 
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;
const express = require ('express');
const router = express.Router();

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats
}= require ('../controllers/UserController');

//Middleware de autrnticacion y autorizacion
const{
    verifyToken,
    verifyAdmin,
    verifyAdminOrOwner,
}= require('../middlewares/auth');

// Middleware de validacion
const { validateObjectId }= require('../middlewares/errorHandler');

//aplicar verificadiocn de token en todas las rutas
router.use(verifyToken);
//obterner estadisticas
router.get('/stats', verifyAdmin,getUserStats);
//listas para usuarios
router.get('/', verifyAdmin, getUsers);
//usuarios por id
router.get('/:id',validateObjectId('id'), getUserById,verifyAdminOrOwner);
//crear usuario
router.post('/', verifyAdmin, createUser);
//acrualizar usuario
router.put('/:id', validateObjectId('id'), verifyAdminOrOwner, updateUser);
//eliminar usuario
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteUser);
//activar o desactivar usuario
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdmin, toggleUserStatus);

module.exports = router;
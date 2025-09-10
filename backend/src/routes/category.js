const express = require ('express');
const router = express.Router();

const {
    getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    reorderCategories,
    getCategoryStats
}= require ('../controllers/categoryController');

//Middleware de autrnticacion y autorizacion
const{
    verifyToken,
    verifyAdmin,
    verifyAdminOrCoordinador,
}= require('../middlewares/auth');

// Middleware de validacion
const { validateObjectId }= require('../middlewares/errorHandler');

//categorias activas para frontpublico
router.get('/active',getActiveCategories);

//aplicar verificadiocn de token en todas las rutas
router.use(verifyToken);
//obterner estadisticas
router.get('/stats', verifyAdmin,getCategoryStats);
//rerodenar categorias
router.get('/reorder', verifyAdminOrCoordinador, reorderCategories);
//listar todas las categorias
router.get('/', getCategories);
//categorias por id
router.get('/:id',validateObjectId('id'), getCategoryById);
//crear categoria
router.post('/', verifyAdminOrCoordinador, createCategory);
//acrualizar categoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateCategory);
//eliminar categoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteCategory);
//activar o desactivar categoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleCategoryStatus);

module.exports = router;
const express = require ('express');
const router = express.Router();

const {
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
}= require ('../controllers/SubcategoryController');

//Middleware de autrnticacion y autorizacion
const{
    verifyToken,
    verifyAdmin,
    verifyAdminOrCoordinador,
}= require('../middlewares/auth');

// Middleware de validacion
const { validateObjectId }= require('../middlewares/errorHandler');

//subcategorias activas para frontpublico
router.get('/active',getActiveSubcategories);

//subcategorias por categorias activas para front publico
router.get('/vategory/:categoryId',validateObjectId('categoryId'),getSubcategoriesByCategory);

//aplicar verificadiocn de token en todas las rutas
router.use(verifyToken);

//obterner estadisticas
router.get('/stats', verifyAdmin,getSubcategoryStats);

//rerodenar subcategoria
router.get('/reorder', verifyAdminOrCoordinador, reorderSubcategories);

//listar todas las subcategorias
router.get('/', getSubcategories);

//subcategorias por id
router.get('/:id',validateObjectId('id'), getSubcategoryById);

//crear subcategoria
router.post('/', verifyAdminOrCoordinador, createSubcategory);

//actualizar subcategoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateSubcategory);

//eliminar subcategoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteSubcategory);

//activar o desactivar subcategoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleSubcategoryStatus);

module.exports = router;
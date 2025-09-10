const express = require ('express');
const router = express.Router();

const {
    getProducts,
    getActiveProdcuts,
    getProductById,
    getProductsByCategory,
    getProductsBySubcategory,
    getFeaturedProducts,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateProductStock,
    getPoductStats
}= require ('../controllers/producController');

//Middleware de autrnticacion y autorizacion
const{
    verifyToken,
    verifyAdmin,
    verifyAdminOrCoordinador,
}= require('../middlewares/auth');

// Middleware de validacion
const { validateObjectId }= require('../middlewares/errorHandler');

//subcategorias activas para frontpublico
router.get('/active',getActiveProdcuts);

//productos destacados
router.get('/featured',getFeaturedProducts)

//productos por categorias activas para front publico
router.get('/category/:categoryId',validateObjectId('categortId'),getProductsByCategory);

//productos por sucbcategoriasactivas para front publico
router.get('/subcategory/:subcategoryId',validateObjectId('subcategoryId'),getProductsBySubcategory);

//aplicar verificadiocn de token en todas las rutas
router.use(verifyToken);

//obterner estadisticas
router.get('/stats', verifyAdmin,getPoductStats);

//obterner productos sku
router.get('/sku/:sku', getProductBySku);

//listar todos los productos
router.get('/', getProducts);

//productos por id
router.get('/id',validateObjectId('id'), getProductById);

//crear producto
router.post('/', verifyAdminOrCoordinador, createProduct);

//actualizar categoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateProduct);

//eliminar subcategoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteProduct);

//activar o desactivar subcategoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleProductStatus);

//Actalizar prducto por stock
router.patch('/:id/stock', validateObjectId('id'), verifyAdminOrCoordinador, updateProductStock);

module.exports = router;
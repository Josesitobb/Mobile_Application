//Archivo principal de rutas 
//Centraliza las rutas y organiza todas las rutas del api

const express = require('express');
const router = express.Router();

//Importar  las rutas modulares
const authRoutes = require('./auth');
const userRoutes = require('./user');
const categoryRoutes = require('./category');
const subCategoryRoutes = require('./subCategory');
const productRoutes = require('./product');

//cada modilo tiene su propio espacion en la url
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subCategoryRoutes);
router.use('/products', productRoutes);

//permite verificar el que el servidor este funcionando correctamente
router.get('/health',(req,res)=>{
    res.status(200).json({
        succes: true,
        message:'Api Funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

//proporciona documentacion basica sobre la api
router.get('/', (req, res)=>{
    res.status(200).json({
        succes: true,
        message: 'Bienvenido a la API de gestion de productos',
        version:'1.0.0',
        endpoint:{
            auth: '/api/auth',
            users: '/api/users',
            categories: '/api/categories',
            subcategories:'/api/subcategories',
            products: '/api/products'
        },
        documentation:{
            postman: 'Importe la coleccion Postman para probar todos endpoints',
            authentication: 'usa /api/auth/login para obtener el token JWT'
        }
    });
});

module.exports= router;


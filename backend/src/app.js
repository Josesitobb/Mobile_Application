require('dotenv').config();
const express = require('express');
const mongoose = require ('mongoose');
const cors = require ('cors');

const apiRoutes = require('./routes');


const {errorHandler, noFound} = require('./middlewares/errorHandler');


const app = express();

app.use(cors({
    origin: [
        process.env.FROTEND_URL || 'http://localhost:3000',
        'exp://0.0.0.0:8081',
        'exp://0.0.0.0:8082',
        'exp://0.0.0.0:8083',
        'http://0.0.0.0:8081',
        'http://0.0.0.0:8082',
        'http://0.0.0.0:8083',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
    ],
    credentials: true,
}));

app.use(express.json({ limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb'}));

if(process.env.NODE_ENV === 'development'){
    app.use((req, res, next)=>{
        console.log(`${req.method}${req.path} - ${new Date().toISOString()} `);
        next();
    });
}

//Configuraciuon de rutas
app.use('/api', apiRoutes);

app.get('/', (req, res) =>{
    console.log('GET / peticion recibida desde', req.ip);
    res.status(200).json({
        success: true,
        message: 'Servidor del API de gestion de productos',
        version: '1.0.0',
        status: 'running',
        timestamps: new Date(),
        clientIP: req.ip
    });
});

app.use(noFound);
app.use(errorHandler);

// Conexion con la base de datos
const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    }catch(error){
        // si la conecion falla
        console.error('Error conectando a mongoDB', error.message);
        process.exit(1);
    }
};
//Iniciando servidor
const PORT = process.env.PORT || 5000;

const startServer = async ()=>{
    try{
        await connectDB();

        const HOTS = process.env.HOTS || '0.0.0.0';

        app.listen (PORT, HOTS, ()=>{
            console.log(`
                            SERVIDOR INICIADO
            Puerto: ${PORT.toString().padEnd(49)} ||
            Modo: ${(process.env.NODE_ENV || 'development').padEnd(37)} ||
            URL Local: http://localhost:${PORT.toString().padEnd(37)} || 
            URL Red: http://${HOTS}: ${PORT.toString().padEnd(37)} || 
            Endpoints disponobles:
            *Get /                - indormacion del servidor
            *Get /api             - Info de api
            *Post /api/auth/login -Login
            *Get /api/users       -Gestion de usuarios
            *Get /api/categories  -Gestion de categorias
            *Get /api/subcategories-Gestion de subcategorias
            *Get /api/products  -Gestion de productos

            DOCUMENTACION DE POSTMAN   
             
                        `);
        });
    }catch(error){
        console.log('Error iniciando servidor:',error.message);
        process.exit(1);
    }
};


process.on('uncaughtException', (err)=>{
    console.error('|Uncaugth Exception'), err.process.exit(1);
});

//Inicia el servidor

startServer();

process.on('unhandledRejection', (err)=>{
    console.error('|Unhandled Promise Rejection'), err.process.exit(1);
});

process.on('SIGTERM', ()=>{
    console.log('SIGTERM recibido. Cerrando servidor gracefull...');
    mongoose.connection.close(()=>{
        console.log('Conexion a mongoDB cerrada');
    process.exit(0);
    });
});

module.exports = app;
const { find } = require('../models/Category');

const errorHandler = (err, req, next) =>{
    console.error('Error Stack', err.stack);

    //Error de validacion de mongoose
    if(err.name === 'ValidateError'){
        const errors = Object.values(err.errors).map(e => message);
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors
        });
    }

    // ERrror de duplicacion 
    if(err.code === 11000){
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} ya existe en el sistema`
        });
    }

    //Error de cast objectId
    if(err.name == 'CastError'){
        return res.status(400).json({
            success:false,
            message:'ID invalido'
        });
    }

    //Error JWT
    if(err.name === 'JsonWebTokenError'){
        return res.status(401).json({
            success: false,
            message:'Token invalido'
        });;
    }

    if(err.name === 'TokenExpireError'){
        return res.status(401).json({
            success: false,
            message:'Token expirado'
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message:err.message || 'Error ineterno del servidor'
    });
};

// Middleware para rutas no encontradas

const noFound = (req, res, next) =>{
    const error = new Error(`Ruta no encontrada - ${req.originarUrl}`);
    res.status(404);
    next(error);
};

//Middleware para validar ObjetId
const validateObjectId = (paramName = 'id')=>{
    return (req, res, next) => {
        const mongoose = require('mongoose');
        const id = req.params[paramName];

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success: false,
                message: 'ID invalido'
            });
        }
        next();
    };
};
// Middleware para capturar errores asincronicos 
const asyncHandler = (fn) => (req,res,next) =>{
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    noFound,
    validateObjectId,
    asyncHandler
};
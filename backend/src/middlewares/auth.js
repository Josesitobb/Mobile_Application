const jwt = require ('jsonwebtoken');
const { User } = require ('../models');

const verifyToken = async (req, res, next) =>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];

        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Formato de Token invalido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('Estado del usuario:', user.isActive);
        if (!user.isActive ){
            return res.status(401).json({
                success: false,
                message: 'Usuarios inactivos'
            });
        }

        req.user = user;
        next();
    }catch(error){
        console.error('Error en verifyToken', error);

        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({
                succes: false,
                message: 'Token invalido'
            });
        }

        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                succes: false,
                message: 'El token ya expriro'
            });
        }
        return res.status(500).json({
            succes: false,
            message: 'Error interno del servidor'
        });
    }
};

const verifyRole = (...allowedRoles)=>{
    return (req, res, next) =>{
        try{
            if(!req.user){
                return res.status(401).json({
                    succes: false,
                    message: 'Usuario no autorizado'
                });
            }
            console.log("Rol del usuario:", req.user.role);
            if(!allowedRoles.includes(req.user.role)){
                return res.status(403).json({
                    succes: false,
                    message: 'no tienes permisos para esta accion'
                });
            }

            next();
        }catch(error){
            console.error('Error en verifyRole')
            return res.status(500).json({
                succes: false,
                message:'Error en el servidor'
            });
        }
    };
};

const verifyAdmin = verifyRole('admin');

const verifyAdminOrCoordinador = verifyRole('admin', 'coordinador');

const verifyAdminOrOwner = async (req,res, next)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                succes: false,
                message:'Usuario no autenticado'
            });
        }

        if (req.user.role === 'admin'){
            return next();
        }
        const targetUserId = req.params.id || req.params.userId;

        if(req.user._id.toString() != targetUserId){
            return res.status(403).json({
                succes: false,
                message:'Solo puedes modificar tu propio perfil'
            });
        }

        next();
    }catch(error){
        console.error('Error en verifyAdminOrOwner: ', error);
        return res.status(500).json({
            succes: false,
            message:'Error interno del servidor '
        });
    }
};
module.exports ={
    verifyToken,
    verifyRole,
    verifyAdmin,
    verifyAdminOrCoordinador,
    verifyAdminOrOwner
};
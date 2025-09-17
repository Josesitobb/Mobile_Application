const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { asyncHandler } = require('../middlewares/errorHandler');

//login de usuario
const login = asyncHandler(async (req, res) => {
    console.log(' DEBUG: Datos recibidos em login', req.body);
    const { email, username, password } = req.body;
    const loginField = email || username;
    console.log(' DEBUG: Campos de login ', loginField);
    console.log(' DEBUG: Password recibida', password ? '[PRESENTE]' : '[ASUSENTE]');
    // Validacion de campos requeridos 
    if (!loginField || !password) {
        console.log('DEBUG - faltan credenciales');
        return res.status(400).json({
            success: false,
            message: 'Username y contraseña son requeridos'
        });
    }
    //Busqueda de ususrio en la base de datos
    try {
        console.log('DEBUG: buscando usuario con: ', loginField.toLowerCase());
        const user = await User.findOne({
            $or: [
                { username: loginField.toLowerCase() },
                { email: loginField.toLowerCase() }
            ]
        }).select('+password');//incluye el campo de password  oculto
        console.log('DEBUG: Usuario encontrado ', user ? user.username : 'NINGUNO');
        if (!user) {
            console.log('ERROR - usuario no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Credencialies invalidas '
            });
        }
        //validacion de usuario inactivo
        if (!user.isActive) {
            console.log('ERROR - usuario inactivo');
            return res.status(401).json({
                success: false,
                message: 'usuario inactivo, contactar con el administrador'
            });
        }
        //verificacion de contraseña
        console.log('DEBUG: Verificando contraseña');
        const isPasswordValid = await user.comparePassword(password);
        console.log(' DEBUG: Constraseña valida', isPasswordValid);
        if (!isPasswordValid) {
            console.log('ERROR - constraseña invalida');
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }
        user, lastLogin = new Date();
        const userResponse = (await user.save()).toObject();
        delete userResponse.password;

        //Generar token JWT
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            message: 'Login existoso',
            data: {
                user: userResponse,
                token,
                expiresIn: process.env.JWT_EXPIRE || "1d",
            }
        });
    } catch (error) {
        console.log('ERROR en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});

//obtener informacion del usuario actual 
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success: true,
        date: user
    });
});

// cambio de contraseña
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'contraseña actual y nieba son requeridas'
        });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'gola'
        });
    }
    //obtener usuariuo con la contarseña acrual 
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPassword = await user.comparePassword(currentPassword);
    if (!isCurrentPassword) {
        return res.status(400).json({
            success: false,
            message: 'contraseña actual incorrecta'
        });
    }

    user.password = newPassword();
    await user.save();
    res.status(200).json({
        success: true,
        message: 'contraseña acrualizada conrrectamente'
    });
});


//inavlidar  el token usuario extraño
const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'logout existoso, invalida el token del clinetre'
    });

});
// verificar el token
const verifyToken = asyncHandler(async (req, res) => {
    res.status(200).json({
        succes: true,
        message: 'Token valido',
        data: req.user
    });
});


module.exports = {
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
};

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { asyncHandler } = require('../middlewares/erorHandler');

// Login de usuario

const login = asyncHandler(async (req, res) => {
    console.log('DEBUG: Datos recibidos en login', req.body);
    const { email, username, password } = req.body;
    const loginFields = email || username;

    console.log('DEBUG: Campo de login', loginFields);
    console.log('DEBUG Password recibido', password ? '[PRESENTE]' : '[AUSENTE]');
    // validacion de campos requeridos
    if (!loginFields || !password) {
        console.log('Error - falta campos requeridos');
        return res.status(400).json({
            success: false,
            message: 'Usernme y contraseña son requeridos'
        });
    }

    // Busqueda de usuario en la base de datos
    try {
        console.log('DEBUG: Buscando usuario con;', loginFields.tolowerCase());
        const user = await User.findOne({
            $or: [
                { username: loginFields.tolowerCase() },
                { email: loginFields.tolowerCase }
            ]
        }).select('+password'); //Incluye el campo de password oculto
        console.log('DEBUG: Usuario encontrado', user ? user.username : 'NINGUNO');
        if (!user) {
            console.log('ERROR - Usuario no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Crendeciales invalidas'
            });
        }

        // Validacion usuario Inactivo
        if (!user.isActive) {
            console.log('Erro - Usuario inactivo');
            return res.status(403).json({
                success: false,
                message: 'Usuairo inactivom conacta al adminitrado'
            });
        }

        // VERIFICACION DE CONTRASEÑA
        console.log('DEBUG: Verificando Contrseña');
        const isPasswordValid = await user.coparePassword(password);
        console.log('DEBUG: Contraseña valida', isPasswordValid);

        if (!isPasswordValid) {
            console.log('ERROR - Contraseña invalida');
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidadas'
            });
        }
        user.lastLogin = new Date();
        await user.save();
        // Generar token JWT
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            message: 'Login Exitoso',
            data: {
                user: userResponse,
                token,
                expiresIn: process.env.JWT_EXPIRE || '1h'
            }
        })

    } catch (error) {
        console.log('ERROR en login', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });

    }
})

// Obtener informacion del usuario autenticado
const getMe = asyncHandler(async (req, res) => {
    const user = await User.finById(req.user._id);
    res.status(200).json({
        success: true,
        message: 'Informacion del usuario',
        data: user
    });

});

// Cambio de contraseña

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Contraseña actual y nueva contraseña son requeridas'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Contraseña debe tener minimo 6 caracteres'
        });
    }

    // Obtener Uusario  con la contraseña actual
    const user = await User.finById(req.user._id).select('+password');

    const isCurentPasswordValid = await user.comparepassword(currentPassword);
    if (!isCurentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta'
        });
    }

    user.password = newPassword();
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Contraseñ actualizada correctamente'
    });

    //  Invalidar el token usuario extraño
    const logoout = asyncHandler(async (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Logout exitoso, invalida el token en el cliete'
        });
    });
    // Verificar el token
    const verifyToken = asyncHandler(async (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Token valido',
            data: req.user
        });
    });

});

module.exports = {
    login,
    getMe,
    changePassword,
    logoout,
    verifyToken
}
const { User } = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');

// Obtener los usuarios
const getUser = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.page) || 10;
    const skip = (page - 1) * limit;

    // Filtro dinamicos
    const filter = {};

    // Rol
    if (req.query.role) filter.role = req.query.role;
    // Activo/inactivo
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === true;
    // Multiples filtros
    if (req.query.search) {
        filter.$or = [
            { username: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { firstName: { $regex: req.query.search, $options: 'i' } },
            { lastname: { $regex: req.query.search, $options: 'i' } },

        ];
    }

    // Consulta de paginacion
    const users = await User.find(filter).populate('createdBy', 'username firstName lastName').sort({ createdAt: -1 }).skip(skip).limit(limit);

    // Contar total para los usuarios
    const total = await User.countDocuments(filter);
    // Repuesta exitosa

    res.status(200).json({
        success: true,
        data: users,
        pagination: {
            page, limit, total, pages: Math.ceil(total / limit)
        }
    })

});

// Consultar por id
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate('createdBy', 'username firstName lastName');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: user
    });
});
// Crear un usuario
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName, phone, role, isActive } = req.body;

    // Validacion
    if (!username || !email || !password || !lastName || !role) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        })
    }

    // Verificar si el suario ya existe

    const existinsUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existinsUser) {
        return res.status(400).json({
            success: false,
            message: 'Usuario o email ya existe'
        });
    }

    // Crear el usuario
    const User = await User.Create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: User
    });
});

// Actualizar un usuario
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuaio no encontrado'
        });
    }

    const { username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        isActive,
        createdBy } = req.body;
    // Si no es admin  solo puede actualizar ciertos campos y solo su perfil
    if (req.user.role !== 'admin') {
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes actualizar tu propio perfil'
            });
        }
        // Solo los admin puede cambiar rol y IsActive
        if (role !== undefined || isActive !== undefined) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cambiar el rol o estado del usuario'
            })
        };
    }

    if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El nombre ya esta en uso'
            });
        }
    }

    if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta en uso'
            });
        }
    }

    // Actualizar campos
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    // Solo admin puede cambiar estos campos
    if (req.user.role === 'admin') {
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
    }
    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

// Eliminar Usuario

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }
    // No permitir que el admn se elimine a si mismo
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
            success: false,
            message: 'No puedes eliminar tu propio usuario'
        })
    }
    await User.findByAndDetele(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
    });
});

// Activar o desactivar usuario
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    // No permitir que el admin se desactive a si mismo
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
            success: false,
            message: 'No puedes cambiar tu propio estado'
        });
    }

    user.isActive = !user.isActive;
    user.updateUser = req.user._id;
    await user.save();

    res.status(200).json({
        success: true,
        message: ` Usuaio ${user.isActive ? 'Activado' : 'Desactivado'} `,
        data: user
    })
});

// Obtener las estadisticas de los usuarios
const getUserStats = asyncHandler(async (req, res) => {
    const stast = await User.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: {
                    $sum: 1
                },
                actiateUsers: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                adminUsers: {
                    $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                },
                CoordinadorUsers: {
                    $sum: { $cond: [{ $eq: ['$role', 'coordinador'] }, 1, 0] }
                }
            }
        }
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username firsNmae lastName email role createdAt');

    res.status(200).json({
        success: true,
        data: {
            status: stats[0] || {
                totalUsers: 0,
                activateUsers: 0,
                adminUsers: 0,
                CoordinadorUsers: 0
            },
            recentUsers
        }
    });
});

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats
}



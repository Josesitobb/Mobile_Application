const {User} = require('../models');
const {asyncHandler} = require('../middlewares/errorHandler');


//obtener los usuarios 
const getUsers = asyncHandler(async (req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1)*limit;


    //Filstros dinamicos

    const filter ={};
    //Rol
    if (req.query.role) filter.role = req.query.role;
    //activo/inactivo
    if(req.query.active !== undefined) filter.isActive = req.query.isActive === true;
    //Multiples filtros
    if(req.query.search){
        filter.$or = [
            { usernamer: {$regex: req.query.search, $options: '1'}},
            { email: {$regex: req.query.search, $options: '1'}},
            { firtsName: {$regex: req.query.search, $options: '1'}},
            { lastName: {$regex: req.query.search, $options: '1'}},
        ];
    }
    
    //Consulta de paginacion
    const users = await User.find(filter)
    .populate('createBy', 'username firstName lastName')
    .sort({ createdAt: -1})
    .skip(skip)
    .limit(limit);

    //constar total para los ususarios 
    const total = await User.countDocuments(filter);
    //respuesta existosa
    res.status(200).json({
        success: true,
        data: users,
        pagination:{
            page,
            limit,
            total,
            pages: Math.ceil(total/ limit)
        }
    });
});
//obtener un ususario por ID
const getUserById = asyncHandler(async (req, res)=>{
    const user = await User.findById(req.params.id)
    .populate('createdAt', 'username firtsName lastName');

    if(!user){
        return res.status(400).json({
            success: false,
            message:'Usuario no encontrado'
        });
    }
    res.status(200).json({
        success: true,
        date: user
    });
});

//Crear un usuario
const createUser = asyncHandler(async (req, res)=>{
    const{
        username,
        email,
        password,
        firtsName,
        lastName,
        role,
        phone,
        isActive
    }=req.body;

    //validaciones
    if (!username || !email || !password || !firtsName || !lastName || !role) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }
    //verificaar si el usuario existe
    const existingUsers = await User.findOne({
        $or:[{username},{email}]
    });
    if (existingUsers){
        return res.status(400).json({
            success: false,
            message:'El ususrio ya existe'
        });
    }
    //crear el ususrio
    const user = await User.create({
        username,
        email,
        password,
        firtsName,
        lastName,
        role,
        phone,
        isActive: isActive !== undefined ? isActive: true,
        creadBy: req.user._id
    });

    const dataUser = user.toObject();
    delete dataUser.password;
    res.status(201).json({
        success: true,
        data: dataUser
    });
});

//Actualizar usuario
const updateUser = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.id);
    
    if (!user){
        return res.status(404).json({
            success: false,
            message: 'usuario no encontrado'
        });
    }
    
    const  {
        username,
        email,
        password,
        firtsName,
        lastName,
        role,
        phone,
        isActive,
        creadBy,
    } = req.body;
    //si no es admin solo puede actualizar ciertos campos y solo si perfil 
    if(req.user.role !== 'admin'){
        if(req.user._id.toString() !== req.params.id){
            return res.status(403).json({
                success: false,
                message:'Solo puede actualizar tu propio perfil'
            });
        }
        //solo loss admin pueden cambiar rol y isActive
        if(role !== undefined || isActive !== undefined){
            return res.status(403).json({
                success: false,
                message: 'no tines permisos para cambiar el rol o el estdo del ususrio'
            });
        };
    }
    //verificar suplicados si se cambio username o email
    if (username && username !== user.username){
        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return res.status(400).json({
                success: false,
                message: 'El nombre ya esta en uso'
            });
        }
    }
    if (email && email !== user.email){
        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({
                success: false,
                message: 'El email ya esta en uso'
            });
        }
    }
    //Actualizar  Campos
    if (username) user.username = username;
    if (email) user.email = email;
    if (firtsName) user.firtsName = firtsName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    //solo admin puede cambiar estos campos
    if(req.user.role === 'admin'){
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
    }
    user.updateBy = req.user._id;
    await user.save ();

    res.status(200).json({
        success: true,
        data: user
    });
});

//Eliminar un ususario 
const deleteUser = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.params.id)
    if(!user){
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }
    //no permitir que le afmin se elimine asi mismo 
    if (user._id.toString() === req.user._id.toString()){
        return res.status(400).json({
            success: false,
            message: 'no puedes elimitar tu propio ususrio'
        });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente'
    });
});

//Activar o desactivar usuario 
const toggleUserStatus = asyncHandler(async(req, res)=>{
   const user = await User.findById(req.params.id);
   if (!user){
    return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
    });
   } 

   // No permitir que el admin se desactive a si mismo 
   if (user._id.toString()  === req.user._id.toString()){
    return res.status(400).json({
        success: false,
        message: ' no puedes cambiar tu propio estado'
    });
   }
   user.isActive = !user.isActive;
   user.updateUser = req.user._id;
   await user.save();

   res.status(200).json({
    success: true,
    message: `Usuario ${user.isActive ? 'activado ' : 'desactivado'} existosamente`,
    data: user
   });
});

//Optener las estadisticas de los usuarios 
const getUserStats = asyncHandler(async(req, res)=>{
    const stast = await User.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activateUsers : {$sum :{$cond: [{ $eq: ['$isActive', true]}, 1, 0]}},
                adminUsers:{$sum :{$cond: [{ $eq: ['$role', 'admin']}, 1, 0]}},
                CoordinadorUsers: {$sum :{$cond: [{ $eq: ['$role', 'coordinador']}, 1, 0]}},

            }
        }
    ]);
    const recentUsers = await User.find()
    .sort ({createdAt: -1})
    .limit(5)
    .select('username firtsName lastName email role createdAt');
    
    res.status(200).json({
        success: true,
        data:{
            status: stast [0] || {
                totalUsers: 0,
                activateUsers: 0,
                adminUsers: 0,
                CoordinadorUsers: 0
            },
            recentUsers
        }
    });
});
module.exports= {
    getUserById,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats,
};
    
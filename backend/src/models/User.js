const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userShema = new mongoose.Schema({
    username: {
        type: String,
        require: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        minlength: [3, 'El nombre de usurio debe contener al menos 3 caracteres'],
        maxlength: [50, 'El nombre de usuario  no puede extenderse a mas de 50 caracteres']
    },
    email: {
        type: String,
        require: [true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([._]?\w+)*(\.\w{2,3})+$/, 'Por faor ingrese un email valido'] //Validacion regex permite verficar que en realidad sea un email

    },
    password: {
        type: String,
        require: [true, 'la contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    firsName: {
        type: String,
        require: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [50, 'El nombre no puede contener mas de 50 caracteres']
    },
    lastName: {
        type: String,
        require: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [50, 'El apellido no puede contener mas de 50 caracteres']
    },
    role: {
        type: String,
        emun: {
            values: ['admin', 'coordinador'],
            message: 'El rol debe ser admin o coordinador'
        },
        require: [true, 'El rol es requerido']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d\s\-\(\)]{0,20}$/, 'Por favor ingrese un numero de telefono valido']
    },
    laslogin: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
}

);

// Encriptar contraseña ants de guardar
userShema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    }catch(error){
        next(error);
    }
});

// Si van  actualiza contraseña la encripta
userShema.pre('findOneAndUpdate',async function(next) {
    const update = this.getUpdate();
    if(update.password){
        try{
            const salt= await bcrypt.genSalt(12);
            update.password = await bcrypt.hash(update.password, salt);
        }catch(error){
            return next(error);
        }
    }
    next();
})


// Metodos para comparar contraseña
userShema.methods.comparePassword = async function (candidatePassword) {
    try{
        return await bcrypt.compare(candidatePassword. this.password)
    }catch(error){
        throw error ;
    }
};

// Sobre escribe el metodo toJSON para que nunca envie la contraseña por el frontend
userShema.methods.toJson = function(){
    const userObject = this.password;
    delete userObject.password;
    return userObject;
}

// Campo virtula para nombre  no se guardan el la base de datos
userShema.index({role:1})
userShema.index({isActive:1})

module.exports = mongose.model('user',userShema)




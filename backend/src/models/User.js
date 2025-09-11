const mongose = require ('mongoose');
const bcrypty = require ('bcryptjs');

const userShema = new mongose.Schema({
    username:{
        type: String,
        require:[true, 'El nombre es obligatorio'],
        unique: true,
        trim: true,
        minlength:[3, 'El nombre de usuario debe contener al menos 3 caracteres'],
        maxlength:[50, 'El nombre de usurio no pueded exceder 50 caracteres']

    },
    email:{
        type: String,
        require:[true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match:[/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email valido'] //validacion regex permite berificar el email

    },
    password:{
        type: String,
        require:[true, 'la contraseña es requerida'],
        minlength:[6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    firstName:{
        type: String,
        require:[true, 'El nombre es requerido'],
        trim: true,
        maxlength:[50, 'El nombre no puede tener mas de 50 caracteres']
    },
    lastName:{
        type: String,
        require:[true, 'El apellido es requerido'],
        trim: true,
        maxlength:[50, 'El apellido no puede tener mas de 50 caracteres']
    },
    role:{
        type: String,
        enum:{
            values:['admin', 'coordinador'],
            message:'El rol debe ser admin o coordinador'
        },
        require: [true, 'El rol es requerido']
    },
    isActive:{
        type: Boolean,
        default: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d\s\-\(\)]{0,20}$/, 'Por favor ingrese un numero de telefono valido']
    },
    laslogin:{
        type:Date
    },
    createdBy:{
        type: mongose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true,
});
//Encriptar contraseña antes de guardar
userShema.pre('save', async function(next){
if (!this.isModified('password')) return next();
try{
    const salt = await bcrypty.genSalt(12);
    this.password = await bcrypty.hash(this.password, salt);
    next();
}catch(error){
    next(error);
}
});

//Si van actualizar contraseña le encripta
userShema.pre('findOneAndUpdate', async function (next){
    const update = this.getUpdate();

    if(update.password){
        try{
            const salt = await bcrypty.genSalt(12);
            update.password=await bcrypty.hash(update.password, salt);
        }catch(error){
            return next(error);
        }
    }
    next();

    
})

//Metodos para comparar contraseña
userShema.methods.comparePassword = async function(candidatePassword){
    try{
        return await bcrypty.compare(candidatePassword,this.password);
    }catch(error){
        throw error;
    }
};

//sobre escribir el metodo tuJSON para nunca 
userShema.methods.toJson = function(){
    const userObject = this.toJson();
    delete userObject.password;
    return userObject;
};

userShema.virtual('fullName').get(function(){
    return `${this.firstName}${this.lastName}`;
})

//campo virtual para nombre no se guardan en la base de datos
userShema.index({role:1});
userShema.index({isActive:1});

module.exports = mongose.model('User', userShema);
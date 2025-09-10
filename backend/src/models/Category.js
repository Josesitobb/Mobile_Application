const mongoose = require('mongoose');

const categoryShema = new mongoose.Schema({
    name:{
        type: String,
        require: [true, 'El nombre de categoria es requerido'],
        trim: true,
        unique: true,
        minlength:[2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength:[100, 'El nombre no puede exceder los 100 caracteres']
    },

    description:{
        type: String,
        trim: true,
        maxlength:[500,'La descripcion no puede tener mas de 500 catacteres']
    },
    slug:{
        type:String,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActivate:{
        type: Boolean,
        default: true,
    },
    color:{
        type: String,
        trim: true,
        match: [/^#([A-FA-f0-9]{6}|[A-F-f0-9]{3})$/,'El color debe ser en codigo HExadecimal valido']
    },
    sortOrder:{
        type:Number,
        defaul: 0
    },

    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },

    updateBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true
});

categoryShema.pre('save', function(next){
    if (this.isModified('name')){
        this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,'-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
});

categoryShema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();

    if(update.name){
        update.slug = update.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,'-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
});

categoryShema.virtual('productCount',{
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

categoryShema.statics.findActive = function(){
    return this.find({ isActivate: true}).sort({ sortOrder:1, name:1 });
};

categoryShema.methods.canDelete = async function(){
    const Subcategory = mongoose.model('Subcategory');
    const Product = mongoose.model('Product');

    const SubcategoriesCount = await Subcategory.countDocuments({ category: this._id});
    const ProductsCount = await Product.countDocuments({ category: this._id});

    return SubcategoriesCount === 0 && ProductsCount === 0;
};

categoryShema.index({isActivate: 1 });
categoryShema.index({sortOrder: 1 });
categoryShema.index({createdBy: 1 });

module.exports = mongoose.model('Category', categoryShema)
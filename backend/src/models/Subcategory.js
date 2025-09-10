const mongoose = require ('mongoose');

const SubcategoryShema = new mongoose.Schema({
    name:{
        type: String,
        requied: [true, 'El nombre de la subcategoria es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos dos caracteres'],
        maxlength: [100, 'El nombre no puede tener mas de 100 caracteres']
    },
    description:{
        type: String,
        trim: true,
        maxlength: [500, 'La descripcion no puede tener mas de 500 caracteres']
    },
    slug:{
        type: String,
        lowercase: true,
        trim: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoria es requerida'],
        validate:{
            validator: async function (categoryId) {
                const Category = mongoose.model('Category');
                const category = await Category.findById(categoryId);
                return category && category.isActive;
            },
            message:'La categoria debe existir y estar activa'
        }
    },
    isActive:{
        type:Boolean,
        defaul:true
    },
    icon:{
        type: String,
        trim: true
    },
    color:{
        type:String,
        trim: true,
        match:[/^#([A-FA-f0-9]{6}|[A-F-f0-9]{3})$/,'El color debe ser en codigo HExadecimal valido']
    },
    sortOrden:{
        type: Number,
        dafaul: 0
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    
    updateBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
     },   
},{
    timestamps: true
});

SubcategoryShema.pre('save', function(next){
    if (this.isModified('name')){
        this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,'-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
});

SubcategoryShema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();

    if(update.name){
        update.slug = update.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,'-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
});
SubcategoryShema.pre('save', async function (next){
    if(this.isModified('category')){
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);

        if(!category){
            return next(Error('La categoria especifica no existe'));
        }

        if(!category.isActive){
            return next (new Error('La categoria especifica no esta activa'))
        }
    }
    next();
});

SubcategoryShema.virtual('productCount',{
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

SubcategoryShema.statics.findActive = function(){
    return this.find({isActive: true})    
    .populate('category', 'name slug')
    .sort({ sortOrden: 1, name: 1});
};

SubcategoryShema.statics.findByIdCategory = function (categoryId) {
  return this.find({ category: categoryId })
    .populate("category", "name slug")
    .sort({ sortOrder: 1, name: 1 });
};


SubcategoryShema.methods.canBeDelete = async function(){
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({subcategory: this._id});
    return productCount === 0;
};

SubcategoryShema.methods.getFullPath = async function(){
    await this.populate('category', 'name');
    return `${this.category.name} > ${this.name}`;
};

SubcategoryShema.index({ category: 1 });
SubcategoryShema.index({ isActive: 1 });
SubcategoryShema.index({ sortOrden: 1 });
SubcategoryShema.index({ slug: 1 });
SubcategoryShema.index({ createdBy: 1 });

module.exports = mongoose.model('Subcategory', SubcategoryShema);


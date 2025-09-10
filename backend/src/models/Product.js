const mongoose = require('mongoose');
const Subcategory = require('./Subcategory');

const productShema = new mongoose.Schema({
    name: {
        type: String,
        requied: [true, 'El nombre del producto es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos dos caracteres'],
        maxlength: [100, 'El nombre no puede tener mas de 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripcion no puede tener mas de 1000 caracteres']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [250, 'La descripcion no puede tener mas de 250 caracteres']
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true
    },

    sku: {
        type: String,
        required: [true, 'El sku es equerido '],
        unique: true,
        uppercase: true,
        minlength: [3, 'El SKU debe teneral menosa 3 caracteres'],
        maxlengthq: [50, 'El SKU no puede tener mas de 50 caracteres']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoria es requerida'],
        validate: {
            validator: async function (categoryId) {
                const Category = mongoose.model('Category');
                const category = await Category.findById(categoryId);
                return category && category.isActive;
            },
            message: 'La categoria debe existir y estar activa'
        }
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: [true, 'La subcategoria es requerida'],
        validate: {
            validator: async function (subcategoryId) {
                const SubcategoryModel = mongoose.model('Subcategory');
                const subcat = await SubcategoryModel.findById(subcategoryId);
                return subcat && subcat.isActive;
            },
            message: 'La subcategoria debe existir y estar activa'
        }
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativi'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El precio debe ser un numero valido mayor a 0 o igual'
        }
    },
    comparePrice: {
        type: Number,
        min: [0, 'El precio de comparacion no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value == null || value === undefined)
                    return true;
                return Number.isFinite(value) && value >= 0
            },
            message: 'El orecio de comparacion deber ser un numero valido mayor o igual'
        }

    },
    cost: {
        type: Number,
        min: [0, 'El costpo no piede ser negativo'],
        validate: function (value) {
            if (value == null || value === undefined)
                return true;
            return Number.isFinite(value) && value >= 0;
        },
        message: 'El costo deber ser un numero'
    },
    stock: {
        quantify: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad del stock no puede ser negativo']
        },
        minStock: {
            type: Number,
            default: 0,
            min: [0, 'El stock no puede ser minimo de 0']
        },
        trackStock: {
            type: Boolean,
            default: true
        }
    },
    dimensions: {
        weight: {
            type: Number,
            min: [0, 'El peso no puede ser negativo']
        },
        length: {
            type: Number,
            min: [0, 'La longitud no puede ser negativo']
        },
        widht: {
            type: Number,
            min: [0, 'El ancho no puede ser negativo']
        },
        height: {
            type: Number,
            min: [0, 'La altura no puede ser negativo']
        },
    },
    images: [{
        url: {
            type: String,
            required: true,
            trim: true
        },
        alt: {
            type: String,
            trim: true,
            maxlength: [200, 'El texto alternativo no puede tener mas de 200 caracteres']
        },
        isPrimary: {
            type: Boolean,
            default: false,
        }
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Cada tab no puede exceder los 50 caracteres']
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    isFeatured: {
        type: Boolean,
        default: true,
    },
    isDigital: {
        type: Boolean,
        default: true,
    },
    sortOrder: {
        type: Number,
        trim: true,
        maxlength: [70, 'El titulo no puede exceder los 70 caracteres']
    },
    soeDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'La descripcion no puede superar los 160 caracteres']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    updateBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});
productShema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    next();
});
productShema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
    next();
});
productShema.pre('save', async function (next) {
    if (this.isModified('subcategory')|| this.isModified('Subcategory')){
        const Subcategory = mongoose.model('Subcategory');
        const subcategory= await Subcategory.findById(this.subcategory)

        if (!subcategory){
            return next (new Error('La subcategoria especifica no exisrte'));
        }

        if(subcategory.category.toString() !== this.category.toString()){
            return next(new Error('El subcategoria no pertenece a la categoria especificada'));
        }
    }
    next();
});

productShema.virtual('profitMagin').get(function(){
    if(this.price && this.cost){
        return ((this.price - this.cost)/this.price)*100;
    }
    return 0;
});
productShema.virtual('isOutOfStock').get(function(){
    if (!this.stock.trackStock) return false;
    return this.stock.quantify <= 0;
});
productShema.virtual('primaryImagen').get(function(){
    return this.images.find(image => image.isPrimary)|| this.imagen[0];
});

productShema.static.findActive = function(){
    return this.find({ isActive: true})
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort ({sortOrder: 1, name : 1 });
};

productShema.static.findByCategory = function(categoryId){
    return this.find ({
        category : categoryId,
        isActive : true
    })
    .populate('category', 'name slug')
    .populate('subcategory','name slug' )
    .sort ({ sortOrder: 1, name:1 });
};

productShema.static.findBySubcategory = function(subcategoryId){
    return this.find ({
        subcategory : subcategoryId,
        isActive : true
    })
    .populate('category', 'name slug')
    .populate('subcategory','name slug' )
    .sort ({ sortOrder: 1, name:1 });
};

productShema.static.findFeature = function(){
    return this.find ({
        isFeactured: true,
        isActive : true
    })
    .populate('category', 'name slug')
    .populate('subcategory','name slug' )
    .sort ({ sortOrder: 1, name:1 });
};

productShema.methods.getFullPath = async function(){
    await this.populate([
        { path: 'category', select: 'name'},
        { path: 'subcategory', select: 'name'}
    ]);

    return `${this.category.name} > ${this.subcategory.name} > ${this.name}`;
};

productShema.methods.updateStock = function(quantify){
    if (this.stock.trackStock){
        this.stock.quantify += quantify;
        if(this.stock.quantify<0){
            this.stock.quantify = 0;
        }
    }
    return this.save();
};
//indices para mejorar el rendimento de las consultas 
productShema.index({category:1});
productShema.index({subcategory:1});
productShema.index({isActive:1});
productShema.index({isFeactured:1});
productShema.index({price:1});
productShema.index({'stock.quantify':1});
productShema.index({sortOrder:1});
productShema.index({createdBy:1});
productShema.index({tags:1});

productShema.index({
    name:'text',
    description:'text',
    shortDescription:'text',
    tags: 'text'
});
module.exports = mongoose.model('Product', productShema);
const mongoose = require('mongoose');
const Subcategory = require('./Subcategory');
const { validate } = require('./Category');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del producto  es requerido'],
        trim: true,
        minlenth: [2, 'El nombre debe tener al menos 2 caracteres '],
        maxlenth: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
        type: String,
        trim: true,
        maxlenth: [1000, 'La descripcion no puede tener mas de 500 caracteres'],
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlenth: [250, 'La descripcion no puede tener mas de 250 caracteres']
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true
    },

    sku: {
        type: String,
        required: [true, 'El SKU es requerido '],
        unique: true,
        uppercase: true,
        minlenth: [3, 'El SKU deve teber ak nebis 3 caracteres'],
        maxlenth: [50, 'El SKU no puede exceder 50 caracteres']
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
        ref: 'Category',
        required: [true, 'La subcategoria  es requerida'],
        validate: {
            validator: async function (subcategoryId) {
                const Subcategory = mongoose.model('Subcategory');
                const subcategory = await Subcategory.findById(subcategoryId);
                return subcategory && subcategory.isActive;
            },

            message: 'La categoria debe existir y estar activa'

        }
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value >= 0
            },
            message: ' El precio debe ser un numero valido mayor o igual a 0'
        }
    },

    comparePrice: {
        type: Number,
        min: [0, 'El orecio de comparacion no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value === null || value === undefined)
                    return true;
                return Number.isFinite(value) && value >= 0;

            },
            message: 'El precio de comparacion deve ser un numero valido mayor o igual'
        }
    },
    cost: {
        type: Number,
        min: [0, 'El costo no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value === null || value === undefined)
                    return true;
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El costo debe ser un numero '
        }
    },
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad de stock no puede ser 0']
        },
        minsotck: {
            type: Number,
            default: 0,
            min: [0, 'El stock minimo no puede ser negativo']
        },
        trackStock: {
            type: Boolean,
            default: true
        },
    },
    dimensions: {
        weigth: {
            type: Number,
            min: [0, 'El peso no puede ser negativo']
        },
        length: {
            type: Number,
            min: [0, 'La logitud no puede ser negativa']
        },
        width: {
            type: Number,
            min: [0, 'El ancho  no puede ser negativo']
        },
        height: {
            type: Number,
            min: [0, 'La altura  no puede ser negativa']
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
            maxlenth: [200, 'El exto alternativo no puede acceder a 200 caracteres']
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    tags: {
        type: String,
        trim: true,
        lowercase: true,
        maxlenth: [50, 'Cada tag no puede exceder  50 caracteres']
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isDigital: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        trim: true,
        maxlenth: [70, 'El titulo no puede execeder a mas de 70 caracteres']
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlenth: [160, 'La descripcion no pede superra los 160 caracteres']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    updateBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

}, {
    timestamps: true
});



productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});



productSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name.toLowerCase.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

productSchema.pre('save', async function (next) {
    if (this.isModified('category') || this.isModified('subcategory')) {
        const Subcategory = mongoose.model('Subcategory');
        const subcategory = await Subcategory.findById(this.subcategory);

        if (!subcategory) {
            return next(new Error('La subcategoria espesificia no existe'));
        }

        if (subcategory.category.toString() !== this.category.toString()) {
            return next(new Error('La subcategoria no pertenece a la categoria espesificada'));
        }
    }

    next();
});

productSchema.virtual('profitMagin'.get(function () {
    if (this.price && this.cost) {
        return ((this.price - this.cost) / this.price) * 100;
    }
    return 0;
}));

productSchema.virtual('isOutOfStock').get(function () {
    if (!this.stock.trackStock) return false;
    return this.stock.quantity <= 0;
});

productSchema.virtual('primaryImage').get(function () {
    return this.images.find(img => img.isPrimary) || this.image[0];
});

productSchema.statics.findActive = function () {
    return this.find({ isActive: true }).populate('category', 'name slug').populate('subcategory', 'name').sort({ sortOrder: 1, name: 1 });
}

productSchema.statics.findByCategory = function (categoryId) {
    return this.find({
        category: categoryId,
        isActive: true
    }).populate('category', 'name slug').populate('subcategory', 'name slug').sort({ sortOrder: 1, name: 1 })
};

productSchema.statics.findBySubcategory = function (subcategoryId) {
    return this.find({
        subcategory: subcategoryId,
        isActive: true
    }).populate('category', 'name slug').populate('subcategory', 'name slug').sort({ sortOrder: 1, name: 1 })
};

productSchema.statics.findFeature = function () {
    return this.find({
        isFeactured: true,
        isActive: true
    }).populate('category', 'name slug').populate('subcategory', 'name slug').sort({ sortOrder: 1, name: 1 })
};

productSchema.methods.getFullPath = async function () {
    await this.populate([
        {path:'category', select:'name'},
        {path:'subcategory' , select:'name'}
    ]);
    return `${this.category.name}> ${$this.subcategory.name} > ${this.name}`;
};

productSchema.methods.updateStock =  function (quantity) {
    if(this.stock.trackStock){
        this.stock.quantity += quantity;
        if(this.stock.quantity < 0){
            this.stock.quantity = 0;
        }
    }
    return this.save();
}
// Indices para mejorar el rendimiento de las consultas
productSchema.index({category:1});
productSchema.index({subcategory:1});
productSchema.index({isActive:1});
productSchema.index({isFeactured:1});
productSchema.index({'stock.quiantity':1});
productSchema.index({sortOrder:1});
productSchema.index({createdBy:1});
productSchema.index({tags:1});

productSchema.index({
    name:'text',
    description:'text',
    shortDescription:'text',
    shortDescription:'text',
    tags:'text'
});

module.exports = mongoose.model('Product',productSchema)




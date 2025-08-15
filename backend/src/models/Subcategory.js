const mongoose = require('mongoose');
const Category = require('./Category');


const subcategoryShema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la subcategoria es requerido'],
        trim: true,
        minlenth: [2, 'El nombre debe tener al menos 2 caracteres '],
        maxlenth: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
        type: String,
        trim: true,
        maxlenth: [500, 'La descripcion no puede tener mas de 500 caracteres'],
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true
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
    isActive: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        match: [/^#([A-FA-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'El color debe ser en codigo Hexadecimal valido']
    },
    sortOrder: {
        type: Number,
        default: 0
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


subcategoryShema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});


subcategoryShema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name.toLowerCase.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

subcategoryShema.pre('save', async function (next) {
    if (this.isModified('category')) {
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);

        if (!category) {
            return next(new Error('Lac categoria especifica no existe'));
        }

        if (!category.isActive) {
            return next(new Error('La categoria especifica no esta activda'));
        }
    }
    next();
});


subcategoryShema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

subcategoryShema.statics.findActive = function () {
    return this.find({ isActive: true }).populate('category', 'name slug').sort({ sortOrder: 1, name: 1 });

};

categorySchema.methods.canBeDeleted = async function () {
    const Subcategory = mongoose.model('Subcategory');
    const Product = mongoose.model('Product').countDocuments({
        Subcategory: this._id
    });
    return productCount === 0;
};

subcategoryShema.methods.getFullPath = async function() {
    await this.populate('category','name');
    return `${this.category.name}> ${this.name}`;
};

subcategoryShema.index({category:1});
subcategoryShema.index({isActive:1});
subcategoryShema.index({sortOrder:1});
subcategoryShema.index({slug:1});
subcategoryShema.index({createdBy:1});

module.exports = mongoose.model('Subcategory',subcategoryShema);





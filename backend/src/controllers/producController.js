const { Product, Category, Subcategory } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getCategoryStats } = require('./categoryController');
// const { getActiveCategories } = require('./CategoryController');

const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtros para la busqueda
    const filter = {};

    // Filtro por categoria y subcategoria
    if (req.query.category) filter.category = req.query.category === 'true';
    if (req.query.subcategory) filter.subcategory = req.query.subcategory === 'true';

    // Filtros booleanos (estado destacado digital)
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.isFeatured !== undefined) filter.isFeatured = req.query.isFeatured === 'true';
    if (req.query.isDigital !== undefined) filter.isDigital = req.query.isDigital === 'true';

    // filtro por rango de precios
    if (req.query.minPrice || req.query.maxprice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice);
        if (req.query.maxprice) filter.price.$lte = parseInt(req.query.maxprice);
    }


    // Filtro de stock bajo
    if (req.query.lowStock === 'true') {
        filter.$expr = {
            $and: [
                { $eq: ['stock.trackStock', true] },
                { $lte: ['stock.quantity', '$stock.minStock'] }
            ]
        };
    }

    // Nombre o descripcion 
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } },
            { tags: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    // Consulta a la base de datos
    let query = Product.find(filter).populate('category', 'name slug').populate('subcategory', 'name slug',).populate('createdBy', 'username firstName lastName').sort({ sortOrder: 1, name: 1 });

    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }
    // Ejecutar las consultas
    const products = await query;
    const total = await Product.countDocuments(filter);
    // const totalCategories = await Category.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: products,
        pagination: req.query.page ? {
            page,
            limit,
            pages: Math.ceil(total / limit)
        } : undefined
    });
});



const getActiveProdcuts = asyncHandler(async (req, res) => {
    const products = await Product.findActive();
    res.status(200).json({
        success: true,
        data: products
    });
});


// Obtener subcategories por categoria
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    // Verificar si la categoria existe y esta activa
    const products = await Category.findByCategory(categoryId);

    return res.status(200).json({
        success: true,
        data: products
    });

});

// Obtener subcategories por categoria
const getProductsBySubcategory = asyncHandler(async (req, res) => {
    const { subcategoryId } = req.params;
    // Verificar si la categoria existe y esta activa
    const products = await Category.findByCategory(subcategoryId);
    return res.status(200).json({
        success: true,
        message: products
    });

});

const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.findFeature();
    res.status(200).json({
        success: true,
        data: products
    });
});

const getActiveSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await Subcategory.findActive();
    res.status(200).json({
        success: true,
        message: subcategories
    })
})

// Obtener una subcategorias por ID
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name slug description').populate('subcategory', 'name slug description').populate('createdBy', 'username firstNmae lastName').populate('updateBy', 'username firstName', 'lastName');
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    res.status(200).json({
        success: true,
        data: product
    });
});

// Obtener una subcategorias por ID
const getProductBySku = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() }).populate('category', 'name slug ').populate('subcategory', 'name slug ');
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    res.status(200).json({
        success: true,
        data: product
    });
});



// Crear una categoria
const createProduct = asyncHandler(async (req, res) => {
    const { name, description, shortDescription, sku, category, subcategory, price, comparePrice, cost, stock, demensions, images, isActive, isFeatured, isDigital, sortOrder, seoTitle, seoDescription } = req.body;


    const parentCategory = await Category.findById(Category);
    if (!parentCategory) {
        return res.status(400).json({
            success: false,
            message: 'La categoria especifica no existe no esta activa'
        });
    }

    const parentSubategory = await Subcategory.findById(subcategory);
    if (!parentSubategory || !parentSubategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La ctegoria especific ano existe no esta activa'
        });
    }

    if (!parentSubategory.category.toString() !== category) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoria no pertenece a la categoria especifica'
        })
    }


    // // Crear el producto
    const product = await Subcategory.create({
        name,
        description,
        shortDescription,
        sku: sku.toUpperCase(),
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock: stock || { quantity: 0, minStock: 0, trackStock: true },
        demensions,
        images,
        tags: tags || [],
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        isDigital: isDigital || false,
        sortOrder: sortOrder || 0,
        seoTitle,
        seoDescription,
        createdBy: req.user._id
    });
    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' }
    ])
    res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: subcategory
    });
});

// Actualizar una subcategoria
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(400).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }

    const { name,
        description,
        shortDescription,
        sku,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock,
        demensions,
        images,
        isActive,
        isFeatured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription } = req.body

    if (sku && sku.toUpperCase() !== product.sku) {
        const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingSku) {
            return res.status(404).json({
                success: false,
                message: 'El sku ya existe'
            });
        }
    }

    if (category || subcategory) {

        const targetCategory = category || product.category;
        const targetSubcategory = subcategory || product.subcategory;


        // Si cambia la categoria validar que exista y este activa
        const parentCategory = await Category.findById(targetCategory);
        if (!parentCategory || !parentCategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'La categoria expecifica no existe'
            });
        }

        const parentSubcategory = await Subcategory.findById(targetSubcategory);
        if (!parentSubcategory || !parentSubcategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'La subcategoria expecifica no existe'
            });
        }

        // Verificar duplicados 
        if (parentSubcategory.category.tpString() !== targetCategory.toString()) {
            return res.status(400).json({
                success: false,
                message: 'La subcategoria no perteece a la categoria expecifica'
            });
        }
    }


    // Actualizar la productos
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = description;
    if (sku !== undefined) product.sku = sku.TpUppercase();
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (price !== undefined) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (cost !== undefined) product.cost = cost;
    if (stock !== undefined) product.stock = stock;
    if (demensions !== undefined) product.dimensions = demensions;
    if (images !== undefined) product.images = images;
    if (tags !== undefined) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (isDigital !== undefined) product.isDigital = isDigital;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;
    if (seoDescription !== undefined) product.seoDescription = seoDescription;

    product.updateBy = req.user._id;
    await product.save();

    await product.populate([
        {path: 'category', select:  'name slug'},
        {path: 'subcategory', select:  'name slug'}
    ]);

    res.status(200).json({
        success: true,
        message: 'producto actualizado exitosamente',
        data: product
    });

});



// Eliminar Subcategoria
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrada'
        });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Poducto eliminado correctamente'
    });
});
// Activar o desactivar categoria
const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params._id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrada'
        });
    }

    product.isActive = !product.isActive;
    product.updateBy = req.user._id;
    await product.save();
    // Si la categoria se desactiva, desactivar subcategorias y productos asociados
    res.status(200).json({
        success: true,
        message: `Product ${product.isActive ? 'activada' : 'desactivada'} correctamente`,
        data: product
    });
});

// Actualizar stock del profucto
const updateProductStock = asyncHandler(async (req, res) => {
    const { quantity, operation = 'set' } = req.body;
    if ( quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: 'La cantidad es querida'
        });
    }

    const product = await Product.findById(req.params.id);
    if (!product){
        return res.status(400).json({
            success: false,
            message: 'Producto no encontrado '
        });
    }

    if(!product.stock.trackStock){
        return res.status(400).json({
            success:false,
            message: 'Esteproducto no maneja un control de stock'
        });
    }

    //operaciones set add subtract 
    switch (operation){
        case 'set':
            product.stock.quantify = quantity;
            break;
        case 'add':
            product.stock.quantify = quantity;
            break;
        case 'subtract':
            product.stock.quantify = Math.max(0, product.stock.quantify - quantity);
            break;
        default:
            return res.status(400).json({
                success:false,
                message: 'operacion invalida Use: set, add, subtract'
            });
    }

    product.updateBy = req.user._id;
    await product.save();
    res.status(200).json({
        success:true,
        message:'Stock actualizado esitosamente',
        data: {
            sku: product.sku,
            name: product.name,
            previousStock: product.stock.quantify,
            newStock: product.stock.quantify,
            isLowStock:product.isLowStock,
            isOutOfStock: product.isOutOfStock
        }
    });
});

// Obtener estadisticas de productos
const getPoductStats = asyncHandler(async (req, res) => {
    const stast = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProducts: {
                    $sum: 1
                },
                activateProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                featuredProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                digitalProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalValue:{$suma: '$price'},
                averagePrice:{$avg: '$price'}
            }
        }
    ]);
    // Productos con stock bajo
    const lowStockProduct = await Product.find({
        'stock.trackStock': true,
        $expr: { $lte: ['stock.quanrify', 'stock.minStock']}
    })
    .select('name sku stock.quantify stock.minStock')
    .limit(10);
    const expensiveProduct = await Product.find({isActive})
    .sort({ price: -1})
    .limit(5)
    .select('name sku price');
    

    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalProducts: 0,
                activateProducts: 0,
                featuredProducts: 0,
                digitalProducts: 0,
                totalValue: 0,
                averagePrice: 0,
            },
            lowStockProduct,
            expensiveProduct,
        }
    })
});
module.exports = {
    getProducts,
    getActiveProdcuts,
    getProductById,
    getProductsByCategory,
    getProductsBySubcategory,
    getFeaturedProducts,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateProductStock,
    getPoductStats
};
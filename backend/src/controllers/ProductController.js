const { Product, Category, Subcategory } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getCategoryStats } = require('./CategoryController');
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
    await subcategory.save();
    await subcategory.populate('category', 'name slug');
    res.status(200).json({
        success: true,
        data: subcategory
    });

});



// Eliminar Subcategoria
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        });
    }

    // Verificar si se puede eliminar
    const canDelete = await subcategory.canDelete();
    if (!canDelete) {
        return res.status(400).json({
            success: false,
            message: 'No se puede eliminar esta la subcategoria porque tiene   productos  asociados'
        });
    }

    await Subcategory.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Categoria eliminada correctamente'
    });
});
// Activar o desactivar categoria
const toggleSubcategoryStatus = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params._id);
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        });
    }

    subcategory.isActive = !subcategory.isActive;
    subcategory.updateBy = req.user._id;
    await subcategory.save();
    // Si la categoria se desactiva, desactivar subcategorias y productos asociados
    if (!subcategory.isActive) {
        await Subcategory.updateMany(
            { category: subcategory._id },
            { isActive: false, updateBy: req.user._id }

        );
    }
    res.status(200).json({
        success: true,
        message: `categoria ${subcategory.isActive ? 'activada' : 'desactivada'} correctamente`,
        data: subcategory
    });
});

// Ordenar categoria
const reorderSubcategories = asyncHandler(async (req, res) => {
    const { subcategoryIds } = req.body;
    if (!Array.isArray(subcategoryIds)) {
        return res.status(400).json({
            success: false,
            message: 'Se re quiere un array de ID de subcategorias'
        });
    }
    // Actualizar el orden de las categorias
    const updatePromises = subcategoryIds.map((subcategoryId, index) => (
        Category.findByIdAndUpdate(
            subcategoryId,
            {
                sortOrder: index + 1,
                updateBy: req.user._id
            },
            { new: true }
        )
    )
    );
    await Promise.all(updatePromises);
    res.status(200).json({
        message: 'Orden de subcategorias actualizado correctamente'
    });
});

// Obtener estadisticas de categorias 
const getSubcategoryStats = asyncHandler(async (req, res) => {
    const stast = await Subcategory.aggregate([
        {
            $group: {
                _id: null,
                totalSubcategories: {
                    $sum: 1
                },
                activateSubcategories: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
            }
        }
    ]);
    const subcategoriesWithSubcount = await Subcategory.aggregate([
        {
            $lookup: {
                from: '$categories',
                localField: '_id',
                foreignField: 'category',
                as: 'categoryInfo'
            }
        },
        {
            $project: {
                name: 1,
                categoryName: { $arrayElemAt: ['$categoryInfo. name', 0] },
                productsCount: { $size: '$producs' }
            }
        },
        { $sort: { productsCount: -1 } },
        { $limit: 5 }
    ]);
    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalSubcategories: 0,
                activeSubcategories: 0
            },
            topSubcategories: subcategoriesWithSubcount
        }
    })
});
module.exports = {
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
}

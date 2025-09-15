const { Category, Subcategory, Product } = require("../models");
const { asyncHandler } = require("../middlewares/errorHandler");

// Obtener todas las categorias
const getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filtros para la busqueda
  const filter = {};
  // Activo /Inactivo
  if (req.query.isActive !== undefined)
    filter.isActive = req.body.isActive === "true";
  // Nombre
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  // Consulta a la base de datos
  let query = Category.find(filter)
    .populate("createdAt", "username firstName lastName")
    .sort({ sortOrder: 1, name: 1 });
  // .populate('subcategoriesCount').populate('productsCount')

  if (req.query.page) {
    query = query.skip(skip).limit(limit);
  }
  // Ejecutar las consultas
  const categories = await query;
  const total = await Category.countDocuments(filter);
  // const totalCategories = await Category.countDocuments(filter);
  res.status(200).json({
    success: true,
    data: categories,
    pagination: req.query.page
      ? {
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      : undefined,
  });
});

const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findActive();
  res.status(200).json({
    success: true,
    data: categories,
  });
});
// Obtener una categoria por ID
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate("createdBy", "username firstName lastName").populate("updateBy", "username firstName lastName");
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }
  // Obtener subcategorias de este categoria
  const subcategories = await Subcategory.find({
    category: category._id,
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 });
  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      subcategories,
    },
  });
});

// Crear una categoria
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, sortOrder, isActive } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "El nombre de la categoria es requerido",
    });
  }

  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: "Ya existe una categoria con este nombre",
    });
  }
  // Crear la categoria
  const category = await Category.create({
    name,
    description,
    icon,
    sortOrder: sortOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id,
  });
  res.status(201).json({
    success: true,
    data: category,
  });
});

// Actualizar una categoria
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(400).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }

  const { name, description, icon, color, sortOrder, isActive } = req.body;
  // Verificar duplicados
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoria con este nombre",
      });
    }
  }

  // Actualizar la categoria
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (icon != undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;
  category.updateBy = req.user._id;
  await category.save();
  res.status(200).json({
    success: true,
    data: category,
  });
});
// Eliminar categoria
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }

  // Verificar si se puede eliminar
  const canDelete = await category.canDelete();
  if (!canDelete) {
    return res.status(400).json({
      success: false,
      message:
        "No se puede eliminar esta categoria porque tiene subcategorias y productos",
    });
  }

  await Category.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Categoria eliminada correctamente",
  });
  
});
// Activar o desactivar categoria
const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }
  category.isActive = !category.isActive;
  category.updateBy = req.user._id;
  await category.save();
  // Si la categoria se desactiva, desactivar subcategorias y productos asociados
  if (!category.isActive) {
    await Subcategory.updateMany(
      { category: category._id },
      { isActive: false, updateBy: req.user._id }
    );
    await Product.updateMany(
      { category: category._id },
      { isActive: false, updateBy: req.user._id }
    );
  }
  res.status(200).json({
    success: true,
    message: `categoria ${
      category.isActive ? "activada" : "desactivada"
    } correctamente`,
    data: category,
  });
});

// Ordenar categoria
const reorderCategories = asyncHandler(async (req, res) => {
  const { categoryIds } = req.body;
  if (!Array.isArray(categoryIds)) {
    return res.status(400).json({
      success: false,
      message: "Se re quiere un array de ID de categorias",
    });
  }
  // Actualizar el orden de las categorias
  const updatePromises = categoryIds.map((categoryId, index) =>
    Category.findByIdAndUpdate(
      categoryId,
      {
        sortOrder: index + 1,
        updateBy: req.user._id,
      },
      { new: true }
    )
  );
  await Promise.all(updatePromises);
  res.status(200).json({
    message: "Orden de categorias actualizado correctamentes",
  });
});

// Obtener estadisticas de categorias
const getCategoryStats = asyncHandler(async (req, res) => {
  const stast = await Category.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: {
          $sum: 1,
        },
        activateCategories: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
      },
    },
  ]);
  const categoriesWithSubcount = await Category.aggregate([
    {
      $lookup: {
        from: "$subcategories",
        localField: "_id",
        foreignField: "category",
        as: "subcategories",
      },
    },
    {
      $project: {
        name: 1,
        subcategoryCount: { $size: "$subcategories" },
      },
    },
    { $sort: { subcategoryCount: -1 } },
    { $limit: 5 },
  ]);
  res.status(200).json({
    success: true,
    data: {
      stats: stast[0] || {
        totalCategories: 0,
        activeCategories: 0,
      },
      topCategories: categoriesWithSubcount,
    },
  });
});
module.exports = {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  reorderCategories,
  getCategoryStats,
};

const { Subcategory, Category, Product } = require("../models");
const { asyncHandler } = require("../middlewares/errorHandler");
const { getCategoryStats } = require("./categoryController");
// const { getActiveCategories } = require('./CategoryController');

// Obtener todas las categorias
const getSubcategories = asyncHandler(async (req, res) => {
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
  let query = Subcategory.find(filter)
    .populate("category", "name slug isActive")
    .populate("createdBy", "username firstName lastName")
    // .populate("productsCount")
    .sort({ sortOrder: 1, name: 1 });

  if (req.query.page) {
    query = query.skip(skip).limit(limit);
  }
  // Ejecutar las consultas
  const subcategories = await query;
  const total = await Category.countDocuments(filter);
  res.status(200).json({
    success: true,
    data: subcategories,
    pagination: req.query.page
      ? {
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      : undefined,
  });
});

// Obtener subcategories por categoria
const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  
  // Verificar si la categoria existe y esta activa
  const category = await Category.findById(categoryId);
 
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }
  const subcategories = await Subcategory.findByIdCategory(categoryId);
  res.status(200).json({
    success: true,
    data: subcategories,
  });
});

const getActiveSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await Subcategory.findActive();
  res.status(200).json({
    success: true,
    message: subcategories,
  });
});

// Obtener una subcategorias por ID
const getSubcategoryById = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id)
    .populate("category", "name slug description")
    .populate("createdBy", "username firstNmae lastName")
    .populate("updateBy", "username firstName", "lastName");
  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }
  // Obtener Productos de esta subcategoria de este categoria
  const products = await Product.find({
    subcategory: subcategory._id,
    isActive: true,
  })
    .select("name price stock.quantity isActive")
    .sort({ sortOrder: 1, name: 1 });
  res.status(200).json({
    success: true,
    data: {
      ...subcategory.toObject(),
      products,
    },
  });
});

// Crear una categoria
const createSubcategory = asyncHandler(async (req, res) => {
  const { name, description, category, categoryId, icon, sortOrder, isActive } =
    req.body;
  const targetCategoryId = categoryId || category;
  console.log(targetCategoryId);

  if (!name || !targetCategoryId) {
    return res.status(400).json({
      success: false,
      message: "El nombre y la categoria son requeridos",
    });
  }

  const parentCategory = await Category.findById(targetCategoryId);
  if (!parentCategory) {
    return res.status(400).json({
      success: false,
      message: "La categoria especifica no existe",
    });
  }
  console.log(parentCategory.isActive);
  if (!parentCategory.isActive) {
    return res.status(400).json({
      success: false,
      message: "La categoria especifica no existe",
    });
  }
  // Verficiar si la subcategoria ya existe en esa categoria
  const existingSubcategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    category: targetCategoryId,
  });

  if (existingSubcategory) {
    return res.status(400).json({
      success: false,
      message: "Ya existe una subcategoria con este nombre categoria",
    });
  }

  // Crear la subcategoria
  const subcategory = await Subcategory.create({
    name,
    description,
    category: targetCategoryId,
    icon,
    sortOrder: sortOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id,
  });
  await subcategory.populate("category", "name slug");
  res.status(201).json({
    success: true,
    message: "Subcategoria creada exitosa",
    data: subcategory,
  });
});


// Actualizar una subcategoria
const updateSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    return res.status(400).json({
      success: false,
      message: "Categoria no encontrada",
    });
  }

  const {
    name,
    description,
    category,
    categoryId,
    icon,
    color,
    sortOrder,
    isActive,
  } = req.body;

  const targetCategoryId = categoryId || category;
  // Si cambia la categoria validar que exista y este activa
  if (
    targetCategoryId &&
    targetCategoryId !== subcategory.category.toString()
  ) {
    const parentCategory = await Category.findById(targetCategoryId);
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: "La categoria expecifica no existe",
      });
    }

console.log("Entreo a el actualizar");
    if (!parentCategory.isActivate) {
      return res.status(400).json({
        success: false,
        message: "La categoria especifica no esta activa",
      });
    }
  }

  // Verificar duplicados
  if (
    (name && name !== subcategory.name) ||
    (targetCategoryId && targetCategoryId !== subcategory.category.toString())
  ) {
    const existingSubcategory = await Subcategory.findOne({
      name: { $regex: new RegExp(`^${name || subcategory.name}$`, "i") },
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una subcategoria con este nombre en esta categoria",
      });
    }
  }

  // Actualizar la subcategoria
  if (name) subcategory.name = name;
  if (description !== undefined) subcategory.description = description;
  if (targetCategoryId !== undefined) subcategory.category = targetCategoryId;

  if (icon != undefined) subcategory.icon = icon;
  if (color !== undefined) subcategory.color = color;
  if (sortOrder !== undefined) subcategory.sortOrder = sortOrder;
  if (isActive !== undefined) subcategory.isActive = isActive;
  subcategory.updateBy = req.user._id;
  await subcategory.save();
  await subcategory.populate("category", "name slug");
  res.status(200).json({
    success: true,
    data: subcategory,
  });
});

// Eliminar Subcategoria
const deleteSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: "Subcategoria no encontrada",
    });
  }

  // Verificar si se puede eliminar
  const canDelete = await subcategory.canBeDelete();
  if (!canDelete) {
    return res.status(400).json({
      success: false,
      message:
        "No se puede eliminar esta la subcategoria porque tiene   productos  asociados",
    });
  }

  await Subcategory.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Categoria eliminada correctamente",
  });
});
// Activar o desactivar categoria
const toggleSubcategoryStatus = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  console.log(req.params);
  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: "Subcategoria no encontrada",
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
    message: `categoria ${
      subcategory.isActive ? "activada" : "desactivada"
    } correctamente`,
    data: subcategory,
  });
});

// Ordenar categoria
const reorderSubcategories = asyncHandler(async (req, res) => {
  const { subcategoryIds } = req.body;
  if (!Array.isArray(subcategoryIds)) {
    return res.status(400).json({
      success: false,
      message: "Se re quiere un array de ID de subcategorias",
    });
  }
  // Actualizar el orden de las categorias
  const updatePromises = subcategoryIds.map((subcategoryId, index) =>
    Category.findByIdAndUpdate(
      subcategoryId,
      {
        sortOrder: index + 1,
        updateBy: req.user._id,
      },
      { new: true }
    )
  );
  await Promise.all(updatePromises);
  res.status(200).json({
    message: "Orden de subcategorias actualizado correctamente",
  });
});

// Obtener estadisticas de categorias
const getSubcategoryStats = asyncHandler(async (req, res) => {
  const stast = await Subcategory.aggregate([
    {
      $group: {
        _id: null,
        totalSubcategories: {
          $sum: 1,
        },
        activateSubcategories: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
      },
    },
  ]);
  const subcategoriesWithSubcount = await Subcategory.aggregate([
    {
      $lookup: {
        from: "$categories",
        localField: "_id",
        foreignField: "category",
        as: "categoryInfo",
      },
    },
    {
      $project: {
        name: 1,
        categoryName: { $arrayElemAt: ["$categoryInfo. name", 0] },
        productsCount: { $size: { $ifNull: ["$products", []] } },
      },
    },
    { $sort: { productsCount: -1 } },
    { $limit: 5 },
  ]);
  res.status(200).json({
    success: true,
    data: {
      stats: stast[0] || {
        totalSubcategories: 0,
        activeSubcategories: 0,
      },
      topSubcategories: subcategoriesWithSubcount,
    },
  });
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
  getSubcategoryStats,
};

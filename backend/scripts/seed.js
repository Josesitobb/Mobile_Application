// Script para crear datos iniciales en la base de datos
// ...existing code...
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User, Category, Subcategory, Product } = require('../src/models');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Ya existe un usuario administrador:', existingAdmin.username);
      return existingAdmin;
    }

    // Crear usuario administrador
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@ejemplo.com',
      password: 'admin123',
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'admin',
      phone: '3001234567',
      isActive: true
    });

    console.log('Usuario administrador creado:', adminUser.username);
    return adminUser;
  } catch (error) {
    console.error('Error creando usuario admin:', error);
    throw error;
  }
};

const createCoordinadorUser = async () => {
  try {
    // Verificar si ya existe un coordinador
    const existingCoordinador = await User.findOne({ 
      role: 'coordinador',
      username: 'coordinador'
    });
    
    if (existingCoordinador) {
      console.log('Ya existe un usuario coordinador:', existingCoordinador.username);
      return existingCoordinador;
    }

    // Crear usuario coordinador
    const coordinadorUser = await User.create({
      username: 'coordinador',
      email: 'coordinador@ejemplo.com',
      password: 'coord123',
      firstName: 'Coordinador',
      lastName: 'Sistema',
      role: 'coordinador',
      phone: '3001234568',
      isActive: true
    });

    console.log('Usuario coordinador creado:', coordinadorUser.username);
    return coordinadorUser;
  } catch (error) {
    console.error('Error creando usuario coordinador:', error);
    throw error;
  }
};

const createSampleCategories = async (adminUser) => {
  try {
    const existingCategories = await Category.find();
    
    if (existingCategories.length > 0) {
      console.log('Ya existen categorías en la base de datos');
      return existingCategories;
    }

    const categories = [
      {
        name: 'Electrónicos',
        description: 'Dispositivos y equipos electrónicos',
        color: '#3B82F6',
        icon: '💻',
        sortOrder: 1,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: 'Ropa y Accesorios',
        description: 'Vestimenta y complementos',
        color: '#EF4444',
        icon: '👕',
        sortOrder: 2,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: 'Hogar y Jardín',
        description: 'Artículos para el hogar y jardinería',
        color: '#10B981',
        icon: '🏠',
        sortOrder: 3,
        createdBy: adminUser._id,
        isActive: true
      }
    ];

    const createdCategories = await Category.create(categories);
    console.log('Categorías de ejemplo creadas:', createdCategories.length);
    return createdCategories;
  } catch (error) {
    console.error('Error creando categorías:', error);
    throw error;
  }
};

const createSampleSubcategories = async (categories, adminUser) => {
  try {
    const existingSubcategories = await Subcategory.find();
    
    if (existingSubcategories.length > 0) {
      console.log('Ya existen subcategorías en la base de datos');
      return existingSubcategories;
    }

    const subcategories = [
      // Electrónicos
      {
        name: 'Smartphones',
        description: 'Teléfonos inteligentes',
        category: categories[0]._id,
        color: '#3B82F6',
        icon: '📱',
        sortOrder: 1,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: 'Laptops',
        description: 'Computadoras portátiles',
        category: categories[0]._id,
        color: '#3B82F6',
        icon: '💻',
        sortOrder: 2,
        createdBy: adminUser._id,
        isActive: true
      },
      // Ropa y Accesorios
      {
        name: 'Camisetas',
        description: 'Camisetas y playeras',
        category: categories[1]._id,
        color: '#EF4444',
        icon: '👕',
        sortOrder: 1,
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: 'Zapatos',
        description: 'Calzado en general',
        category: categories[1]._id,
        color: '#EF4444',
        icon: '👟',
        sortOrder: 2,
        createdBy: adminUser._id,
        isActive: true
      },
      // Hogar y Jardín
      {
        name: 'Muebles',
        description: 'Mobiliario para el hogar',
        category: categories[2]._id,
        color: '#10B981',
        icon: '🪑',
        sortOrder: 1,
        createdBy: adminUser._id,
        isActive: true
      }
    ];

    const createdSubcategories = await Subcategory.create(subcategories);
    console.log('Subcategorías de ejemplo creadas:', createdSubcategories.length);
    return createdSubcategories;
  } catch (error) {
    console.error('Error creando subcategorías:', error);
    throw error;
  }
};

const createSampleProducts = async (categories, subcategories, adminUser) => {
  try {
    const existingProducts = await Product.find();
    
    if (existingProducts.length > 0) {
      console.log('Ya existen productos en la base de datos');
      return existingProducts;
    }

    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Smartphone Apple iPhone 15 Pro con chip A17 Pro',
        shortDescription: 'iPhone 15 Pro - Último modelo',
        sku: 'IPH15PRO001',
        category: categories[0]._id,
        subcategory: subcategories[0]._id,
        price: 1299.99,
        comparePrice: 1399.99,
        cost: 800.00,
        stock: {
          quantity: 50,
          minStock: 10,
          trackStock: true
        },
        images: [
          {
            url: 'https://example.com/iphone15pro.jpg',
            alt: 'iPhone 15 Pro',
            isPrimary: true
          }
        ],
        tags: ['apple', 'smartphone', 'premium'],
        isFeatured: true,
        sortOrder: 1,
        createdBy: adminUser._id
      },
      {
        name: 'MacBook Air M2',
        description: 'Laptop Apple MacBook Air con chip M2, pantalla de 13.6 pulgadas',
        shortDescription: 'MacBook Air M2 - Ultrabook',
        sku: 'MBA13M2001',
        category: categories[0]._id,
        subcategory: subcategories[1]._id,
        price: 1199.99,
        cost: 750.00,
        stock: {
          quantity: 25,
          minStock: 5
        },
          tags: ['apple', 'smartphone', 'premium'],
          trackStock: true,
        
        images: [
          {
            url: 'https://example.com/macbookair.jpg',
            alt: 'MacBook Air M2',
            isPrimary: true
          }
        ],
        tags: ['apple', 'laptop', 'ultrabook'],
        isFeatured: true,
        sortOrder: 2,
        createdBy: adminUser._id
      },
      {
        name: 'Camiseta Básica Algodón',
        description: 'Camiseta básica de algodón 100% en varios colores',
        shortDescription: 'Camiseta básica de algodón',
        sku: 'CAM001BAS',
        category: categories[1]._id,
        subcategory: subcategories[2]._id,
        price: 19.99,
        cost: 8.00,
        stock: {
          quantity: 200,
          minStock: 50,
          trackStock: true
        },
        images: [
          {
            url: 'https://example.com/camiseta-basica.jpg',
            alt: 'Camiseta Básica',
            isPrimary: true
          }
        ],
        tags: ['ropa', 'camiseta', 'algodón', 'básica'],
        sortOrder: 3,
        createdBy: adminUser._id
      }
    ];

    const createdProducts = await Product.create(products);
    console.log('Productos de ejemplo creados:', createdProducts.length);
    return createdProducts;
  } catch (error) {
    console.error('Error creando productos:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seeding de la base de datos...\n');

    // Conectar a la base de datos
    await connectDB();

    // Crear usuarios
    console.log('👤 Creando usuarios...');
    const adminUser = await createAdminUser();
    const coordinadorUser = await createCoordinadorUser();

    // Crear categorías
    console.log('\n📁 Creando categorías...');
    const categories = await createSampleCategories(adminUser);

    // Crear subcategorías
    console.log('\n📂 Creando subcategorías...');
    const subcategories = await createSampleSubcategories(categories, adminUser);

    // Crear productos
    console.log('\n🛍️ Creando productos...');
    const products = await createSampleProducts(categories, subcategories, adminUser);

    console.log('\n✅ Seeding completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Usuarios: 2 (admin, coordinador)`);
    console.log(`- Categorías: ${categories.length}`);
    console.log(`- Subcategorías: ${subcategories.length}`);
    console.log(`- Productos: ${products.length}`);

    console.log('\n🔐 Credenciales de acceso:');
    console.log('Admin: admin / admin123');
    console.log('Coordinador: coordinador / coord123');

  } catch (error) {
    console.error('❌ Error en el seeding:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

require('./registerMock');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Category = require('./models/Category');
const Product = require('./models/Product');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/odoocafe');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedMenu = async () => {
  try {
    await connectDB();

    // 1. Wipe only Categories and Products
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Old Menu Cleared!');

    // 2. Create Premium Cafe Categories
    const categories = await Category.insertMany([
      { name: 'Artisanal Coffee', color: '#6b4226' }, // Dark Brown
      { name: 'Signature Frappes', color: '#0ea5e9' }, // Light Blue
      { name: 'Gourmet Bites', color: '#f59e0b' }, // Amber
      { name: 'Artisan Pastries', color: '#ec4899' }, // Pink
      { name: 'Premium Teas', color: '#10b981' } // Green
    ]);

    // 3. Create Premium Cafe Products with Costly INR Prices
    const productsToInsert = [
      // Artisanal Coffee
      { name: 'Caramel Macchiato', price: 320, category: categories[0]._id, kdsAssigned: true },
      { name: 'Hazelnut Latte', price: 350, category: categories[0]._id, kdsAssigned: true },
      { name: 'Ethiopian Pour Over', price: 400, category: categories[0]._id, kdsAssigned: true },
      { name: 'Classic Cortado', price: 280, category: categories[0]._id, kdsAssigned: true },
      
      // Signature Frappes
      { name: 'Matcha Green Tea Frappe', price: 420, category: categories[1]._id, kdsAssigned: true },
      { name: 'Mocha Cookie Crumble', price: 450, category: categories[1]._id, kdsAssigned: true },
      { name: 'Vanilla Bean Creme', price: 380, category: categories[1]._id, kdsAssigned: true },
      { name: 'Iced Caramel Cloud', price: 390, category: categories[1]._id, kdsAssigned: true },

      // Gourmet Bites
      { name: 'Truffle Mushroom Croissant', price: 480, category: categories[2]._id, kdsAssigned: true },
      { name: 'Smoked Salmon Bagel', price: 650, category: categories[2]._id, kdsAssigned: true },
      { name: 'Avocado Sourdough Toast', price: 550, category: categories[2]._id, kdsAssigned: true },
      { name: 'Pesto Caprese Panini', price: 520, category: categories[2]._id, kdsAssigned: true },

      // Artisan Pastries
      { name: 'New York Cheesecake', price: 450, category: categories[3]._id, kdsAssigned: true },
      { name: 'Dark Chocolate Tart', price: 400, category: categories[3]._id, kdsAssigned: true },
      { name: 'Almond Biscotti (2pcs)', price: 250, category: categories[3]._id, kdsAssigned: true },
      { name: 'Red Velvet Cupcake', price: 300, category: categories[3]._id, kdsAssigned: true },

      // Premium Teas & Extras
      { name: 'Earl Grey Lavender Tea', price: 280, category: categories[4]._id, kdsAssigned: true },
      { name: 'Chamomile Infusion', price: 260, category: categories[4]._id, kdsAssigned: true },
      { name: 'Sparkling Water (Perrier)', price: 250, category: categories[4]._id, kdsAssigned: false }, // Ready to grab
      { name: 'Kombucha (Berry)', price: 350, category: categories[4]._id, kdsAssigned: false } // Ready to grab
    ];

    await Product.insertMany(productsToInsert);
    console.log('20 Premium Cafe Items Seeded Successfully!');

    console.log('MENU SEEDING SUCCESS!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

seedMenu();

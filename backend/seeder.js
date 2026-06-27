require('./registerMock');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Table = require('./models/Table');
const Floor = require('./models/Floor'); 
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const OrderEvent = require('./models/OrderEvent');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/odoocafe');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // 1. Wipe everything to prevent duplicates
    if(OrderEvent) await OrderEvent.deleteMany();
    await OrderItem.deleteMany();
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Table.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Data Cleared!');

    // Note: We intentionally do NOT seed dummy users. Users must register manually via the UI.

    // 3. Create Dummy Floor and 10 Tables
    let floorId = null;
    if (Floor) {
       const floor = await Floor.create({ name: 'Main Floor' });
       floorId = floor._id;
    }
    const tables = Array.from({ length: 10 }, (_, i) => ({
      tableNumber: `${101 + i}`,
      seats: i % 2 === 0 ? 4 : 2,
      status: 'Vacant',
      floor: floorId
    }));
    await Table.insertMany(tables);
    console.log('10 Tables Seeded!');

    // 4. Create 5 Categories
    const categories = await Category.insertMany([
      { name: 'Coffee', color: '#4f46e5' },
      { name: 'Pastries', color: '#f59e0b' },
      { name: 'Meals', color: '#10b981' },
      { name: 'Desserts', color: '#ec4899' },
      { name: 'Beverages', color: '#06b6d4' }
    ]);

    // 5. Create 20 Products
    const productNames = [
      'Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha',
      'Croissant', 'Muffin', 'Bagel', 'Scone', 'Cinnamon Roll',
      'Avocado Toast', 'Chicken Sandwich', 'Caesar Salad', 'Burger', 'Pasta',
      'Cheesecake', 'Brownie', 'Tiramisu', 'Iced Tea', 'Lemonade'
    ];
    const productsToInsert = productNames.map((name, i) => {
      const catIndex = Math.floor(i / 4); // 4 items per category
      return {
        name,
        description: `Premium ${name}`,
        price: (Math.random() * 10 + 3).toFixed(2),
        category: categories[catIndex]._id,
        kdsAssigned: true
      };
    });
    await Product.insertMany(productsToInsert);
    console.log('20 Menu Items Seeded!');

    console.log('DATABASE SEEDING SUCCESS!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

importData();

require('./registerMock');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Table = require('./models/Table');
const Product = require('./models/Product');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/odoocafe');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const generateOrderNumber = () => {
  return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
};

const seedHistory = async () => {
  try {
    await connectDB();

    const tables = await Table.find();
    const products = await Product.find();

    if (tables.length === 0 || products.length === 0) {
      console.log('No tables or products found. Please run seeder.js first.');
      process.exit(1);
    }

    const numOrdersToGenerate = 150;
    console.log(`Generating ${numOrdersToGenerate} historical orders...`);

    const now = new Date();
    
    const ordersToInsert = [];
    let itemsToInsert = [];

    for (let i = 0; i < numOrdersToGenerate; i++) {
      // Random date within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      orderDate.setHours(orderDate.getHours() - hoursAgo);
      orderDate.setMinutes(orderDate.getMinutes() - minutesAgo);

      const table = tables[Math.floor(Math.random() * tables.length)];
      
      // Determine number of items for this order (1 to 4)
      const numItems = Math.floor(Math.random() * 4) + 1;
      let subtotal = 0;
      const currentOrderItems = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.price;
        const lineTotal = unitPrice * quantity;
        
        subtotal += lineTotal;
        
        currentOrderItems.push({
          product: product._id,
          quantity,
          unitPrice,
          kdsStatus: 'Completed'
        });
      }

      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const orderId = new mongoose.Types.ObjectId();

      ordersToInsert.push({
        _id: orderId,
        orderNumber: generateOrderNumber(),
        table: table._id,
        channel: Math.random() > 0.5 ? 'Cashier' : 'QR',
        subtotal,
        tax,
        total,
        discount: 0,
        status: 'Completed',
        paymentStatus: 'Paid',
        paymentMethod: Math.random() > 0.5 ? 'Cashier' : 'Online',
        createdAt: orderDate,
        updatedAt: orderDate
      });

      currentOrderItems.forEach(item => {
        itemsToInsert.push({
          ...item,
          order: orderId
        });
      });
    }

    await Order.insertMany(ordersToInsert);
    await OrderItem.insertMany(itemsToInsert);

    console.log(`Successfully inserted ${ordersToInsert.length} orders and ${itemsToInsert.length} order items!`);
    process.exit(0);

  } catch (error) {
    console.error(`Error with data generation: ${error}`);
    process.exit(1);
  }
};

seedHistory();

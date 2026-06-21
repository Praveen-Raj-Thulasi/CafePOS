require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Product = require('./models/Product');
const Table = require('./models/Table');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find();
    const tables = await Table.find();

    if (!products.length || !tables.length) {
      console.log('Ensure you have products and tables in the DB first!');
      process.exit(1);
    }

    const startDate = new Date('2026-06-14T00:00:00Z');
    const endDate = new Date('2026-06-21T00:00:00Z');
    
    const orders = [];
    const orderItems = [];

    // Loop through each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // 5 to 15 orders per day
      const numOrders = Math.floor(Math.random() * 11) + 5; 
      
      for (let i = 0; i < numOrders; i++) {
        // Random time during the day (9 AM to 9 PM)
        const orderDate = new Date(d);
        orderDate.setHours(9 + Math.floor(Math.random() * 12));
        orderDate.setMinutes(Math.floor(Math.random() * 60));

        const orderId = new mongoose.Types.ObjectId();
        const table = tables[Math.floor(Math.random() * tables.length)];
        const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
        const channel = ['QR', 'Cashier', 'Waitstaff'][Math.floor(Math.random() * 3)];
        
        let subtotal = 0;
        const numItems = Math.floor(Math.random() * 4) + 1;
        
        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 3) + 1;
          const price = product.price;
          
          subtotal += (price * qty);

          orderItems.push({
            _id: new mongoose.Types.ObjectId(),
            order: orderId,
            product: product._id,
            quantity: qty,
            unitPrice: price,
            kdsStatus: 'Completed',
            priorityScore: 0,
            createdAt: orderDate,
            updatedAt: orderDate
          });
        }

        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        orders.push({
          _id: orderId,
          table: table._id,
          channel: channel,
          status: 'Completed',
          paymentStatus: 'Paid',
          paymentMethod: ['Online', 'Cashier', 'Servant'][Math.floor(Math.random() * 3)],
          subtotal: subtotal,
          tax: tax,
          discount: 0,
          total: total,
          orderNumber: orderNumber,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }

    console.log(`Generated ${orders.length} orders and ${orderItems.length} items. Inserting...`);
    
    // Use raw collection insert to bypass mongoose auto-timestamps overwriting dates
    await Order.collection.insertMany(orders);
    await OrderItem.collection.insertMany(orderItems);

    console.log('Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
};

seedData();

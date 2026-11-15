const bcrypt = require('bcryptjs');
const { User, Supplier, Customer, Product, StockLog } = require('./models');

module.exports = async () => {
  if (!(await User.countDocuments())) {
    await User.create({
      name: 'Administrator',
      email: (process.env.ADMIN_EMAIL || 'admin@retail.com').toLowerCase(),
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10),
    });
  }

  if (process.env.SEED_DEMO === 'false' || (await Product.countDocuments())) return;

  const [gupta, bharat, sunrise] = await Supplier.insertMany([
    { name: 'Gupta Wholesale Traders', phone: '9811100001', email: 'orders@guptawholesale.in', address: 'Sadar Bazaar, Delhi' },
    { name: 'Bharat Stationers', phone: '9811100002', email: 'sales@bharatstationers.in', address: 'Nai Sarak, Delhi' },
    { name: 'Sunrise Electricals', phone: '9811100003', email: 'hello@sunriseelectricals.in', address: 'Lajpat Rai Market, Delhi' },
  ]);

  await Customer.insertMany([
    { name: 'Rohit Sharma', phone: '9876543210', email: 'rohit@example.com', address: 'Sohna, Haryana' },
    { name: 'Priya Verma', phone: '9812345678', email: 'priya@example.com', address: 'Gurugram, Haryana' },
    { name: 'Ankit Yadav', phone: '9898989898', email: 'ankit@example.com', address: 'Bhiwani, Haryana' },
    { name: 'Neha Singh', phone: '9765432100', email: 'neha@example.com', address: 'Rohtak, Haryana' },
  ]);

  const products = await Product.insertMany([
    { name: 'Basmati Rice 5kg', sku: 'RICE-5K', category: 'Grocery', price: 520, stock: 48, reorderLevel: 15, supplier: gupta._id },
    { name: 'Sunflower Oil 1L', sku: 'OIL-1L', category: 'Grocery', price: 165, stock: 9, reorderLevel: 15, supplier: gupta._id },
    { name: 'Toor Dal 1kg', sku: 'DAL-1K', category: 'Grocery', price: 145, stock: 32, reorderLevel: 12, supplier: gupta._id },
    { name: 'Tea Leaves 500g', sku: 'TEA-500', category: 'Grocery', price: 240, stock: 26, reorderLevel: 10, supplier: gupta._id },
    { name: 'Notebook A4 (Pack of 5)', sku: 'NB-A4-5', category: 'Stationery', price: 250, stock: 60, reorderLevel: 20, supplier: bharat._id },
    { name: 'Gel Pen Box of 10', sku: 'PEN-GEL-10', category: 'Stationery', price: 120, stock: 4, reorderLevel: 12, supplier: bharat._id },
    { name: 'LED Bulb 9W', sku: 'LED-9W', category: 'Electrical', price: 90, stock: 5, reorderLevel: 10, supplier: sunrise._id },
    { name: 'Extension Board 4 Socket', sku: 'EXT-4S', category: 'Electrical', price: 380, stock: 18, reorderLevel: 8, supplier: sunrise._id },
    { name: 'Bath Soap (Pack of 4)', sku: 'SOAP-4P', category: 'Personal Care', price: 140, stock: 35, reorderLevel: 12, supplier: gupta._id },
    { name: 'Shampoo 340ml', sku: 'SHAM-340', category: 'Personal Care', price: 215, stock: 22, reorderLevel: 10, supplier: gupta._id },
  ]);

  await StockLog.insertMany(products.map((p) => ({ product: p._id, change: p.stock, balance: p.stock, reason: 'Opening stock' })));
};

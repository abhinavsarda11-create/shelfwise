const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const options = { timestamps: true };

const User = model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, options));

const Supplier = model('Supplier', new Schema({
  name: { type: String, required: [true, 'Supplier name is required'], trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'] },
  address: { type: String, trim: true },
}, options));

const Customer = model('Customer', new Schema({
  name: { type: String, required: [true, 'Customer name is required'], trim: true },
  phone: { type: String, required: [true, 'Phone is required'], trim: true, match: [/^\d{10}$/, 'Phone must be 10 digits'] },
  email: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'] },
  address: { type: String, trim: true },
}, options));

const Product = model('Product', new Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
  reorderLevel: { type: Number, required: [true, 'Reorder level is required'], default: 10, min: [0, 'Reorder level cannot be negative'] },
  supplier: ref('Supplier'),
}, options));

const OrderItem = new Schema({
  product: ref('Product'),
  name: String,
  sku: String,
  price: Number,
  quantity: Number,
}, { _id: false });

const Order = model('Order', new Schema({
  orderNo: { type: String, unique: true },
  customer: { ...ref('Customer'), required: true },
  items: [OrderItem],
  total: Number,
  status: { type: String, enum: ['Placed', 'Delivered', 'Cancelled'], default: 'Placed' },
}, options));

const StockLog = model('StockLog', new Schema({
  product: ref('Product'),
  change: Number,
  balance: Number,
  reason: String,
}, options));

const Counter = model('Counter', new Schema({
  _id: String,
  seq: { type: Number, default: 0 },
}));

module.exports = { User, Supplier, Customer, Product, Order, StockLog, Counter };

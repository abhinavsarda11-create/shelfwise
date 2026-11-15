const router = require('express').Router();
const { Order, Product, Customer, StockLog, Counter } = require('../models');
const { wrap, fail } = require('../utils');

const withCustomer = (query) => query.populate('customer', 'name phone email address');

const nextOrderNo = async () => {
  const counter = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `ORD-${1000 + counter.seq}`;
};

router.get('/', wrap(async (req, res) => {
  res.json(await withCustomer(Order.find().sort({ createdAt: -1 })));
}));

router.post('/', wrap(async (req, res) => {
  const { customer, items } = req.body;
  if (!customer) throw fail(400, 'Select a customer');
  if (!(await Customer.exists({ _id: customer }))) throw fail(400, 'Customer not found');
  if (!Array.isArray(items) || items.length === 0) throw fail(400, 'Add at least one item');

  const wanted = new Map();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.product) throw fail(400, 'Select a product for every line');
    if (!Number.isInteger(quantity) || quantity < 1) throw fail(400, 'Quantity must be a whole number of at least 1');
    wanted.set(item.product, (wanted.get(item.product) || 0) + quantity);
  }

  const reserved = [];
  const lines = [];
  let order = null;

  try {
    for (const [productId, quantity] of wanted) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!product) {
        const found = await Product.findById(productId);
        throw fail(400, found ? `Only ${found.stock} units of ${found.name} in stock` : 'Product not found');
      }
      reserved.push([product._id, quantity]);
      lines.push({ product: product._id, name: product.name, sku: product.sku, price: product.price, quantity, balance: product.stock });
    }

    const orderNo = await nextOrderNo();
    order = await Order.create({
      orderNo,
      customer,
      items: lines.map(({ balance, ...line }) => line),
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    });
    await StockLog.insertMany(lines.map((line) => ({
      product: line.product,
      change: -line.quantity,
      balance: line.balance,
      reason: `Order ${orderNo}`,
    })));
    res.status(201).json(await withCustomer(Order.findById(order._id)));
  } catch (error) {
    await Promise.all(reserved.map(([id, quantity]) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })));
    if (order) await order.deleteOne();
    throw error;
  }
}));

router.put('/:id/status', wrap(async (req, res) => {
  const { status } = req.body;
  if (!['Delivered', 'Cancelled'].includes(status)) throw fail(400, 'Invalid status');

  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: 'Placed' }, { status }, { new: true });
  if (!order) {
    const existing = await Order.findById(req.params.id);
    throw existing ? fail(400, `Order is already ${existing.status}`) : fail(404, 'Order not found');
  }

  if (status === 'Cancelled') {
    for (const item of order.items) {
      const product = await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true });
      if (product) {
        await StockLog.create({ product: product._id, change: item.quantity, balance: product.stock, reason: `Cancelled ${order.orderNo}` });
      }
    }
  }
  res.json(await withCustomer(Order.findById(order._id)));
}));

module.exports = router;

const router = require('express').Router();
const { Order, Product, Customer } = require('../models');
const { wrap } = require('../utils');

const active = { status: { $ne: 'Cancelled' } };

router.get('/', wrap(async (req, res) => {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 6);

  const [products, customers, pending, revenue, stockValue, daily, topProducts, recentOrders, lowStock] = await Promise.all([
    Product.countDocuments(),
    Customer.countDocuments(),
    Order.countDocuments({ status: 'Placed' }),
    Order.aggregate([{ $match: active }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.aggregate([{ $group: { _id: null, value: { $sum: { $multiply: ['$price', '$stock'] } } } }]),
    Order.aggregate([
      { $match: { ...active, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: active },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6).populate('customer', 'name'),
    Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } }).sort({ stock: 1 }).limit(8),
  ]);

  const byDay = new Map(daily.map((d) => [d._id, d]));
  const sales = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    const found = byDay.get(date);
    return { date, total: found ? found.total : 0, count: found ? found.count : 0 };
  });

  res.json({
    products,
    customers,
    pending,
    revenue: revenue[0] ? revenue[0].total : 0,
    stockValue: stockValue[0] ? stockValue[0].value : 0,
    sales,
    topProducts,
    recentOrders,
    lowStock,
  });
}));

module.exports = router;

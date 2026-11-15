const router = require('express').Router();
const { Product, Supplier, Customer, Order, StockLog } = require('../models');
const { wrap, fail } = require('../utils');

const clean = (body, dropEmpty) =>
  Object.fromEntries(
    Object.entries(body)
      .filter(([, value]) => !(dropEmpty && value === ''))
      .map(([key, value]) => [key, value === '' ? null : value])
  );

function crud(path, Model, config = {}) {
  const { populate, lockOnUpdate = [], usedBy, afterCreate, afterDelete } = config;
  const finish = async (doc) => (populate ? doc.populate(populate) : doc);

  router.get(path, wrap(async (req, res) => {
    const query = Model.find().sort({ createdAt: -1 });
    res.json(await (populate ? query.populate(populate) : query));
  }));

  router.post(path, wrap(async (req, res) => {
    const doc = await Model.create(clean(req.body, true));
    if (afterCreate) await afterCreate(doc);
    res.status(201).json(await finish(doc));
  }));

  router.put(`${path}/:id`, wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw fail(404, 'Record not found');
    const body = clean(req.body, false);
    lockOnUpdate.forEach((key) => delete body[key]);
    doc.set(body);
    await doc.save();
    res.json(await finish(doc));
  }));

  router.delete(`${path}/:id`, wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw fail(404, 'Record not found');
    if (usedBy && (await usedBy(doc))) throw fail(400, 'Cannot delete this record because other records depend on it');
    await doc.deleteOne();
    if (afterDelete) await afterDelete(doc);
    res.json({ message: 'Deleted' });
  }));
}

crud('/products', Product, {
  populate: 'supplier',
  lockOnUpdate: ['stock'],
  usedBy: (doc) => Order.exists({ 'items.product': doc._id }),
  afterCreate: (doc) => doc.stock > 0 && StockLog.create({ product: doc._id, change: doc.stock, balance: doc.stock, reason: 'Opening stock' }),
  afterDelete: (doc) => StockLog.deleteMany({ product: doc._id }),
});

crud('/suppliers', Supplier, { usedBy: (doc) => Product.exists({ supplier: doc._id }) });

crud('/customers', Customer, { usedBy: (doc) => Order.exists({ customer: doc._id }) });

router.post('/products/:id/stock', wrap(async (req, res) => {
  const change = Number(req.body.change);
  if (!Number.isInteger(change) || change === 0) throw fail(400, 'Enter a whole number other than zero');
  const filter = change < 0 ? { _id: req.params.id, stock: { $gte: -change } } : { _id: req.params.id };
  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: change } }, { new: true });
  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    throw exists ? fail(400, 'Not enough stock to remove that quantity') : fail(404, 'Product not found');
  }
  await StockLog.create({
    product: product._id,
    change,
    balance: product.stock,
    reason: req.body.reason || (change > 0 ? 'Restock' : 'Correction'),
  });
  res.json(product);
}));

router.get('/stock-logs', wrap(async (req, res) => {
  res.json(await StockLog.find().sort({ createdAt: -1 }).limit(200).populate('product', 'name sku'));
}));

module.exports = router;

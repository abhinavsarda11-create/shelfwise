import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../api';
import { dateTime, money, statusClass } from '../format';
import { toast } from '../toast';

const tabs = ['All', 'Placed', 'Delivered', 'Cancelled'];

function NewOrder({ onClose, onDone }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/customers').then(setCustomers);
    api.get('/products').then(setProducts);
  }, []);

  const find = (id) => products.find((p) => p._id === id);
  const setLine = (i, patch) => setLines(lines.map((l, x) => (x === i ? { ...l, ...patch } : l)));
  const lineTotal = (l) => (find(l.product) ? find(l.product).price * (Number(l.quantity) || 0) : 0);
  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/orders', { customer, items: lines.filter((l) => l.product) });
      toast('Order placed');
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New order" onClose={onClose} wide>
      <form className="order-form" onSubmit={submit}>
        <label>
          <span>Customer</span>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Select a customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
          </select>
        </label>

        <div className="lines">
          {lines.map((l, i) => (
            <div className="line" key={i}>
              <select value={l.product} onChange={(e) => setLine(i, { product: e.target.value })}>
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.stock === 0}>
                    {p.name} · {money(p.price)} · {p.stock} left
                  </option>
                ))}
              </select>
              <input type="number" min="1" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} aria-label="Quantity" />
              <span className="line-total">{money(lineTotal(l))}</span>
              <button type="button" className="icon danger" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, x) => x !== i))} aria-label="Remove line">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setLines([...lines, { product: '', quantity: 1 }])}><Plus size={16} />Add another item</button>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="order-foot">
          <div><span className="muted">Order total</span><strong className="grand">{money(total)}</strong></div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={busy}>Place order</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Invoice({ order, onClose }) {
  const c = order.customer;
  return (
    <Modal title={`Invoice ${order.orderNo}`} onClose={onClose} wide>
      <div className="invoice">
        <div className="invoice-head">
          <div>
            <strong className="invoice-brand">Shelfwise</strong>
            <p>Retail Inventory & Order Management</p>
          </div>
          <div className="right">
            <p><b>{order.orderNo}</b></p>
            <p>{dateTime(order.createdAt)}</p>
            <span className={'badge ' + statusClass(order.status)}>{order.status}</span>
          </div>
        </div>
        <div className="invoice-to">
          <span className="muted">Billed to</span>
          <b>{c?.name || 'Deleted customer'}</b>
          {c?.phone && <p>{c.phone}</p>}
          {c?.email && <p>{c.email}</p>}
          {c?.address && <p>{c.address}</p>}
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.product + it.sku}>
                <td>{it.name}<small className="sub">{it.sku}</small></td>
                <td className="num">{it.quantity}</td>
                <td className="num">{money(it.price)}</td>
                <td className="num">{money(it.price * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan="3" className="num"><b>Total</b></td><td className="num"><b>{money(order.total)}</b></td></tr>
          </tfoot>
        </table>
      </div>
      <div className="form-actions no-print">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={() => window.print()}><Printer size={16} />Print invoice</button>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => api.get('/orders').then(setOrders).catch((e) => toast(e.message, 'error')), []);
  useEffect(() => { load(); }, [load]);

  const change = async (order, status) => {
    const message = status === 'Cancelled' ? 'Cancel this order and return its items to stock?' : 'Mark this order as delivered?';
    if (!window.confirm(message)) return;
    try {
      await api.put(`/orders/${order._id}/status`, { status });
      toast(`${order.orderNo} ${status.toLowerCase()}`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const shown = (orders || []).filter(
    (o) => (tab === 'All' || o.status === tab) && `${o.orderNo} ${o.customer?.name || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {tabs.map((t) => (
            <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <label className="searchbox">
          <Search size={16} />
          <input placeholder="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} />New order</button>
      </div>

      <div className="card table-wrap">
        {orders === null ? (
          <p className="empty">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="empty">{orders.length ? 'No orders match this filter.' : 'No orders yet. Create the first one.'}</p>
        ) : (
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th className="num">Total</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o._id}>
                  <td><strong>{o.orderNo}</strong></td>
                  <td>{o.customer?.name || 'Deleted customer'}</td>
                  <td className="clip">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</td>
                  <td>{dateTime(o.createdAt)}</td>
                  <td className="num">{money(o.total)}</td>
                  <td><span className={'badge ' + statusClass(o.status)}>{o.status}</span></td>
                  <td className="row-actions">
                    <button className="icon" title="View invoice" onClick={() => setViewing(o)}><Eye size={16} /></button>
                    {o.status === 'Placed' && (
                      <>
                        <button className="icon ok" title="Mark delivered" onClick={() => change(o, 'Delivered')}><Check size={16} /></button>
                        <button className="icon danger" title="Cancel order" onClick={() => change(o, 'Cancelled')}><X size={16} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && <NewOrder onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} />}
      {viewing && <Invoice order={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

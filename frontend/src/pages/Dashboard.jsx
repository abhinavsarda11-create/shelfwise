import { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, IndianRupee, Package, Users } from 'lucide-react';
import { api } from '../api';
import { dateTime, money, statusClass } from '../format';
import { toast } from '../toast';

const weekday = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });

export default function Dashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setD).catch((e) => toast(e.message, 'error'));
  }, []);

  if (!d) return <p className="empty">Loading…</p>;

  const peak = Math.max(...d.sales.map((s) => s.total), 1);
  const week = d.sales.reduce((sum, s) => sum + s.total, 0);

  const stats = [
    { label: 'Pending orders', value: d.pending, icon: ClipboardList },
    { label: 'Products', value: d.products, icon: Package },
    { label: 'Customers', value: d.customers, icon: Users },
    { label: 'Stock value', value: money(d.stockValue), icon: IndianRupee },
  ];

  return (
    <div className="dash">
      <section className="hero">
        <div className="hero-copy">
          <span>Total revenue</span>
          <strong>{money(d.revenue)}</strong>
          <p>{money(week)} earned in the last 7 days</p>
        </div>
        <div className="bars" aria-label="Sales in the last 7 days">
          {d.sales.map((s) => (
            <div key={s.date} className="bar" title={`${money(s.total)} from ${s.count} order${s.count === 1 ? '' : 's'}`}>
              <div className="col"><i style={{ height: Math.max((s.total / peak) * 100, 3) + '%' }} /></div>
              <small>{weekday(s.date)}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="stats">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat card" key={label}>
            <Icon size={20} />
            <div><strong>{value}</strong><span>{label}</span></div>
          </div>
        ))}
      </section>

      <div className="grid-2">
        <section className="card pad">
          <h3><AlertTriangle size={17} />Low stock</h3>
          {d.lowStock.length === 0 ? (
            <p className="muted">Every product is above its reorder level.</p>
          ) : (
            <ul className="list">
              {d.lowStock.map((p) => (
                <li key={p._id}>
                  <div><strong>{p.name}</strong><small className="sub">Reorder at {p.reorderLevel}</small></div>
                  <span className={'badge ' + (p.stock === 0 ? 'bad' : 'warn')}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card pad">
          <h3>Top sellers</h3>
          {d.topProducts.length === 0 ? (
            <p className="muted">Sales will appear here after the first order.</p>
          ) : (
            <ul className="list">
              {d.topProducts.map((p) => (
                <li key={p._id}>
                  <div><strong>{p._id}</strong><small className="sub">{p.units} units sold</small></div>
                  <span>{money(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card pad">
        <h3>Recent orders</h3>
        {d.recentOrders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Date</th><th className="num">Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{o.orderNo}</strong></td>
                    <td>{o.customer?.name || 'Deleted customer'}</td>
                    <td>{dateTime(o.createdAt)}</td>
                    <td className="num">{money(o.total)}</td>
                    <td><span className={'badge ' + statusClass(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

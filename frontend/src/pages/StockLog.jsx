import { useEffect, useState } from 'react';
import { api } from '../api';
import { dateTime } from '../format';
import { toast } from '../toast';

export default function StockLog() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    api.get('/stock-logs').then(setLogs).catch((e) => toast(e.message, 'error'));
  }, []);

  return (
    <div className="card table-wrap">
      {logs === null ? (
        <p className="empty">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="empty">No stock movements yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>When</th><th>Product</th><th>Change</th><th>Balance</th><th>Reason</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td>{dateTime(l.createdAt)}</td>
                <td><strong>{l.product?.name || 'Deleted product'}</strong><small className="sub">{l.product?.sku}</small></td>
                <td><span className={'badge ' + (l.change > 0 ? 'ok' : 'warn')}>{l.change > 0 ? `+${l.change}` : l.change}</span></td>
                <td>{l.balance}</td>
                <td>{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

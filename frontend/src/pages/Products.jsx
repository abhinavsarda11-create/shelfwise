import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import Resource from '../components/Resource';
import Modal from '../components/Modal';
import { api } from '../api';
import { money } from '../format';
import { toast } from '../toast';

const fields = [
  { name: 'name', label: 'Product name', span: 2 },
  { name: 'sku', label: 'SKU' },
  { name: 'category', label: 'Category' },
  { name: 'price', label: 'Price (₹)', type: 'number' },
  { name: 'stock', label: 'Opening stock', type: 'number', createOnly: true },
  { name: 'reorderLevel', label: 'Reorder level', type: 'number' },
  { name: 'supplier', label: 'Supplier', type: 'select', span: 2 },
];

const stockBadge = (r) => {
  const tone = r.stock === 0 ? 'bad' : r.stock <= r.reorderLevel ? 'warn' : 'ok';
  return <span className={'badge ' + tone}>{r.stock === 0 ? 'Out of stock' : `${r.stock} in stock`}</span>;
};

const columns = [
  { label: 'Product', render: (r) => (<><strong>{r.name}</strong><small className="sub">{r.sku}</small></>) },
  { label: 'Category', render: (r) => r.category },
  { label: 'Price', render: (r) => money(r.price) },
  { label: 'Stock', render: stockBadge },
  { label: 'Supplier', render: (r) => r.supplier?.name || '—' },
];

function AdjustStock({ row, reload }) {
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/products/${row._id}/stock`, { change: Number(change), reason });
      toast('Stock updated');
      setOpen(false);
      setChange('');
      setReason('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <button className="icon" title="Adjust stock" onClick={() => setOpen(true)}><ArrowUpDown size={16} /></button>
      {open && (
        <Modal title={`Adjust stock · ${row.name}`} onClose={() => setOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <p className="hint span2">Current stock is <b>{row.stock}</b>. Enter a positive number to add stock or a negative number to remove it.</p>
            <label>
              <span>Change</span>
              <input type="number" step="1" required value={change} onChange={(e) => setChange(e.target.value)} />
            </label>
            <label>
              <span>Reason</span>
              <input value={reason} placeholder="Restock, damaged, correction" onChange={(e) => setReason(e.target.value)} />
            </label>
            {error && <p className="form-error span2">{error}</p>}
            <div className="form-actions span2">
              <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn primary">Update stock</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export default function Products() {
  return (
    <Resource
      title="Products"
      noun="Product"
      endpoint="/products"
      columns={columns}
      fields={fields}
      lookups={{ supplier: '/suppliers' }}
      search={(r) => [r.name, r.sku, r.category, r.supplier?.name].join(' ')}
      actions={(row, reload) => <AdjustStock row={row} reload={reload} />}
    />
  );
}

import Resource from '../components/Resource';

const fields = [
  { name: 'name', label: 'Supplier name', span: 2 },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address', span: 2 },
];

const columns = [
  { label: 'Supplier', render: (r) => <strong>{r.name}</strong> },
  { label: 'Phone', render: (r) => r.phone || '—' },
  { label: 'Email', render: (r) => r.email || '—' },
  { label: 'Address', render: (r) => r.address || '—' },
];

export default function Suppliers() {
  return (
    <Resource
      title="Suppliers"
      noun="Supplier"
      endpoint="/suppliers"
      columns={columns}
      fields={fields}
      search={(r) => [r.name, r.phone, r.email, r.address].join(' ')}
    />
  );
}

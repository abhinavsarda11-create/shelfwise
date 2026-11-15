import Resource from '../components/Resource';

const fields = [
  { name: 'name', label: 'Full name', span: 2 },
  { name: 'phone', label: 'Phone (10 digits)' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address', span: 2 },
];

const columns = [
  { label: 'Customer', render: (r) => <strong>{r.name}</strong> },
  { label: 'Phone', render: (r) => r.phone },
  { label: 'Email', render: (r) => r.email || '—' },
  { label: 'Address', render: (r) => r.address || '—' },
];

export default function Customers() {
  return (
    <Resource
      title="Customers"
      noun="Customer"
      endpoint="/customers"
      columns={columns}
      fields={fields}
      search={(r) => [r.name, r.phone, r.email, r.address].join(' ')}
    />
  );
}

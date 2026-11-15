export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const dateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const statusClass = (status) => ({ Placed: 'info', Delivered: 'ok', Cancelled: 'bad' }[status] || 'info');

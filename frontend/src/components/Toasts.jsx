import { useEffect, useState } from 'react';

export default function Toasts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const show = (e) => {
      const t = e.detail;
      setItems((list) => [...list, t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), 3500);
    };
    window.addEventListener('toast', show);
    return () => window.removeEventListener('toast', show);
  }, []);

  return (
    <div className="toasts" role="status">
      {items.map((t) => (
        <div key={t.id} className={'toast ' + t.type}>{t.message}</div>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ClipboardList, History, LayoutDashboard, LogOut, Package, Truck, Users } from 'lucide-react';
import { session } from './api';
import Toasts from './components/Toasts';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import StockLog from './pages/StockLog';
import Login from './pages/Login';

const nav = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: Dashboard },
  { key: 'products', label: 'Products', icon: Package, view: Products },
  { key: 'orders', label: 'Orders', icon: ClipboardList, view: Orders },
  { key: 'customers', label: 'Customers', icon: Users, view: Customers },
  { key: 'suppliers', label: 'Suppliers', icon: Truck, view: Suppliers },
  { key: 'stock', label: 'Stock log', icon: History, view: StockLog },
];

export default function App() {
  const [authed, setAuthed] = useState(!!session.token());
  const [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard');

  useEffect(() => {
    const out = () => setAuthed(false);
    const hash = () => setPage(location.hash.slice(1) || 'dashboard');
    window.addEventListener('signed-out', out);
    window.addEventListener('hashchange', hash);
    return () => {
      window.removeEventListener('signed-out', out);
      window.removeEventListener('hashchange', hash);
    };
  }, []);

  if (!authed) {
    return (
      <>
        <Login onLogin={() => setAuthed(true)} />
        <Toasts />
      </>
    );
  }

  const current = nav.find((n) => n.key === page) || nav[0];
  const View = current.view;
  const user = session.user();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const logout = () => {
    session.clear();
    setAuthed(false);
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="mark">S</span>Shelfwise</div>
        <nav>
          {nav.map(({ key, label, icon: Icon }) => (
            <a key={key} href={'#' + key} className={key === current.key ? 'on' : ''}>
              <Icon size={18} />{label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <span>{user?.name || 'Administrator'}</span>
          <button className="icon" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main">
        <header className="page-head">
          <h1>{current.label}</h1>
          <p>{today}</p>
        </header>
        <View key={current.key} />
      </main>
      <Toasts />
    </div>
  );
}

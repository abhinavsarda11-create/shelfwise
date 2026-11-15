import { useState } from 'react';
import { Boxes, ClipboardCheck, TrendingUp } from 'lucide-react';
import { api, session } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      session.set(data.token, data.user);
      onLogin();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <aside className="login-art">
        <div className="brand"><span className="mark">S</span>Shelfwise</div>
        <h1>Know what is on the shelf before the customer asks.</h1>
        <ul>
          <li><Boxes size={20} />Live stock levels with reorder alerts</li>
          <li><ClipboardCheck size={20} />Orders that update inventory automatically</li>
          <li><TrendingUp size={20} />Revenue and top sellers at a glance</li>
        </ul>
      </aside>
      <main className="login-form">
        <form onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="muted">Use your administrator account to manage the store.</p>
          <label>
            <span>Email</span>
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </main>
    </div>
  );
}

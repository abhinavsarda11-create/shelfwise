import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api';
import { toast } from '../toast';
import Modal from './Modal';

function RecordForm({ noun, endpoint, fields, options, row, onDone, onClose }) {
  const visible = fields.filter((f) => !(row && f.createOnly));
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      visible.map((f) => {
        const v = row ? row[f.name] : '';
        return [f.name, v && typeof v === 'object' ? v._id : v ?? ''];
      })
    )
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (row) await api.put(`${endpoint}/${row._id}`, values);
      else await api.post(endpoint, values);
      toast(row ? `${noun} updated` : `${noun} added`);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const set = (name) => (e) => setValues({ ...values, [name]: e.target.value });

  return (
    <Modal title={row ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        {visible.map((f) => (
          <label key={f.name} className={f.span === 2 ? 'span2' : ''}>
            <span>{f.label}</span>
            {f.type === 'select' ? (
              <select value={values[f.name]} onChange={set(f.name)}>
                <option value="">None</option>
                {(options[f.name] || []).map((o) => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            ) : (
              <input type={f.type || 'text'} min={f.type === 'number' ? 0 : undefined} value={values[f.name]} onChange={set(f.name)} />
            )}
          </label>
        ))}
        {error && <p className="form-error span2">{error}</p>}
        <div className="form-actions span2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{row ? 'Save changes' : `Add ${noun.toLowerCase()}`}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Resource({ title, noun, endpoint, columns, fields, search, actions, lookups = {} }) {
  const [rows, setRows] = useState(null);
  const [options, setOptions] = useState({});
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(() => api.get(endpoint).then(setRows).catch((e) => toast(e.message, 'error')), [endpoint]);

  useEffect(() => {
    load();
    Object.entries(lookups).forEach(([key, path]) => api.get(path).then((d) => setOptions((o) => ({ ...o, [key]: d }))));
  }, [load]);

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${noun.toLowerCase()}?`)) return;
    try {
      await api.del(`${endpoint}/${row._id}`);
      toast(`${noun} deleted`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const shown = (rows || []).filter((r) => search(r).toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="toolbar">
        <label className="searchbox">
          <Search size={16} />
          <input placeholder={`Search ${title.toLowerCase()}`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className="btn primary" onClick={() => setForm({})}><Plus size={16} />Add {noun.toLowerCase()}</button>
      </div>

      <div className="card table-wrap">
        {rows === null ? (
          <p className="empty">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="empty">{rows.length ? 'Nothing matches your search.' : `No ${title.toLowerCase()} yet. Add the first one.`}</p>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((c) => <th key={c.label}>{c.label}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id}>
                  {columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                  <td className="row-actions">
                    {actions && actions(r, load)}
                    <button className="icon" title="Edit" onClick={() => setForm({ row: r })}><Pencil size={16} /></button>
                    <button className="icon danger" title="Delete" onClick={() => remove(r)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <RecordForm
          noun={noun}
          endpoint={endpoint}
          fields={fields}
          options={options}
          row={form.row}
          onClose={() => setForm(null)}
          onDone={() => { setForm(null); load(); }}
        />
      )}
    </>
  );
}

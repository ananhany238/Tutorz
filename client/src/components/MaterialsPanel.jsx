import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { title: '', url: '', note: '' };

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export default function MaterialsPanel({ groupId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setItems(await api(`/materials?group=${groupId}`));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/materials', { method: 'POST', body: { ...form, group: groupId } });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove "${item.title}"?`)) return;
    try {
      await api(`/materials/${item._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="card">
      <h2>Class materials</h2>
      <p className="muted">Share links to notes, videos or files. Students and parents of this group can see them.</p>

      <form className="row" onSubmit={add}>
        <input name="title" placeholder="Title (e.g. Chapter 3 notes)" value={form.title} onChange={onChange} maxLength={120} required />
        <input name="url" type="url" placeholder="https://..." value={form.url} onChange={onChange} required />
        <input name="note" placeholder="Note (optional)" value={form.note} onChange={onChange} maxLength={500} />
        <button className="primary">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {items.length === 0 ? (
        <p className="muted">No materials yet.</p>
      ) : (
        <div className="list" style={{ marginTop: 16 }}>
          {items.map((m) => (
            <div className="list-row" key={m._id}>
              <div>
                <a className="material-title" href={m.url} target="_blank" rel="noopener noreferrer">{m.title}</a>
                <p className="muted small">
                  {hostOf(m.url)}{m.note ? ` · ${m.note}` : ''}
                </p>
              </div>
              <button className="danger" onClick={() => remove(m)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import TopBar from '../components/TopBar.jsx';

const emptyForm = { name: '', subject: '', schedule: '' };

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [g, s] = await Promise.all([api('/groups'), api('/students')]);
      setGroups(g);
      setStudentCount(s.length);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/groups', { method: 'POST', body: form });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeGroup = async (id) => {
    if (!window.confirm('Delete this group and all its students and attendance?')) return;
    try {
      await api(`/groups/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const firstName = user.name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <TopBar />

      <div className="page">
        <section className="hero">
          <p className="eyebrow">{today}</p>
          <h1>Hello, {firstName}</h1>
          <p className="muted">Here is an overview of your classes.</p>
        </section>

        <section className="stats">
          <div className="stat">
            <span className="stat-number">{groups.length}</span>
            <span className="stat-label">Groups</span>
          </div>
          <div className="stat">
            <span className="stat-number">{studentCount}</span>
            <span className="stat-label">Students</span>
          </div>
        </section>

        <section className="card">
          <h2>Add a group</h2>
          <form className="row" onSubmit={addGroup}>
            <input name="name" placeholder="Group name" value={form.name} onChange={onChange} required />
            <input name="subject" placeholder="Subject" value={form.subject} onChange={onChange} />
            <input name="schedule" placeholder="Schedule (e.g. Sat 5pm)" value={form.schedule} onChange={onChange} />
            <button className="primary">Add group</button>
          </form>
        </section>

        {error && <p className="error">{error}</p>}

        <section>
          <h2 className="section-title">Your groups</h2>

          {groups.length === 0 ? (
            <div className="empty">
              <p>No groups yet.</p>
              <p className="muted">Add your first group above to get started.</p>
            </div>
          ) : (
            <div className="grid">
              {groups.map((g) => (
                <article className="card group" key={g._id}>
                  <div className="group-head">
                    <span className="avatar">{g.name[0].toUpperCase()}</span>
                    <div>
                      <h3>{g.name}</h3>
                      {g.subject && <span className="chip">{g.subject}</span>}
                    </div>
                  </div>
                  <p className="muted">{g.schedule || 'No schedule set'}</p>
                  <div className="actions">
                    <Link className="btn primary" to={`/groups/${g._id}`}>Open</Link>
                    <button className="danger" onClick={() => removeGroup(g._id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
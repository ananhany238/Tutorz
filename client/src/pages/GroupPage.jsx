import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';
import AttendancePanel from '../components/AttendancePanel.jsx';

const emptyForm = { name: '', phone: '', notes: '' };

export default function GroupPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const load = async () => {
    try {
      const [g, s] = await Promise.all([api(`/groups/${id}`), api(`/students?group=${id}`)]);
      setGroup(g);
      setStudents(s);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/students', { method: 'POST', body: { ...form, group: id } });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeStudent = async (student) => {
    if (!window.confirm(`Remove ${student.name}? Their attendance and linked accounts will be deleted.`)) return;
    try {
      await api(`/students/${student._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const newCode = async (studentId) => {
    try {
      await api(`/students/${studentId}/link-code`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <>
      <TopBar />

      <div className="page">
        <Link to="/" className="back">&larr; All groups</Link>

        {error && <p className="error">{error}</p>}

        {group && (
          <section className="hero">
            <h1>{group.name}</h1>
            <p className="muted">
              {group.subject || 'No subject'} &middot; {group.schedule || 'No schedule set'}
            </p>
          </section>
        )}

        <section className="card">
          <h2>Add a student</h2>
          <form className="row" onSubmit={addStudent}>
            <input name="name" placeholder="Student name" value={form.name} onChange={onChange} required />
            <input name="phone" placeholder="Parent phone" value={form.phone} onChange={onChange} />
            <input name="notes" placeholder="Notes" value={form.notes} onChange={onChange} />
            <button className="primary">Add student</button>
          </form>
        </section>

        <section>
          <h2 className="section-title">Students ({students.length})</h2>

          {students.length === 0 ? (
            <div className="empty">
              <p>No students in this group yet.</p>
            </div>
          ) : (
            <div className="list">
              {students.map((s) => (
                <div className="list-row" key={s._id}>
                  <div className="list-main">
                    <span className="avatar sm">{s.name[0].toUpperCase()}</span>
                    <div>
                      <strong>{s.name}</strong>
                      <p className="muted small">{s.phone || 'No phone'}{s.notes ? ` · ${s.notes}` : ''}</p>
                    </div>
                  </div>

                  <div className="list-side">
                    {s.linkCode ? (
                      <>
                        <code className="code">{s.linkCode}</code>
                        <button className="ghost" onClick={() => copy(s.linkCode)}>
                          {copied === s.linkCode ? 'Copied' : 'Copy code'}
                        </button>
                        <button className="ghost" onClick={() => newCode(s._id)}>New code</button>
                      </>
                    ) : (
                      <button className="ghost" onClick={() => newCode(s._id)}>Generate code</button>
                    )}
                    <button className="danger" onClick={() => removeStudent(s)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
               </section>

        {students.length > 0 && <AttendancePanel groupId={id} students={students} />}
      </div>
    </>
  );
}
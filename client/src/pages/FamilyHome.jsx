import { useEffect, useState } from 'react';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';

const LABELS = { present: 'Present', late: 'Late', absent: 'Absent' };

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function FamilyHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/family/me')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <TopBar />

      <div className="page">
        {error && <p className="error">{error}</p>}

        {data && (
          <>
            <section className="hero">
              <p className="eyebrow">{data.group.name}</p>
              <h1>{data.student.name}</h1>
              <p className="muted">
                {data.group.subject || 'No subject'} &middot; {data.group.schedule || 'No schedule set'}
                {data.tutor.name && <> &middot; Tutor: {data.tutor.name}</>}
              </p>
            </section>

            <section className="stats">
              <div className="stat">
                <span className="stat-number">{data.summary.rate === null ? '-' : `${data.summary.rate}%`}</span>
                <span className="stat-label">Attendance rate</span>
              </div>
              <div className="stat">
                <span className="stat-number">{data.summary.present}</span>
                <span className="stat-label">Present</span>
              </div>
              <div className="stat">
                <span className="stat-number">{data.summary.late}</span>
                <span className="stat-label">Late</span>
              </div>
              <div className="stat">
                <span className="stat-number">{data.summary.absent}</span>
                <span className="stat-label">Absent</span>
              </div>
            </section>

            <h2 className="section-title">Attendance history</h2>

            {data.history.length === 0 ? (
              <div className="empty">
                <p>No sessions recorded yet.</p>
                <p className="muted">Attendance will appear here after your tutor records it.</p>
              </div>
            ) : (
              <div className="list">
                {data.history.map((h) => (
                  <div className="list-row" key={h.date}>
                    <strong>{formatDate(h.date)}</strong>
                    <span className={`status ${h.status}`}>{LABELS[h.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
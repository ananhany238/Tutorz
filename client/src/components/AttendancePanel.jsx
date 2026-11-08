import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api.js';

const STATUSES = [
  ['present', 'Present'],
  ['late', 'Late'],
  ['absent', 'Absent'],
];

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

export default function AttendancePanel({ groupId, students }) {
  const [date, setDate] = useState(todayLocal());
  const [lateAfter, setLateAfter] = useState(10);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const open = Boolean(session && session.checkin && session.checkin.open);
  const sessionId = session && session._id;

  const loadSession = useCallback(async () => {
    try {
      setSession(await api(`/attendance?group=${groupId}&date=${date}`));
    } catch (err) {
      setError(err.message);
    }
  }, [groupId, date]);

  useEffect(() => {
    setSession(null);
    setToken('');
    loadSession();
  }, [loadSession]);

  // While check-in is open: refresh the live list and the rotating QR token.
  useEffect(() => {
    if (!open) return;

    const tick = async () => {
      try {
        const [s, t] = await Promise.all([
          api(`/attendance?group=${groupId}&date=${date}`),
          api(`/attendance/checkin/${sessionId}/token`),
        ]);
        setSession(s);
        setToken(t.token);
      } catch (err) {
        setError(err.message);
      }
    };

    tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, [open, groupId, date, sessionId]);

  const start = async () => {
    setError('');
    try {
      setSession(
        await api('/attendance/checkin/start', {
          method: 'POST',
          body: { group: groupId, date, lateAfterMinutes: Number(lateAfter) || 10 },
        })
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const close = async () => {
    setError('');
    try {
      setSession(await api(`/attendance/checkin/${sessionId}/close`, { method: 'POST' }));
      setToken('');
    } catch (err) {
      setError(err.message);
    }
  };

  const statusOf = (studentId) => {
    const record = session && session.records.find((r) => r.student === studentId);
    return record ? record.status : null;
  };

  const mark = async (studentId, status) => {
    setError('');
    const others = ((session && session.records) || []).filter((r) => r.student !== studentId);
    const records = [...others, { student: studentId, status }].map((r) => ({
      student: r.student,
      status: r.status,
    }));
    try {
      setSession(await api('/attendance', { method: 'PUT', body: { group: groupId, date, records } }));
    } catch (err) {
      setError(err.message);
    }
  };

  const checkinLink = token
    ? `${window.location.origin}/checkin?s=${sessionId}&t=${token}`
    : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(checkinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const here = students.filter((s) => ['present', 'late'].includes(statusOf(s._id))).length;

  return (
    <section className="card">
      <h2>Attendance</h2>

      <div className="panel-head">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={open} />
        </label>
        <label className="field">
          <span>Late after (minutes)</span>
          <input
            type="number"
            min="1"
            max="120"
            value={lateAfter}
            onChange={(e) => setLateAfter(e.target.value)}
            disabled={open}
          />
        </label>
        {open ? (
          <button className="danger" onClick={close}>Close check-in</button>
        ) : (
          <button className="primary" onClick={start}>Start check-in</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {open && (
        <div className="qr-box">
          {token ? (
            <>
              <div className="qr">
                <QRCodeSVG value={checkinLink} size={240} />
              </div>
              <p className="muted">Students scan this with their phone. The code refreshes automatically.</p>
              <button className="ghost" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy check-in link'}
              </button>
            </>
          ) : (
            <p className="muted">Generating code...</p>
          )}
          <p className="progress">
            <strong>{here}</strong> of {students.length} checked in
          </p>
        </div>
      )}

      <div className="list">
        {students.map((s) => {
          const current = statusOf(s._id);
          return (
            <div className="list-row" key={s._id}>
              <div className="list-main">
                <span className="avatar sm">{s.name[0].toUpperCase()}</span>
                <strong>{s.name}</strong>
              </div>
              <div className="mark-group">
                {STATUSES.map(([value, label]) => (
                  <button
                    key={value}
                    className={`mark ${value} ${current === value ? 'on' : ''}`}
                    disabled={open}
                    onClick={() => mark(s._id, value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
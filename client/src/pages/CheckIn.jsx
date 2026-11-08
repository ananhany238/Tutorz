import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';

export default function CheckIn() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    api('/family/checkin', {
      method: 'POST',
      body: { session: params.get('s'), token: params.get('t') },
    })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [params]);

  const late = result && result.status === 'late';

  return (
    <>
      <TopBar />
      <div className="page">
        <div className="card checkin-result">
          {!result && !error && <p className="muted">Checking you in...</p>}

          {result && (
            <>
              <div className={`big-icon ${late ? 'warn' : 'ok'}`}>{late ? '!' : '\u2713'}</div>
              <h1>{result.already ? 'Already checked in' : "You're checked in"}</h1>
              <p className="muted">
                Marked <strong>{result.status}</strong> for {result.date}.
              </p>
            </>
          )}

          {error && (
            <>
              <div className="big-icon fail">!</div>
              <h1>Check-in failed</h1>
              <p className="error">{error}</p>
            </>
          )}

          <Link className="btn primary" to="/">View my attendance</Link>
        </div>
      </div>
    </>
  );
}
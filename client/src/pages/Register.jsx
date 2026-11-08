import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState('tutor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isFamily = role === 'family';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ name, email, password, role, ...(isFamily && { linkCode }) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={isFamily ? 'Follow attendance with the code your tutor gave you.' : 'Set up your tutor account in under a minute.'}
      footer={<>Already registered? <Link to="/login">Log in</Link></>}
    >
      <div className="seg" role="tablist">
        <button type="button" className={!isFamily ? 'active' : ''} onClick={() => setRole('tutor')}>I'm a tutor</button>
        <button type="button" className={isFamily ? 'active' : ''} onClick={() => setRole('family')}>Student / parent</button>
      </div>

      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Full name</span>
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" placeholder="At least 6 characters" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {isFamily && (
          <label className="field">
            <span>Student link code</span>
            <input placeholder="Ask your tutor for the code" value={linkCode} onChange={(e) => setLinkCode(e.target.value)} required />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
    </AuthLayout>
  );
}
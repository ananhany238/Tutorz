import Logo from './Logo.jsx';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <Logo light />
        <div className="brand-body">
          <h2>Run your classes without the paperwork.</h2>
          <ul>
            <li>Organize groups and students in one place</li>
            <li>Take attendance in seconds</li>
            <li>See who is present, late or absent at a glance</li>
          </ul>
        </div>
        <p className="brand-foot">Built for private tutors and teaching centers.</p>
      </aside>

      <main className="auth-form">
        <div className="auth-box">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-footer muted">{footer}</p>
        </div>
      </main>
    </div>
  );
}
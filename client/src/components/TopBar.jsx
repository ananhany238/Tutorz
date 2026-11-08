import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Logo from './Logo.jsx';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="plain-link"><Logo /></Link>
        <div className="topbar-user">
          <span className="avatar sm">{user.name[0].toUpperCase()}</span>
          <span className="user-name">{user.name}</span>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
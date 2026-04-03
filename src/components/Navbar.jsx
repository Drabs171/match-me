import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, History, Bookmark } from 'lucide-react';
import { useAuth } from '../AuthContext';
import logo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar" id="main-nav">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <img src={logo} alt="Match Me! logo" className="navbar-logo-img" />
          </div>
          <span className="navbar-title">Match Me!</span>
        </Link>
        <div className="navbar-links">
          <Link
            to="/"
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>

          {user ? (
            <div className="navbar-user">
              <Link
                to="/history"
                className={`navbar-link ${location.pathname === '/history' ? 'active' : ''}`}
              >
                <History size={14} /> History
              </Link>
              <Link
                to="/saved"
                className={`navbar-link ${location.pathname === '/saved' ? 'active' : ''}`}
              >
                <Bookmark size={14} /> Saved
              </Link>
              <span className="navbar-user-name">
                <User size={14} /> {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <button className="btn btn-ghost btn-sm navbar-logout" onClick={handleLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

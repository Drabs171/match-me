import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, History, Bookmark, Menu, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import logo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  const navLinks = (
    <>
      <Link
        to="/"
        className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        Home
      </Link>
      <Link
        to="/dashboard"
        className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        to="/privacy"
        className={`navbar-link ${location.pathname === '/privacy' ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        Privacy
      </Link>

      {user && (
        <>
          <Link
            to="/history"
            className={`navbar-link ${location.pathname === '/history' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <History size={14} /> History
          </Link>
          <Link
            to="/saved"
            className={`navbar-link ${location.pathname === '/saved' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <Bookmark size={14} /> Saved
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="navbar" id="main-nav">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <img src={logo} alt="Match Me! logo" className="navbar-logo-img" />
          </div>
          <span className="navbar-title">Match Me!</span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links navbar-desktop">
          {navLinks}

          {user ? (
            <div className="navbar-user">
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

        {/* Mobile hamburger button */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          id="mobile-menu-toggle"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="navbar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`navbar-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-drawer-links">
          {navLinks}
        </div>

        <div className="navbar-drawer-footer">
          {user ? (
            <>
              <div className="navbar-user-name">
                <User size={14} /> {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </div>
              <button className="btn btn-ghost navbar-logout-mobile" onClick={handleLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </>
          ) : (
            <Link to="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)} style={{ width: '100%', justifyContent: 'center' }}>
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

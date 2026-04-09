import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Home, Search } from 'lucide-react';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="not-found-page" id="not-found-page">
      <div className="container not-found-content animate-fade-in-up">
        <div className="not-found-icon">
          <MapPin size={40} />
        </div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={16} /> Go Home
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            <Search size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ title, subtitle, backTo = '/', children }) {
  const { signOut, user } = useAuth();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-actions">
          <Link className="back-link" to={backTo}>
            返回
          </Link>
          {user && (
            <button className="text-button" onClick={signOut}>
              登出
            </button>
          )}
        </div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </main>
  );
}

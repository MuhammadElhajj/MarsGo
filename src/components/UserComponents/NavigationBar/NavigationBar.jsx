import { Link } from 'react-router-dom';
import { useNavLinks } from '../../../context/NavLinksContext';
import './NavigationBar.css';

export default function NavigationBar() {
  const { links, loading } = useNavLinks();
  if (loading) return null; // أو شريط تحميل صغير
  if (links.length === 0) return null;

  return (
    <nav className="navigation-bar">
      <div className="navigation-bar__container">
        {links.filter(link => link.isActive !== false).map(link => (
          link.isExternal ? (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="navigation-bar__link"
            >
              {link.icon && <span className="nav-icon">{link.icon}</span>}
              <span>{link.name}</span>
            </a>
          ) : (
            <Link key={link.id} to={link.url} className="navigation-bar__link">
              {link.icon && <span className="nav-icon">{link.icon}</span>}
              <span>{link.name}</span>
            </Link>
          )
        ))}
      </div>
    </nav>
  );
}
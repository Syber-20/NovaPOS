import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/pos':       'Point of Sale',
  '/inventory': 'Inventory',
  '/products':  'Products',
  '/suppliers': 'Suppliers',
  '/analytics': 'Sales Analytics',
  '/reports':   'Reports',
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Header() {
  const { currentUser, sidebarOpen, setSidebarOpen, getLowStockItems } = useApp();
  const location = useLocation();

  // strip the basename prefix if present
  const path = '/' + location.pathname.replace(/^\/NovaPOS/, '').replace(/^\//, '');
  const pageTitle = PAGE_TITLES[path] || 'Nova POS';
  const lowStockCount = getLowStockItems().length;

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Hamburger — mobile only */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <h1 className="header-page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {/* Low-stock notification bell */}
        {lowStockCount > 0 && (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Bell size={20} style={{ color: 'var(--warning)' }} />
            <span style={{
              position: 'absolute', top: -5, right: -6,
              background: 'var(--danger)', color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              borderRadius: '9999px', padding: '0 4px', minWidth: 14,
              textAlign: 'center', lineHeight: '14px', height: 14,
            }}>
              {lowStockCount}
            </span>
          </div>
        )}

        {/* User chip */}
        {currentUser && (
          <div className="header-user-chip">
            <div className="header-avatar">{getInitials(currentUser.name)}</div>
            <span style={{ fontSize: '0.85rem' }}>{currentUser.name.split(' ')[0]}</span>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
              {currentUser.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes,
  Truck, BarChart2, FileText, LogOut, Baby, Users, ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',     icon: LayoutDashboard, roles: ['owner','cashier','inventory','manager'] },
  { to: '/pos',       label: 'Point of Sale', icon: ShoppingCart,    roles: ['owner','cashier','manager'] },
  { to: '/inventory', label: 'Inventory',     icon: Boxes,           roles: ['owner','inventory','manager'] },
  { to: '/products',  label: 'Products',      icon: Package,         roles: ['owner','inventory','manager'] },
  { to: '/suppliers', label: 'Suppliers',     icon: Truck,           roles: ['owner','manager'] },
  { to: '/analytics', label: 'Analytics',     icon: BarChart2,       roles: ['owner','manager'] },
  { to: '/reports',   label: 'Reports',       icon: FileText,        roles: ['owner','manager'] },
  { to: '/staff',     label: 'Staff',         icon: Users,           roles: ['owner','manager'] },
];

export default function Sidebar() {
  const { currentUser, sidebarOpen, setSidebarOpen, logout, getLowStockItems } = useApp();
  const navigate      = useNavigate();
  const location      = useLocation();
  const lowStockCount = getLowStockItems().length;

  // Show back button on every page except dashboard
  const showBack = location.pathname !== '/';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div className="logo-container">
          <div className="logo-icon">
            <Baby size={20} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.1 }}>Nova POS</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Baby Care Retail</p>
          </div>
        </div>

        {/* Back button — shows on every page except dashboard */}
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary w-full btn-sm"
            style={{
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'flex-start',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        {/* Nav */}
        <nav className="nav-menu">
          <span className="nav-section-label">Menu</span>
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <Icon size={18} />
              {label}
              {to === '/inventory' && lowStockCount > 0 && (
                <span className="nav-badge">{lowStockCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {currentUser && (
          <div className="sidebar-footer">
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {currentUser.role}
              </p>
            </div>
            <button className="btn btn-secondary w-full btn-sm" onClick={handleLogout}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

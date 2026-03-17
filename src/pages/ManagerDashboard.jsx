import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ManagerDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const actions = [
    { title: 'Point of Sale', icon: <ShoppingBag size={24} />, path: '/pos', color: 'var(--primary)' },
    { title: 'Inventory', icon: <Package size={24} />, path: '/inventory', color: 'var(--success)' },
    { title: 'Sales Analytics', icon: <TrendingUp size={24} />, path: '/analytics', color: 'var(--warning)' },
    { title: 'Staff Management', icon: <Users size={24} />, path: '/staff', color: 'var(--danger)' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Manager Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back, {currentUser?.name}</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        {actions.map((action, idx) => (
          <div 
            key={idx} 
            className="card clickable" 
            onClick={() => navigate(action.path)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 'var(--radius-md)', 
              background: `rgba(${action.color === 'var(--primary)' ? '79,70,229' : '34,197,94'}, 0.1)`, 
              color: action.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {action.icon}
            </div>
            <h3 style={{ margin: 0 }}>{action.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage and monitor {action.title.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

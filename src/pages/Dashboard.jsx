import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, PackageOpen, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CashierDashboard   from './CashierDashboard';
import InventoryDashboard from './InventoryDashboard';
import ManagerDashboard from './ManagerDashboard';

export default function Dashboard() {
  const { currentUser, getTodaySales, getTopProducts, getLowStockItems, sales } = useApp();
  const navigate = useNavigate();

  // Show role-specific dashboard
  if (currentUser?.role === 'inventory') return <InventoryDashboard />;
  if (currentUser?.role === 'cashier')   return <CashierDashboard />;
  if (currentUser?.role === 'manager')   return <ManagerDashboard />;

  const todaySales    = getTodaySales();
  const todayRevenue  = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStockItems = getLowStockItems();
  const topProducts   = getTopProducts(7, 1);
  const topProduct    = topProducts.length > 0 ? topProducts[0].product.name : 'None';

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Store Overview</h2>
        <button className="btn btn-primary" onClick={() => navigate('/pos')}>
          <ShoppingBag size={18} />
          New Sale
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert-banner warning" style={{ marginBottom: '1.5rem' }}>
          <PackageOpen size={18} />
          <span>
            <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}</strong> are running low on stock.
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/inventory')}
          >
            View Inventory
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Today's Revenue"
          value={`GH₵ ${todayRevenue.toFixed(2)}`}
          icon={<DollarSign size={22} />}
          iconBg="var(--success-light)"
          iconColor="var(--success)"
          trend={`${todaySales.length} transaction${todaySales.length !== 1 ? 's' : ''} today`}
          trendUp={todaySales.length > 0}
        />
        <StatCard
          title="Today's Orders"
          value={todaySales.length}
          icon={<ShoppingBag size={22} />}
          iconBg="rgba(79,70,229,0.1)"
          iconColor="var(--primary)"
          trend="Total checkouts today"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          icon={<PackageOpen size={22} />}
          iconBg="var(--danger-light)"
          iconColor="var(--danger)"
          trend={lowStockItems.length > 0 ? 'Needs restocking' : 'All stocked up'}
          trendUp={lowStockItems.length === 0}
        />
        <StatCard
          title="Top Selling (7 days)"
          value={topProduct}
          icon={<TrendingUp size={22} />}
          iconBg="var(--warning-light)"
          iconColor="var(--warning)"
          trend="Best performing product"
          valueSize="1.1rem"
        />
      </div>

      <div className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
          <h3>Recent Transactions</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/analytics')}>
            View All
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingBag size={26} /></div>
            <h3>No sales yet</h3>
            <p>Completed transactions will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date / Time</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{sale.id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{sale.items.reduce((s, i) => s + i.qty, 0)} item{sale.items.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</td>
                    <td>
                      <span className={`badge ${sale.paymentMethod === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                        {sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>GH₵ {sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconBg, iconColor, trend, trendUp, valueSize = '1.9rem' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            {title}
          </p>
          <p style={{ fontSize: valueSize, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
            {value}
          </p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', fontWeight: 500, color: trendUp === true ? 'var(--success)' : trendUp === false ? 'var(--danger)' : 'var(--text-muted)' }}>
        {trend}
      </p>
    </div>
  );
}

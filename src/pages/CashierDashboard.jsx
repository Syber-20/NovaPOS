import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, DollarSign, Receipt, CreditCard, Banknote, TrendingUp, Clock, CheckCircle, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CashierDashboard() {
  const { currentUser, getTodaySales, sales, products, inventory } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // Today's sales
  const todaySales    = getTodaySales();
  const todayRevenue  = todaySales.reduce((sum, s) => sum + s.total, 0);
  const cashSales     = todaySales.filter(s => s.paymentMethod === 'cash');
  const mobileSales   = todaySales.filter(s => s.paymentMethod === 'mobile_money');
  const cashRevenue   = cashSales.reduce((sum, s) => sum + s.total, 0);
  const mobileRevenue = mobileSales.reduce((sum, s) => sum + s.total, 0);

  // My sales (this cashier's transactions today)
  const mySales = useMemo(() => {
    return todaySales.filter(s => s.cashierId === currentUser?.uid);
  }, [todaySales, currentUser]);

  const myRevenue = mySales.reduce((sum, s) => sum + s.total, 0);

  // Recent sales (last 10)
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [sales]);

  // Low stock items to warn cashier
  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;

  // Quick product availability check
  const inStockCount  = inventory.filter(i => i.quantity > 0).length;
  const outStockCount = inventory.filter(i => i.quantity === 0).length;

  // Hourly breakdown of today's sales
  const hourlyData = useMemo(() => {
    const hours = {};
    for (let h = 6; h <= 22; h++) hours[h] = 0;
    todaySales.forEach(s => {
      const h = new Date(s.date).getHours();
      if (hours[h] !== undefined) hours[h] += s.total;
    });
    return Object.entries(hours).map(([hour, revenue]) => ({ hour: parseInt(hour), revenue }));
  }, [todaySales]);

  const maxHourly = Math.max(...hourlyData.map(h => h.revenue), 1);

  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container">

      {/* ── Welcome Bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
            {greeting}, {currentUser?.name?.split(' ')[0]}
          </p>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>
            Ready to serve customers
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          className="btn"
          style={{
            background: 'white', color: 'var(--primary)',
            fontWeight: 700, fontSize: '1rem',
            padding: '0.85rem 1.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
          onClick={() => navigate('/pos')}
        >
          <ShoppingCart size={20} /> New Sale
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          label="Today's Revenue"
          value={`GH₵ ${todayRevenue.toFixed(2)}`}
          sub={`${todaySales.length} transaction${todaySales.length !== 1 ? 's' : ''}`}
          icon={<DollarSign size={20} />}
          bg="var(--success-light)" color="var(--success)"
        />
        <StatCard
          label="My Sales Today"
          value={`GH₵ ${myRevenue.toFixed(2)}`}
          sub={`${mySales.length} by you`}
          icon={<Receipt size={20} />}
          bg="rgba(79,70,229,0.1)" color="var(--primary)"
        />
        <StatCard
          label="Cash Collected"
          value={`GH₵ ${cashRevenue.toFixed(2)}`}
          sub={`${cashSales.length} cash sales`}
          icon={<Banknote size={20} />}
          bg="var(--warning-light)" color="var(--warning)"
        />
        <StatCard
          label="Mobile Money"
          value={`GH₵ ${mobileRevenue.toFixed(2)}`}
          sub={`${mobileSales.length} mobile sales`}
          icon={<CreditCard size={20} />}
          bg="var(--danger-light)" color="var(--danger)"
        />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'overview', label: 'Shift Overview' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'products', label: 'Product Availability' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Hourly chart */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--primary)" /> Sales Activity Today
            </h3>
            {todaySales.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No sales recorded yet today.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 120, paddingBottom: '1.5rem', overflowX: 'auto' }}>
                {hourlyData.map(({ hour, revenue }) => {
                  const heightPct = (revenue / maxHourly) * 100;
                  const label     = hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`;
                  return (
                    <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 24, gap: 2 }}>
                      <div
                        title={revenue > 0 ? `GH₵${revenue.toFixed(2)}` : ''}
                        style={{
                          width: '100%', minHeight: 3,
                          height: `${Math.max(heightPct, revenue > 0 ? 8 : 1)}%`,
                          background: revenue > 0 ? 'linear-gradient(180deg, var(--primary-light), var(--primary))' : 'var(--border)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment split */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="var(--primary)" /> Payment Breakdown
            </h3>
            {todaySales.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No sales yet today.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Bar */}
                <div style={{ height: 16, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${todayRevenue > 0 ? (cashRevenue / todayRevenue) * 100 : 50}%`, background: 'var(--success)', transition: 'width 0.4s' }} />
                  <div style={{ flex: 1, background: 'var(--primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <PayRow label="Cash" count={cashSales.length} revenue={cashRevenue} color="var(--success)" total={todaySales.length} />
                  <PayRow label="Mobile Money" count={mobileSales.length} revenue={mobileRevenue} color="var(--primary)" total={todaySales.length} />
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Collected</span>
                  <span style={{ color: 'var(--primary)' }}>GH₵ {todayRevenue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary w-full" onClick={() => navigate('/pos')}>
                <ShoppingCart size={17} /> Start New Sale
              </button>
              <button className="btn btn-secondary w-full" onClick={() => setActiveTab('transactions')}>
                <Receipt size={17} /> View Today's Transactions
              </button>
              <button className="btn btn-secondary w-full" onClick={() => setActiveTab('products')}>
                <Package size={17} /> Check Product Availability
              </button>
            </div>
          </div>

          {/* Low stock warning */}
          {lowStockCount > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                ⚠ Stock Warning
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <strong>{lowStockCount} product{lowStockCount !== 1 ? 's' : ''}</strong> are running low. Let the inventory manager know.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {inventory
                  .filter(i => i.quantity <= i.lowStockThreshold)
                  .slice(0, 4)
                  .map(inv => {
                    const product = products.find(p => p.id === inv.productId);
                    return product ? (
                      <div key={inv.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 500 }}>{product.name}</span>
                        <span style={{ color: inv.quantity === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                          {inv.quantity === 0 ? 'OUT' : `${inv.quantity} left`}
                        </span>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TRANSACTIONS TAB ══ */}
      {activeTab === 'transactions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Today's Transactions</h3>
            <span className="badge badge-primary">{todaySales.length} sales · GH₵{todayRevenue.toFixed(2)}</span>
          </div>
          {recentSales.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon"><Receipt size={26} /></div>
              <h3>No transactions yet</h3>
              <p>Completed sales will appear here.</p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/pos')}>
                Start First Sale
              </button>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Amount Paid</th>
                    <th>Change</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{sale.id?.slice(-6)}</td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {sale.items?.map(i => `${i.qty}× ${i.productName}`).join(', ')}
                      </td>
                      <td>
                        <span className={`badge ${sale.paymentMethod === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                          {sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>GH₵ {sale.amountPaid?.toFixed(2)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 500 }}>GH₵ {sale.change?.toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>GH₵ {sale.total?.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content' }}>
                          <CheckCircle size={11} /> Done
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ PRODUCTS TAB ══ */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {products.map(product => {
            const inv     = inventory.find(i => i.productId === product.id);
            const stock   = inv ? inv.quantity : 0;
            const isOut   = stock === 0;
            const isLow   = inv && stock <= inv.lowStockThreshold && stock > 0;
            return (
              <div key={product.id} className="card" style={{
                padding: '1rem',
                borderLeft: `4px solid ${isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)'}`,
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{product.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.brand}{product.size ? ` · ${product.size}` : ''}</p>
                  </div>
                  <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                    {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>GH₵{product.price.toFixed(2)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                    {stock} in stock
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, bg, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</p>
      </div>
    </div>
  );
}

function PayRow({ label, count, revenue, color, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>GH₵ {revenue.toFixed(2)}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {count} sales ({total > 0 ? ((count / total) * 100).toFixed(0) : 0}%)
        </p>
      </div>
    </div>
  );
}

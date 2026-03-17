import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const RANGES = [
  { label: '7 Days',  days: 7  },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export default function Analytics() {
  const { sales } = useApp();
  const [selectedDays, setSelectedDays] = useState(7);

  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selectedDays);
    return sales.filter(s => new Date(s.date) >= cutoff);
  }, [sales, selectedDays]);

  const dailyData = useMemo(() => {
    const map = {};
    for (let d = selectedDays - 1; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const key = date.toISOString().split('T')[0];
      map[key] = { date: key, revenue: 0, orders: 0 };
    }
    filteredSales.forEach(s => {
      const key = new Date(s.date).toISOString().split('T')[0];
      if (map[key]) { map[key].revenue += s.total; map[key].orders += 1; }
    });
    return Object.values(map);
  }, [filteredSales, selectedDays]);

  const maxRevenue   = Math.max(...dailyData.map(d => d.revenue), 1);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCost    = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      return itemSum + ((product?.costPrice || 0) * item.qty);
    }, 0);
  }, 0);
  const totalProfit  = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const totalOrders  = filteredSales.length;
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems   = filteredSales.reduce((s, sale) => s + sale.items.reduce((a, i) => a + i.qty, 0), 0);

  const topProducts = useMemo(() => {
    const counts = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.productId]) counts[item.productId] = { qty: 0, revenue: 0, profit: 0, name: item.productName };
        const product = products.find(p => p.id === item.productId);
        const cost = (product?.costPrice || 0) * item.qty;
        counts[item.productId].qty     += item.qty;
        counts[item.productId].revenue += item.subtotal;
        counts[item.productId].profit  += (item.subtotal - cost);
      });
    });
    return Object.entries(counts)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSales, products]);

  const maxQty        = Math.max(...topProducts.map(p => p.qty), 1);
  const cashSales     = filteredSales.filter(s => s.paymentMethod === 'cash');
  const mobileSales   = filteredSales.filter(s => s.paymentMethod === 'mobile_money');
  const cashRevenue   = cashSales.reduce((sum, s) => sum + s.total, 0);
  const mobileRevenue = mobileSales.reduce((sum, s) => sum + s.total, 0);
  const cashPct       = totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Sales Analytics</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RANGES.map(r => (
            <button key={r.days} className={`btn btn-sm ${selectedDays === r.days ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<DollarSign size={20} />} iconBg="var(--success-light)" iconColor="var(--success)" label="Total Revenue" value={`GH₵ ${totalRevenue.toFixed(2)}`} />
        <StatCard icon={<TrendingUp size={20} />} iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" label="Total Profit" value={`GH₵ ${totalProfit.toFixed(2)}`} />
        <StatCard icon={<TrendingUp size={20} />} iconBg="rgba(59, 130, 246, 0.1)" iconColor="#3b82f6" label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} />
        <StatCard icon={<ShoppingBag size={20} />} iconBg="rgba(79,70,229,0.1)" iconColor="var(--primary)" label="Total Orders" value={totalOrders} />
        <StatCard icon={<Package size={20} />} iconBg="var(--danger-light)" iconColor="var(--danger)" label="Items Sold" value={totalItems} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daily Revenue — Last {selectedDays} Days</h3>
          {totalRevenue === 0 ? (
            <div className="empty-state"><p>No sales in this period.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 180, minWidth: selectedDays * 32, paddingBottom: '2rem', position: 'relative' }}>
                {dailyData.map(day => {
                  const heightPct = (day.revenue / maxRevenue) * 100;
                  const label = new Date(day.date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return (
                    <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, height: 14 }}>
                        {day.revenue > 0 ? `₵${day.revenue.toFixed(0)}` : ''}
                      </div>
                      <div title={`${label}: GH₵${day.revenue.toFixed(2)} (${day.orders} orders)`} style={{
                        width: '100%', minHeight: 3,
                        height: `${Math.max(heightPct, day.revenue > 0 ? 6 : 1)}%`,
                        background: day.revenue > 0 ? 'linear-gradient(180deg, var(--primary-light), var(--primary))' : 'var(--border)',
                        borderRadius: '4px 4px 0 0', cursor: day.revenue > 0 ? 'pointer' : 'default',
                      }} />
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', transform: 'rotate(-35deg)', transformOrigin: 'top center', marginTop: 4 }}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Top Products</h3>
          {topProducts.length === 0 ? (
            <div className="empty-state"><p>No sales data.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{i + 1}. {p.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.qty} sold · GH₵{p.revenue.toFixed(2)} rev · <span style={{ color: 'var(--success)', fontWeight: 600 }}>₵{p.profit.toFixed(2)} profit</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.qty / maxQty) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Payment Methods</h3>
          {totalOrders === 0 ? (
            <div className="empty-state"><p>No sales data.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', height: 20, borderRadius: 99, overflow: 'hidden', marginBottom: '0.75rem' }}>
                  <div style={{ width: `${cashPct}%`, background: 'var(--success)' }} />
                  <div style={{ flex: 1, background: 'var(--primary)' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)' }} />
                    <span>Cash</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} />
                    <span>Mobile Money</span>
                  </div>
                </div>
              </div>
              <PaymentRow label="Cash" count={cashSales.length} revenue={cashRevenue} color="var(--success)" total={totalOrders} />
              <PaymentRow label="Mobile Money" count={mobileSales.length} revenue={mobileRevenue} color="var(--primary)" total={totalOrders} />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>Transactions in Period</h3>
        {filteredSales.length === 0 ? (
          <div className="empty-state"><p>No transactions in this period.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Date</th><th>Items</th><th>Payment</th><th>Cashier</th><th>Total</th></tr>
              </thead>
              <tbody>
                {[...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(sale => (
                  <tr key={sale.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{sale.id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{sale.items.reduce((s, i) => s + i.qty, 0)} items</td>
                    <td><span className={`badge ${sale.paymentMethod === 'cash' ? 'badge-success' : 'badge-primary'}`}>{sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sale.cashierName || 'System'}</td>
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

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function PaymentRow({ label, count, revenue, color, total }) {
  return (
    <div className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>GH₵ {revenue.toFixed(2)}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} orders ({total > 0 ? ((count / total) * 100).toFixed(0) : 0}%)</p>
      </div>
    </div>
  );
}

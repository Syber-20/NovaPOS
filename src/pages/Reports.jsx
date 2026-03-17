import { useState, useMemo } from 'react';
import { FileText, Download, Package, ShoppingBag, Truck, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const RANGES = [
  { label: '7 Days',  days: 7  },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export default function Reports() {
  const { sales, products, inventory, suppliers } = useApp();
  const [selectedDays, setSelectedDays] = useState(7);
  const [activeReport, setActiveReport] = useState('sales');

  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selectedDays);
    return [...sales]
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, selectedDays]);

  // Profit & Loss Data
  const plData = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const cost = filteredSales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        return itemSum + ((product?.costPrice || 0) * item.qty);
      }, 0);
    }, 0);
    const profit = revenue - cost;
    return { revenue, cost, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  }, [filteredSales, products]);

  // Supplier Performance Data
  const supplierReport = useMemo(() => {
    const stats = {};
    suppliers.forEach(s => stats[s.id] = { name: s.name, itemsSold: 0, revenue: 0, cost: 0, profit: 0 });
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && stats[product.supplierId]) {
          const s = stats[product.supplierId];
          const cost = (product.costPrice || 0) * item.qty;
          s.itemsSold += item.qty;
          s.revenue   += item.subtotal;
          s.cost      += cost;
          s.profit    += (item.subtotal - cost);
        }
      });
    });
    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products, suppliers]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const cashSales    = filteredSales.filter(s => s.paymentMethod === 'cash');
  const mobileSales  = filteredSales.filter(s => s.paymentMethod === 'mobile_money');

  // CSV download helper
  const downloadCSV = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSalesReport = () => {
    downloadCSV(
      `nova-sales-${selectedDays}days.csv`,
      ['Sale ID', 'Date', 'Items', 'Payment Method', 'Revenue', 'Cost', 'Profit'],
      filteredSales.map(s => {
        const cost = s.items.reduce((sum, item) => {
          const p = products.find(p => p.id === item.productId);
          return sum + ((p?.costPrice || 0) * item.qty);
        }, 0);
        return [
          s.id,
          new Date(s.date).toLocaleString(),
          s.items.map(i => `${i.productName} x${i.qty}`).join('; '),
          s.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash',
          s.total.toFixed(2),
          cost.toFixed(2),
          (s.total - cost).toFixed(2),
        ];
      })
    );
  };

  const downloadSupplierReport = () => {
    downloadCSV(
      'nova-supplier-performance.csv',
      ['Supplier', 'Items Sold', 'Revenue (GH₵)', 'Cost (GH₵)', 'Profit (GH₵)', 'Margin (%)'],
      supplierReport.map(s => [
        s.name,
        s.itemsSold,
        s.revenue.toFixed(2),
        s.cost.toFixed(2),
        s.profit.toFixed(2),
        s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : '0',
      ])
    );
  };

  const downloadRestockReport = () => {
    downloadCSV(
      'nova-restock-report.csv',
      ['Product', 'Category', 'Size', 'Brand', 'Current Stock', 'Threshold', 'Supplier'],
      lowStockItems.map(i => {
        const supplier = suppliers.find(s => s.id === i.product.supplierId);
        return [
          i.product.name,
          i.product.category,
          i.product.size || 'N/A',
          i.product.brand,
          i.quantity,
          i.lowStockThreshold,
          supplier?.name || 'Unknown',
        ];
      })
    );
  };

  const downloadProductReport = () => {
    downloadCSV(
      `nova-products-${selectedDays}days.csv`,
      ['Product', 'Units Sold', 'Revenue (GH₵)', 'Cost (GH₵)', 'Profit (GH₵)'],
      productReport.map(p => {
        const product = products.find(item => item.id === p.id);
        const cost = (product?.costPrice || 0) * p.qty;
        return [p.name, p.qty, p.revenue.toFixed(2), cost.toFixed(2), (p.revenue - cost).toFixed(2)];
      })
    );
  };

  const REPORT_TABS = [
    { id: 'sales',    label: 'Sales Report',   icon: ShoppingBag },
    { id: 'pl',       label: 'Profit & Loss',  icon: FileText    },
    { id: 'suppliers',label: 'Suppliers',      icon: Truck       },
    { id: 'restock',  label: 'Restock',        icon: Package     },
    { id: 'products', label: 'Products',       icon: TrendingUp  },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reports</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RANGES.map(r => (
            <button
              key={r.days}
              className={`btn btn-sm ${selectedDays === r.days ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report type tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {REPORT_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`btn ${activeReport === id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveReport(id)}
            style={{ gap: '0.5rem' }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── SALES REPORT ── */}
      {activeReport === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <SummaryCard label="Total Revenue"   value={`GH₵ ${totalRevenue.toFixed(2)}`} color="var(--success)" />
            <SummaryCard label="Total Orders"    value={filteredSales.length}              color="var(--primary)" />
            <SummaryCard label="Cash Sales"      value={cashSales.length}                  color="var(--warning)" />
            <SummaryCard label="Mobile Money"    value={mobileSales.length}                color="var(--secondary)" />
          </div>

          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
              <h3>Sales — Last {selectedDays} Days</h3>
              <button className="btn btn-secondary btn-sm" onClick={downloadSalesReport}>
                <Download size={15} /> Export CSV
              </button>
            </div>
            {filteredSales.length === 0 ? (
              <div className="empty-state"><p>No sales in this period.</p></div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Date & Time</th>
                      <th>Products</th>
                      <th>Payment</th>
                      <th>Cashier</th>
                      <th>Change</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(sale => (
                      <tr key={sale.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{sale.id}</td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontSize: '0.82rem', maxWidth: 200 }}>
                          {sale.items.map(i => `${i.productName} ×${i.qty}`).join(', ')}
                        </td>
                        <td>
                          <span className={`badge ${sale.paymentMethod === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                            {sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sale.cashierName || 'System'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>GH₵ {sale.change.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>GH₵ {sale.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROFIT & LOSS ── */}
      {activeReport === 'pl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Revenue</p>
              <h2 style={{ fontSize: '2rem' }}>GH₵ {plData.revenue.toFixed(2)}</h2>
            </div>
            <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Cost of Sales</p>
              <h2 style={{ fontSize: '2rem' }}>GH₵ {plData.cost.toFixed(2)}</h2>
            </div>
            <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gross Profit</p>
              <h2 style={{ fontSize: '2rem', color: 'var(--success)' }}>GH₵ {plData.profit.toFixed(2)}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Margin: {plData.margin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="card">
            <h3>P&L Summary — Last {selectedDays} Days</h3>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between" style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                <span>Sales Revenue</span>
                <span style={{ fontWeight: 600 }}>GH₵ {plData.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                <span>Cost of Goods Sold (COGS)</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>- GH₵ {plData.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                <span style={{ fontWeight: 700 }}>Gross Profit</span>
                <span style={{ fontWeight: 700 }}>GH₵ {plData.profit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLIER PERFORMANCE ── */}
      {activeReport === 'suppliers' && (
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <h3>Supplier Performance</h3>
            <button className="btn btn-secondary btn-sm" onClick={downloadSupplierReport}>
              <Download size={15} /> Export CSV
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Items Sold</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {supplierReport.map(s => (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.itemsSold}</td>
                    <td>GH₵ {s.revenue.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>GH₵ {s.cost.toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>GH₵ {s.profit.toFixed(2)}</td>
                    <td>
                      <span className="badge badge-primary">
                        {s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RESTOCK REPORT ── */}
      {activeReport === 'restock' && (
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3>Restock Report</h3>
              {lowStockItems.length > 0 && (
                <span className="badge badge-danger">
                  <AlertTriangle size={11} /> {lowStockItems.length} items low
                </span>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={downloadRestockReport} disabled={lowStockItems.length === 0}>
              <Download size={15} /> Export CSV
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={26} /></div>
              <h3>All items are well stocked</h3>
              <p>No products are below their restock threshold.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => {
                    const supplier = suppliers.find(s => s.id === item.product.supplierId);
                    const isOut    = item.quantity === 0;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product.name}</td>
                        <td>{item.product.category}</td>
                        <td>{item.product.size || '—'}</td>
                        <td style={{ fontWeight: 600, color: isOut ? 'var(--danger)' : 'var(--warning)' }}>
                          {item.quantity}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.lowStockThreshold}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{supplier?.name || 'Unknown'}</td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : 'badge-warning'}`}>
                            {isOut ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT PERFORMANCE REPORT ── */}
      {activeReport === 'products' && (
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <h3>Product Performance — Last {selectedDays} Days</h3>
            <button className="btn btn-secondary btn-sm" onClick={downloadProductReport} disabled={productReport.length === 0}>
              <Download size={15} /> Export CSV
            </button>
          </div>

          {productReport.length === 0 ? (
            <div className="empty-state"><p>No sales data in this period.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.map((p, i) => {
                    const inv = inventory.find(inv => inv.productId === p.id);
                    const product = products.find(item => item.id === p.id);
                    const cost = (product?.costPrice || 0) * p.qty;
                    const stock = inv ? inv.quantity : 0;
                    const isLow = inv && stock <= inv.lowStockThreshold;
                    return (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>{p.qty}</td>
                        <td style={{ fontWeight: 600 }}>GH₵ {p.revenue.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>GH₵ {(p.revenue - cost).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                            {stock} {isLow ? '⚠ Low' : 'in stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</p>
    </div>
  );
}

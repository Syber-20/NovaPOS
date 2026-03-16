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

  // Low stock items
  const lowStockItems = useMemo(() => {
    return inventory
      .filter(i => i.quantity <= i.lowStockThreshold)
      .map(i => ({
        ...i,
        product: products.find(p => p.id === i.productId),
      }))
      .filter(i => i.product);
  }, [inventory, products]);

  // Top products report
  const productReport = useMemo(() => {
    const counts = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.productId]) counts[item.productId] = { qty: 0, revenue: 0, name: item.productName };
        counts[item.productId].qty     += item.qty;
        counts[item.productId].revenue += item.subtotal;
      });
    });
    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

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
      ['Sale ID', 'Date', 'Items', 'Payment Method', 'Amount Paid', 'Change', 'Total'],
      filteredSales.map(s => [
        s.id,
        new Date(s.date).toLocaleString(),
        s.items.map(i => `${i.productName} x${i.qty}`).join('; '),
        s.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash',
        `GH₵${s.amountPaid.toFixed(2)}`,
        `GH₵${s.change.toFixed(2)}`,
        `GH₵${s.total.toFixed(2)}`,
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
      ['Product', 'Units Sold', 'Revenue (GH₵)'],
      productReport.map(p => [p.name, p.qty, p.revenue.toFixed(2)])
    );
  };

  const REPORT_TABS = [
    { id: 'sales',    label: 'Sales Report',   icon: ShoppingBag },
    { id: 'restock',  label: 'Restock Report', icon: Truck       },
    { id: 'products', label: 'Product Report', icon: Package     },
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
                    <th>Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.map((p, i) => {
                    const inv = inventory.find(inv => inv.productId === p.id);
                    const stock = inv ? inv.quantity : 0;
                    const isLow = inv && stock <= inv.lowStockThreshold;
                    return (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>{p.qty}</td>
                        <td style={{ fontWeight: 600 }}>GH₵ {p.revenue.toFixed(2)}</td>
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

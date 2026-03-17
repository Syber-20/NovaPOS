import { useState, useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, CheckCircle, Plus, X, RefreshCw, Search, Calendar, Boxes } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function InventoryDashboard() {
  const { products, inventory, suppliers, updateStock } = useApp();

  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('All');
  const [filterStatus,setFilterStatus]= useState('All');
  const [restockModal,setRestockModal]= useState(null);
  const [restockQty,  setRestockQty]  = useState('');
  const [restockLog,  setRestockLog]  = useState([]);
  const [successMsg,  setSuccessMsg]  = useState('');

  const getInv = (productId) => inventory.find(i => i.productId === productId) || { quantity: 0, lowStockThreshold: 10, expiryDate: null };

  const getStatus = (inv) => {
    if (inv.quantity === 0)                    return 'out';
    if (inv.quantity <= inv.lowStockThreshold) return 'low';
    return 'ok';
  };

  const enriched = useMemo(() => products.map(p => ({
    product: p,
    inv:     getInv(p.id),
    supplier: suppliers.find(s => s.id === p.supplierId),
  })), [products, inventory, suppliers]);

  const filtered = enriched.filter(({ product, inv }) => {
    const matchCat    = filterCat === 'All' || product.category === filterCat;
    const matchQuery  = product.name.toLowerCase().includes(search.toLowerCase()) ||
                        (product.brand || '').toLowerCase().includes(search.toLowerCase());
    const status      = getStatus(inv);
    const matchStatus = filterStatus === 'All' || status === filterStatus;
    return matchCat && matchQuery && matchStatus;
  });

  // Summary counts
  const totalProducts = products.length;
  const outCount      = enriched.filter(({ inv }) => getStatus(inv) === 'out').length;
  const lowCount      = enriched.filter(({ inv }) => getStatus(inv) === 'low').length;
  const okCount       = enriched.filter(({ inv }) => getStatus(inv) === 'ok').length;
  const expiringItems = enriched.filter(({ inv }) => {
    if (!inv.expiryDate) return false;
    const days = (new Date(inv.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days >= 0;
  });

  const lowStockItems = enriched.filter(({ inv }) => getStatus(inv) === 'low' || getStatus(inv) === 'out');

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return;
    const inv     = getInv(restockModal.product.id);
    const newQty  = inv.quantity + qty;
    await updateStock(restockModal.product.id, newQty, inv.lowStockThreshold, inv.expiryDate);
    setRestockLog(prev => [{
      productName: restockModal.product.id,
      label:       restockModal.product.name,
      qty,
      date:        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      newTotal:    newQty,
    }, ...prev.slice(0, 9)]);
    setSuccessMsg(`✓ ${restockModal.product.name} restocked by ${qty} units`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setRestockModal(null);
    setRestockQty('');
  };

  const CATEGORIES = ['All', 'Diapers', 'Wipes', 'Soap'];

  return (
    <div className="page-container">

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 300,
          background: 'var(--success)', color: 'white',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {successMsg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>Inventory Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Monitor stock levels, restock products, and track expiry dates
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SummaryCard label="Total Products" value={totalProducts} icon={<Boxes size={20} />}      bg="rgba(79,70,229,0.1)"  color="var(--primary)"  onClick={() => setFilterStatus('All')} />
        <SummaryCard label="In Stock"        value={okCount}       icon={<CheckCircle size={20} />} bg="var(--success-light)" color="var(--success)"  onClick={() => setFilterStatus('ok')}  />
        <SummaryCard label="Low Stock"       value={lowCount}      icon={<TrendingDown size={20} />}bg="var(--warning-light)" color="var(--warning)"  onClick={() => setFilterStatus('low')} />
        <SummaryCard label="Out of Stock"    value={outCount}      icon={<AlertTriangle size={20} />}bg="var(--danger-light)"color="var(--danger)"   onClick={() => setFilterStatus('out')} />
        <SummaryCard label="Expiring (30d)"  value={expiringItems.length} icon={<Calendar size={20} />} bg="#FEF3C7" color="#D97706" onClick={() => {}} />
      </div>

      {/* ── Low Stock Alert Banner ── */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FFF7ED)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <p style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem' }}>
              {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} need restocking
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {lowStockItems.slice(0, 6).map(({ product, inv, supplier }) => (
              <div key={product.id} style={{
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                fontSize: '0.82rem',
              }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{product.name}</p>
                  <p style={{ color: getStatus(inv) === 'out' ? 'var(--danger)' : 'var(--warning)', fontWeight: 500 }}>
                    {inv.quantity} left · {supplier?.name || 'No supplier'}
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setRestockModal({ product, inv }); setRestockQty('20'); }}
                >
                  <Plus size={13} /> Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT: Inventory Table ── */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)' }} onClick={() => setFilterCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <select className="input" style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                    <th>Expiry</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No products match.</td></tr>
                  ) : filtered.map(({ product, inv, supplier }) => {
                    const status  = getStatus(inv);
                    const isOut   = status === 'out';
                    const isLow   = status === 'low';
                    const expiring = inv.expiryDate && (new Date(inv.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 30;
                    return (
                      <tr key={product.id}>
                        <td>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{product.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.brand}</p>
                        </td>
                        <td>
                          <span className={`badge ${product.category === 'Diapers' ? 'badge-primary' : product.category === 'Wipes' ? 'badge-success' : 'badge-warning'}`}>
                            {product.category}{product.size ? ` · ${product.size}` : ''}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                            {inv.quantity}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{inv.lowStockThreshold}</td>
                        <td style={{ fontSize: '0.82rem', color: expiring ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {inv.expiryDate
                            ? <span style={{ fontWeight: expiring ? 700 : 400 }}>
                                {expiring && '⚠ '}{new Date(inv.expiryDate + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                              </span>
                            : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{supplier?.name || '—'}</td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setRestockModal({ product, inv }); setRestockQty(''); }}
                          >
                            <RefreshCw size={13} /> Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Restock Log ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Expiry Alert */}
          {expiringItems.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)', padding: '1rem' }}>
              <p style={{ fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <Calendar size={15} /> Expiring Soon
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {expiringItems.map(({ product, inv }) => {
                  const days = Math.ceil((new Date(inv.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 500 }}>{product.name}</span>
                      <span style={{ color: days <= 7 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                        {days}d left
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Restock Log */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={15} color="var(--primary)" /> Restock Log
            </p>
            {restockLog.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
                No restocks this session
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {restockLog.map((log, i) => (
                  <div key={i} style={{ padding: '0.6rem 0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <p style={{ fontWeight: 600 }}>{log.label}</p>
                    <p style={{ color: 'var(--text-muted)' }}>+{log.qty} units · now {log.newTotal} · {log.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Restock / Update Modal ── */}
      {restockModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Update Stock</h3>
              <button className="modal-close-btn" onClick={() => setRestockModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRestock}>
              <div className="modal-body">
                <div style={{ background: 'var(--background)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                  <p style={{ fontWeight: 700 }}>{restockModal.product.name}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {restockModal.product.category}{restockModal.product.size ? ` · ${restockModal.product.size}` : ''} · Current stock: <strong>{restockModal.inv.quantity}</strong>
                  </p>
                </div>
                <div className="form-grid">
                  <div className="input-group span-2">
                    <label>Quantity to Add</label>
                    <input required min="1" type="number" className="input"
                      value={restockQty}
                      onChange={e => setRestockQty(e.target.value)}
                      placeholder="e.g. 50"
                      autoFocus
                    />
                    {restockQty > 0 && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 500, marginTop: '0.25rem' }}>
                        New total will be: {restockModal.inv.quantity + parseInt(restockQty || 0)}
                      </p>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Low Stock Threshold</label>
                    <input type="number" className="input" min="1"
                      defaultValue={restockModal.inv.lowStockThreshold}
                      id="threshold-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Expiry Date</label>
                    <input type="date" className="input"
                      defaultValue={restockModal.inv.expiryDate || ''}
                      id="expiry-input"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRestockModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <RefreshCw size={15} /> Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, bg, color, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem 1.25rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</p>
      </div>
    </div>
  );
}

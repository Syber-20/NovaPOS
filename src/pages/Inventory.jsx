import { useState } from 'react';
import { AlertCircle, Search, X, PackagePlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['All', 'Diapers', 'Wipes', 'Soap'];

export default function Inventory() {
  const { products, inventory, updateStock } = useApp();

  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('All');
  const [filterStatus,setFilterStatus]= useState('All');
  const [editModal,   setEditModal]   = useState(null); // { product, inv }
  const [editForm,    setEditForm]    = useState({ quantity: 0, lowStockThreshold: 10, expiryDate: '' });

  const getInv = (productId) => inventory.find(i => i.productId === productId);

  const getStatus = (inv) => {
    if (!inv || inv.quantity === 0)              return 'out';
    if (inv.quantity <= inv.lowStockThreshold)   return 'low';
    return 'ok';
  };

  const enriched = products.map(p => ({
    product: p,
    inv:     getInv(p.id) || { quantity: 0, lowStockThreshold: 10, expiryDate: null },
  }));

  const filtered = enriched.filter(({ product, inv }) => {
    const matchCat    = filterCat === 'All' || product.category === filterCat;
    const matchQuery  = product.name.toLowerCase().includes(search.toLowerCase()) ||
                        (product.brand || '').toLowerCase().includes(search.toLowerCase());
    const status      = getStatus(inv);
    const matchStatus = filterStatus === 'All' ||
                        (filterStatus === 'low' && status === 'low') ||
                        (filterStatus === 'out' && status === 'out') ||
                        (filterStatus === 'ok'  && status === 'ok');
    return matchCat && matchQuery && matchStatus;
  });

  // Summary counts
  const outCount  = enriched.filter(({ inv }) => getStatus(inv) === 'out').length;
  const lowCount  = enriched.filter(({ inv }) => getStatus(inv) === 'low').length;
  const okCount   = enriched.filter(({ inv }) => getStatus(inv) === 'ok').length;

  const openEdit = ({ product, inv }) => {
    setEditForm({
      quantity:          inv.quantity,
      lowStockThreshold: inv.lowStockThreshold,
      expiryDate:        inv.expiryDate || '',
    });
    setEditModal({ product, inv });
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateStock(
      editModal.product.id,
      parseInt(editForm.quantity),
      parseInt(editForm.lowStockThreshold),
      editForm.expiryDate || null,
    );
    setEditModal(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Inventory Tracking</h2>
      </div>

      {/* Summary stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SummaryCard label="Total Products" value={products.length}  color="var(--primary)"  bg="rgba(79,70,229,0.08)" />
        <SummaryCard label="In Stock"        value={okCount}          color="var(--success)"  bg="var(--success-light)" />
        <SummaryCard label="Low Stock"       value={lowCount}         color="var(--warning)"  bg="var(--warning-light)" />
        <SummaryCard label="Out of Stock"    value={outCount}         color="var(--danger)"   bg="var(--danger-light)"  />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
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

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category / Size</th>
                <th>Brand</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(({ product, inv }) => {
                  const status  = getStatus(inv);
                  const isOut   = status === 'out';
                  const isLow   = status === 'low';
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {product.category}{product.size ? ` · ${product.size}` : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{product.brand || '—'}</td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                          {inv.quantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{inv.lowStockThreshold}</td>
                      <td style={{ color: inv.expiryDate ? 'var(--text-muted)' : 'var(--border)', fontSize: '0.85rem' }}>
                        {inv.expiryDate
                          ? new Date(inv.expiryDate + 'T00:00:00').toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                          {isOut ? <><AlertCircle size={11} /> Out of Stock</> : isLow ? <><AlertCircle size={11} /> Low Stock</> : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit({ product, inv })}>
                          <PackagePlus size={14} /> Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Stock Modal */}
      {editModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Update Stock</h3>
              <button className="modal-close-btn" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{editModal.product.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {editModal.product.category}{editModal.product.size ? ` · ${editModal.product.size}` : ''}
                </p>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Current Quantity *</label>
                    <input required min="0" type="number" className="input"
                      value={editForm.quantity}
                      onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Low Stock Threshold *</label>
                    <input required min="0" type="number" className="input"
                      value={editForm.lowStockThreshold}
                      onChange={e => setEditForm(f => ({ ...f, lowStockThreshold: e.target.value }))} />
                  </div>
                  <div className="input-group span-2">
                    <label>Expiry Date (optional)</label>
                    <input type="date" className="input"
                      value={editForm.expiryDate}
                      onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bg }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</span>
      </div>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </div>
  );
}

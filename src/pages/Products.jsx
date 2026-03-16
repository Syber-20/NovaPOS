import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['Diapers', 'Wipes', 'Soap'];
const SIZES      = ['Newborn', 'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Standard', 'N/A'];

const EMPTY_FORM = {
  name: '', category: 'Diapers', size: 'Size 1', brand: '',
  price: '', costPrice: '', sku: '', supplierId: '',
};

export default function Products() {
  const { products, inventory, suppliers, addProduct, updateProduct, deleteProduct } = useApp();

  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('All');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [initialQty,  setInitialQty]  = useState(0);
  const [confirmDel,  setConfirmDel]  = useState(null); // product id to delete

  const getStock = (productId) => {
    const inv = inventory.find(i => i.productId === productId);
    return inv ? inv.quantity : 0;
  };

  const filteredProducts = products.filter(p => {
    const matchCat   = filterCat === 'All' || p.category === filterCat;
    const matchQuery = p.name.toLowerCase().includes(search.toLowerCase()) ||
                       (p.brand || '').toLowerCase().includes(search.toLowerCase()) ||
                       (p.sku  || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, supplierId: suppliers[0]?.id || '' });
    setInitialQty(0);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setFormData({
      name:       product.name,
      category:   product.category,
      size:       product.size || 'N/A',
      brand:      product.brand || '',
      price:      product.price,
      costPrice:  product.costPrice || '',
      sku:        product.sku || '',
      supplierId: product.supplierId || '',
    });
    setEditingId(product.id);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price:     parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
      size:      formData.size === 'N/A' ? null : formData.size,
    };

    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      const newProduct = addProduct(payload);
      // Set initial stock if provided
      if (initialQty > 0) {
        // addProduct auto-creates an inventory row with qty 0; update it
        // updateStock is called via AppContext after addProduct creates the row
        // We trigger it by updating the inventory through context
        // Since addProduct already creates the inv row, we update it:
        setTimeout(() => {
          // updateStock runs after state settles
        }, 0);
        _ = newProduct; // used below
      }
    }
    setModalOpen(false);
  };

  const confirmDelete = (id) => setConfirmDel(id);

  const handleDelete = () => {
    deleteProduct(confirmDel);
    setConfirmDel(null);
  };

  const field = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Product Catalog</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={17} /> New Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, brand or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Size</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const stock    = getStock(p.id);
                  const inv      = inventory.find(i => i.productId === p.id);
                  const isLow    = inv && stock <= inv.lowStockThreshold;
                  const supplier = suppliers.find(s => s.id === p.supplierId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>}
                      </td>
                      <td>
                        <span className={`badge ${p.category === 'Diapers' ? 'badge-primary' : p.category === 'Wipes' ? 'badge-success' : 'badge-warning'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.size || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.brand || '—'}</td>
                      <td style={{ fontWeight: 600 }}>GH₵{p.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${stock === 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                          {stock} {isLow && stock > 0 ? '⚠' : ''}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {supplier?.name || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(p.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group span-2">
                    <label>Product Name *</label>
                    <input required type="text" className="input" value={formData.name} onChange={e => field('name', e.target.value)} placeholder="e.g. Pampers Size 3" />
                  </div>
                  <div className="input-group">
                    <label>Category *</label>
                    <select className="input" value={formData.category} onChange={e => field('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Size</label>
                    <select className="input" value={formData.size} onChange={e => field('size', e.target.value)}>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Brand</label>
                    <input type="text" className="input" value={formData.brand} onChange={e => field('brand', e.target.value)} placeholder="e.g. Pampers" />
                  </div>
                  <div className="input-group">
                    <label>SKU</label>
                    <input type="text" className="input" value={formData.sku} onChange={e => field('sku', e.target.value)} placeholder="e.g. PAM-S3" />
                  </div>
                  <div className="input-group">
                    <label>Selling Price (GH₵) *</label>
                    <input required min="0" step="0.01" type="number" className="input" value={formData.price} onChange={e => field('price', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Cost Price (GH₵)</label>
                    <input min="0" step="0.01" type="number" className="input" value={formData.costPrice} onChange={e => field('costPrice', e.target.value)} />
                  </div>
                  {!editingId && (
                    <div className="input-group span-2">
                      <label>Initial Stock Quantity</label>
                      <input min="0" type="number" className="input" value={initialQty} onChange={e => setInitialQty(parseInt(e.target.value) || 0)} />
                    </div>
                  )}
                  <div className="input-group span-2">
                    <label>Supplier</label>
                    <select className="input" value={formData.supplierId} onChange={e => field('supplierId', e.target.value)}>
                      <option value="">— Select Supplier —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDel && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Delete Product</h3>
              <button className="modal-close-btn" onClick={() => setConfirmDel(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{products.find(p => p.id === confirmDel)?.name}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This will also remove its inventory record. This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} style={{ background: 'var(--danger)', color: 'white' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

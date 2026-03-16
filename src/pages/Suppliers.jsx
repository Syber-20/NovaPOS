import { useState } from 'react';
import { PackagePlus, Truck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Suppliers() {
  const { suppliers, products, inventory, updateStock } = useApp();

  const [restockModal, setRestockModal] = useState({ open: false, product: null, qty: 10 });

  // Get stock quantity for a product
  const getStock = (productId) => {
    const inv = inventory.find(i => i.productId === productId);
    return inv ? inv.quantity : 0;
  };

  const lowStockProducts = products.filter(p => {
    const inv = inventory.find(i => i.productId === p.id);
    return inv && inv.quantity <= inv.lowStockThreshold;
  });

  const handleRestock = (e) => {
    e.preventDefault();
    const inv = inventory.find(i => i.productId === restockModal.product.id);
    const newQty = (inv ? inv.quantity : 0) + parseInt(restockModal.qty);
    updateStock(restockModal.product.id, newQty);
    setRestockModal({ open: false, product: null, qty: 10 });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Restock Management</h2>
      </div>

      <div className="suppliers-layout flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT COLUMN */}
        <div className="flex-col gap-4" style={{ flex: 2, minWidth: 280 }}>

          {/* Low stock alert */}
          {lowStockProducts.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)', borderWidth: 1 }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} /> Low Stock Restock Alerts
              </h3>
              <ul style={{ listStyle: 'none' }}>
                {lowStockProducts.map(p => {
                  const supplier = suppliers.find(s => s.id === p.supplierId);
                  return (
                    <li key={p.id} className="flex justify-between items-center" style={{ padding: '0.75rem 0', borderBottom: '1px dashed rgba(239,68,68,0.3)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                          Only {getStock(p.id)} left · Supplier: {supplier?.name || 'Unknown'}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRestockModal({ open: true, product: p, qty: 20 })}
                      >
                        Order More
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Supplier Directory */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3>Supplier Directory</h3>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contact}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.phone}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Quick Restock */}
        <div className="card flex-col" style={{ flex: 1, minWidth: 240, position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PackagePlus size={20} /> Quick Restock
          </h3>
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {products.map(p => (
              <div key={p.id} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ overflow: 'hidden', flex: 1, marginRight: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Stock: {getStock(p.id)}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRestockModal({ open: true, product: p, qty: 10 })}
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal.open && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Restock Inventory</h3>
              <button className="modal-close-btn" onClick={() => setRestockModal({ open: false, product: null, qty: 10 })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRestock}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)' }}>
                  Receiving new stock for <strong>{restockModal.product.name}</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Current stock: <strong>{getStock(restockModal.product.id)}</strong>
                </p>
                <div className="input-group">
                  <label>Quantity Received</label>
                  <input
                    required
                    min="1"
                    type="number"
                    className="input"
                    value={restockModal.qty}
                    onChange={e => setRestockModal({ ...restockModal, qty: e.target.value })}
                  />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  New stock will be: <strong>{getStock(restockModal.product.id) + parseInt(restockModal.qty || 0)}</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRestockModal({ open: false, product: null, qty: 10 })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Receive Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

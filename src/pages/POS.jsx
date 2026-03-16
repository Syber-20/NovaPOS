import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, ShoppingCart, Printer } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { useApp } from '../context/AppContext';

export default function POS() {
  const { products, inventory, processSale, currentUser } = useApp();

  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('All');
  const [cart, setCart]                   = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountTendered, setAmountTendered] = useState('');
  const [receipt, setReceipt]             = useState(null);
  const [error, setError]                 = useState('');
  const [processing, setProcessing]       = useState(false);

  // ── Paystack Configuration ──────────────────────────────────────────────────
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  
  const paystackConfig = {
    reference: `REF-${Date.now()}`,
    email: currentUser?.email || 'sales@novapos.com',
    amount: Math.round(cartTotal * 100), // convert to pesewas
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaystackSuccess = (reference) => {
    const sale = processSale(cart, 'paystack', cartTotal);
    setReceipt(sale);
    setCart([]);
    setPaymentMethod('');
    setAmountTendered('');
    setProcessing(false);
  };

  const handlePaystackClose = () => {
    setProcessing(false);
    setError('Payment was cancelled.');
  };

  // Get live stock for a product
  const getStock = (productId) => {
    const inv = inventory.find(i => i.productId === productId);
    return inv ? inv.quantity : 0;
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat   = category === 'All' || p.category === category;
      const matchQuery = p.name.toLowerCase().includes(search.toLowerCase());
      const inStock    = getStock(p.id) > 0;
      return matchCat && matchQuery && inStock;
    });
  }, [products, inventory, search, category]);

  const change    = amountTendered ? Math.max(0, parseFloat(amountTendered) - cartTotal) : 0;

  // ── Cart actions ────────────────────────────────────────────────────────────
  const addToCart = (product) => {
    const stock = getStock(product.id);
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.qty >= stock) return prev;
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId:   product.id,
        productName: product.name,
        unitPrice:   product.price,
        qty:         1,
        subtotal:    product.price,
      }];
    });
  };

  const updateQty = (productId, delta) => {
    const stock = getStock(productId);
    setCart(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item;
        const newQty = item.qty + delta;
        if (newQty > stock) return item;
        if (newQty <= 0) return null;
        return { ...item, qty: newQty, subtotal: newQty * item.unitPrice };
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const checkout = async () => {
    setError('');
    if (cart.length === 0)  return;
    if (!paymentMethod)     return setError('Please select a payment method.');

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (!amountTendered || isNaN(tendered) || tendered < cartTotal) {
        return setError(`Amount tendered must be at least GH₵ ${cartTotal.toFixed(2)}.`);
      }
      const sale = await processSale(cart, 'cash', tendered);
      setReceipt(sale);
      setCart([]);
      setPaymentMethod('');
      setAmountTendered('');
    } else if (paymentMethod === 'mobile_money') {
      setProcessing(true);
      initializePayment(handlePaystackSuccess, handlePaystackClose);
    }
  };

  const startNewSale = () => setReceipt(null);

  return (
    <div className="pos-layout" style={{ display: 'flex', height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

      {/* ── LEFT: Product Grid ── */}
      <div className="pos-product-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Search + Category filter */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)' }}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={24} /></div>
              <h3>No products found</h3>
              <p>Try a different search or category.</p>
            </div>
          ) : (
            <div className="pos-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {filteredProducts.map(product => {
                const stock     = getStock(product.id);
                const inCart    = cart.find(i => i.productId === product.id);
                const cartQty   = inCart ? inCart.qty : 0;
                const remaining = stock - cartQty;

                return (
                  <div
                    key={product.id}
                    className="card"
                    style={{ cursor: remaining > 0 ? 'pointer' : 'not-allowed', opacity: remaining === 0 ? 0.5 : 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}
                    onClick={() => remaining > 0 && addToCart(product)}
                  >
                    {cartQty > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                        {cartQty}
                      </div>
                    )}
                    <span className={`badge ${product.category === 'Diapers' ? 'badge-primary' : product.category === 'Wipes' ? 'badge-success' : 'badge-warning'}`} style={{ alignSelf: 'flex-start' }}>
                      {product.category}
                    </span>
                    <h4 style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>{product.name}</h4>
                    {product.size && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.size}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>GH₵{product.price.toFixed(2)}</span>
                      <span style={{ fontSize: '0.72rem', color: remaining <= 5 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {remaining} left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart & Checkout ── */}
      <div className="pos-cart-panel" style={{ width: 360, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>

        {/* Cart header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} /> Current Sale
          </h3>
          {cart.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => setCart([])}>
              Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon"><ShoppingCart size={22} /></div>
              <p>Tap a product to add it</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cart.map(item => (
                <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GH₵{item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button onClick={() => updateQty(item.productId, -1)} style={{ width: 24, height: 24, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 600, width: 22, textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} style={{ width: 24, height: 24, border: 'none', background: 'var(--primary-light)', color: 'white', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ width: 56, textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                    GH₵{item.subtotal.toFixed(2)}
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout panel */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>{cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</span>
              <span>GH₵{cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>GH₵{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          {cart.length > 0 && (
            <>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn flex-1 btn-sm ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setPaymentMethod('cash'); setError(''); }}>
                    <Banknote size={15} /> Cash
                  </button>
                  <button className={`btn flex-1 btn-sm ${paymentMethod === 'mobile_money' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setPaymentMethod('mobile_money'); setAmountTendered(''); setError(''); }}>
                    <CreditCard size={15} /> Mobile Money
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="input-group">
                  <label>Amount Tendered (GH₵)</label>
                  <input
                    type="number"
                    className="input"
                    value={amountTendered}
                    onChange={e => { setAmountTendered(e.target.value); setError(''); }}
                    placeholder={`Min. GH₵${cartTotal.toFixed(2)}`}
                    min={cartTotal}
                  />
                  {parseFloat(amountTendered) >= cartTotal && (
                    <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Change: GH₵{change.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'mobile_money' && (
                <div style={{ background: 'rgba(79,70,229,0.07)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                  Customer will complete payment on their phone. Confirm before proceeding.
                </div>
              )}
            </>
          )}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 500 }}>{error}</p>
          )}

          <button
            className="btn btn-primary w-full"
            style={{ padding: '0.85rem', fontSize: '1rem' }}
            disabled={cart.length === 0 || !paymentMethod}
            onClick={checkout}
          >
            <CheckCircle size={18} /> Process Payment
          </button>
        </div>
      </div>

      {/* ── Receipt Modal ── */}
      {receipt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <CheckCircle size={52} color="var(--success)" />
              <h2 style={{ marginTop: '0.5rem' }}>Payment Successful</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Transaction #{receipt.id}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {new Date(receipt.date).toLocaleString()}
              </p>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px dashed var(--border)' }}>
              {receipt.items.map(item => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>{item.qty}× {item.productName}</span>
                  <span style={{ fontWeight: 500 }}>GH₵{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <span>Total</span>
                <span>GH₵{receipt.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>Payment</span>
                <span>{receipt.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}</span>
              </div>
              {receipt.paymentMethod === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>Tendered</span>
                    <span>GH₵{receipt.amountPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>
                    <span>Change</span>
                    <span>GH₵{receipt.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" style={{ gap: '0.4rem' }} onClick={() => window.print()}>
                <Printer size={15} /> Print
              </button>
              <button className="btn btn-primary" onClick={startNewSale}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

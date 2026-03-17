import { useState, useMemo } from 'react';
import { ShoppingCart, Search, X, Plus, Minus, Trash2, CheckCircle, Package, Clock, Baby, ChevronRight, CreditCard, Banknote, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// ── Customer Portal — full shopping experience ──────────────────────────────

const TABS = ['shop', 'cart', 'orders'];

export default function CustomerPortal() {
  const { products, inventory, sales, currentUser, processSale, logout } = useApp();
  const navigate = useNavigate();

  const [tab,            setTab]            = useState('shop');
  const [search,         setSearch]         = useState('');
  const [filterCat,      setFilterCat]      = useState('All');
  const [cart,           setCart]           = useState([]);
  const [paymentMethod,  setPaymentMethod]  = useState('');
  const [amountTendered, setAmountTendered] = useState('');
  const [receipt,        setReceipt]        = useState(null);
  const [error,          setError]          = useState('');
  const [checkingOut,    setCheckingOut]    = useState(false);

  const getStock = (productId) => {
    const inv = inventory.find(i => i.productId === productId);
    return inv ? inv.quantity : 0;
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat   = filterCat === 'All' || p.category === filterCat;
      const matchQuery = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         (p.brand || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQuery && getStock(p.id) > 0;
    });
  }, [products, inventory, search, filterCat]);

  // Customer's past orders
  const myOrders = useMemo(() => {
    return [...sales]
      .filter(s => s.cashierId === currentUser?.uid || s.customerId === currentUser?.uid)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }, [sales, currentUser]);

  const cartTotal   = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const cartCount   = cart.reduce((sum, i) => sum + i.qty, 0);
  const change      = amountTendered ? Math.max(0, parseFloat(amountTendered) - cartTotal) : 0;

  const addToCart = (product) => {
    const stock = getStock(product.id);
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.qty >= stock) return prev;
        return prev.map(i => i.productId === product.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unitPrice }
          : i);
      }
      return [...prev, { productId: product.id, productName: product.name, unitPrice: product.price, qty: 1, subtotal: product.price }];
    });
  };

  const updateQty = (productId, delta) => {
    const stock = getStock(productId);
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.qty + delta;
      if (newQty > stock || newQty <= 0) return newQty <= 0 ? null : i;
      return { ...i, qty: newQty, subtotal: newQty * i.unitPrice };
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const handleCheckout = async () => {
    setError('');
    if (!paymentMethod) return setError('Please select a payment method.');
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (!amountTendered || isNaN(tendered) || tendered < cartTotal)
        return setError(`Amount must be at least GH₵${cartTotal.toFixed(2)}`);
    }
    setCheckingOut(true);
    try {
      const paid = paymentMethod === 'cash' ? parseFloat(amountTendered) : cartTotal;
      const sale = await processSale(cart, paymentMethod, paid);
      setReceipt(sale);
      setCart([]);
      setPaymentMethod('');
      setAmountTendered('');
      setTab('shop');
    } catch (e) {
      setError('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf6f0 0%, #fff9f5 50%, #f0f4ff 100%)',
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* ── Top Nav ── */}
      <nav style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 1.5rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #4F46E5, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Baby size={20} color="white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.1, color: '#0F172A' }}>Nova POS</p>
            <p style={{ fontSize: '0.65rem', color: '#64748B' }}>Baby Care Store</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Hi, <strong style={{ color: '#0F172A' }}>{currentUser?.name?.split(' ')[0]}</strong>
          </span>
          <button
            onClick={() => setTab('cart')}
            style={{
              position: 'relative', background: tab === 'cart' ? '#4F46E5' : '#F1F5F9',
              border: 'none', borderRadius: 10, width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: tab === 'cart' ? 'white' : '#0F172A',
            }}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#EC4899', color: 'white',
                fontSize: '0.6rem', fontWeight: 700,
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </button>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 8,
            padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem',
            color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Tab Switcher ── */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem 0',
        maxWidth: 1200, margin: '0 auto',
      }}>
        {[
          { id: 'shop',   label: 'Shop',    icon: Package },
          { id: 'cart',   label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}`, icon: ShoppingCart },
          { id: 'orders', label: 'My Orders', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '0.5rem 1.25rem',
            borderRadius: 99,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: tab === id ? '#4F46E5' : 'white',
            color: tab === id ? 'white' : '#64748B',
            boxShadow: tab === id ? '0 4px 12px rgba(79,70,229,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.5rem 3rem' }}>

        {/* ══════════ SHOP TAB ══════════ */}
        {tab === 'shop' && (
          <div>
            {/* Search + filter */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'white', border: '1px solid #E2E8F0',
                borderRadius: 12, padding: '0.6rem 1rem', flex: 1, minWidth: 200,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem', color: '#0F172A', flex: 1 }}
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}><X size={14} /></button>}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={{
                    padding: '0.45rem 1rem', borderRadius: 99, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    fontSize: '0.8rem',
                    background: filterCat === cat ? '#0F172A' : 'white',
                    color: filterCat === cat ? 'white' : '#64748B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.15s',
                  }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
                <Package size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {filteredProducts.map(product => {
                  const stock   = getStock(product.id);
                  const inCart  = cart.find(i => i.productId === product.id);
                  const cartQty = inCart ? inCart.qty : 0;
                  const remaining = stock - cartQty;

                  return (
                    <div key={product.id} style={{
                      background: 'white', borderRadius: 16,
                      border: cartQty > 0 ? '2px solid #4F46E5' : '1px solid #F1F5F9',
                      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}>
                      {cartQty > 0 && (
                        <div style={{
                          position: 'absolute', top: -8, right: -8,
                          background: '#4F46E5', color: 'white',
                          borderRadius: '50%', width: 24, height: 24,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700,
                        }}>{cartQty}</div>
                      )}

                      {/* Category pill */}
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem',
                        borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                        background: product.category === 'Diapers' ? '#EEF2FF' : product.category === 'Wipes' ? '#F0FDF4' : '#FFF7ED',
                        color: product.category === 'Diapers' ? '#4F46E5' : product.category === 'Wipes' ? '#16A34A' : '#EA580C',
                        alignSelf: 'flex-start',
                      }}>{product.category}</span>

                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.2rem' }}>{product.name}</p>
                        {product.brand && <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{product.brand}{product.size ? ` · ${product.size}` : ''}</p>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4F46E5' }}>GH₵{product.price.toFixed(2)}</span>
                        <span style={{ fontSize: '0.72rem', color: remaining <= 5 ? '#EF4444' : '#94A3B8', fontWeight: 500 }}>
                          {remaining} left
                        </span>
                      </div>

                      {/* Add / qty controls */}
                      {cartQty === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={remaining === 0}
                          style={{
                            background: remaining === 0 ? '#F1F5F9' : 'linear-gradient(135deg, #4F46E5, #818CF8)',
                            color: remaining === 0 ? '#94A3B8' : 'white',
                            border: 'none', borderRadius: 10, padding: '0.65rem',
                            fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
                            cursor: remaining === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Plus size={15} /> Add to Cart
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 10, padding: '0.4rem 0.75rem' }}>
                          <button onClick={() => updateQty(product.id, -1)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cartQty}</span>
                          <button onClick={() => updateQty(product.id, 1)} disabled={remaining === 0} style={{ background: remaining === 0 ? '#F1F5F9' : '#4F46E5', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: remaining === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: remaining === 0 ? '#94A3B8' : 'white' }}>
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating cart CTA */}
            {cartCount > 0 && (
              <div style={{
                position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                zIndex: 40,
              }}>
                <button onClick={() => setTab('cart')} style={{
                  background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                  color: 'white', border: 'none', borderRadius: 99,
                  padding: '0.85rem 2rem', fontFamily: 'inherit',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  whiteSpace: 'nowrap',
                }}>
                  <ShoppingCart size={18} />
                  View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
                  <span style={{ background: '#4F46E5', borderRadius: 99, padding: '0.2rem 0.6rem', fontSize: '0.85rem' }}>
                    GH₵{cartTotal.toFixed(2)}
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════ CART TAB ══════════ */}
        {tab === 'cart' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

            {/* Cart items */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Your Cart</h3>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 8, padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600 }}>
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                  <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Your cart is empty</p>
                  <button onClick={() => setTab('shop')} style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '0.6rem 1.5rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginTop: '0.5rem' }}>
                    Browse Products
                  </button>
                </div>
              ) : (
                <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{item.productName}</p>
                        <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>GH₵{item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => updateQty(item.productId, -1)} style={{ width: 28, height: 28, border: '1px solid #E2E8F0', background: 'white', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 700, width: 24, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, 1)} style={{ width: 28, height: 28, border: 'none', background: '#4F46E5', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, width: 72, textAlign: 'right', fontSize: '0.9rem' }}>GH₵{item.subtotal.toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', padding: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary & Payment */}
            {cart.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0 }}>Order Summary</h3>

                {/* Line items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B' }}>
                      <span>{item.productName} ×{item.qty}</span>
                      <span>GH₵{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: '#F1F5F9', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#4F46E5' }}>GH₵{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: '0.6rem' }}>Payment Method</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setPaymentMethod('cash'); setError(''); }} style={{
                      flex: 1, padding: '0.75rem', border: `2px solid ${paymentMethod === 'cash' ? '#4F46E5' : '#E2E8F0'}`,
                      borderRadius: 12, background: paymentMethod === 'cash' ? '#EEF2FF' : 'white',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                      color: paymentMethod === 'cash' ? '#4F46E5' : '#64748B',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                      transition: 'all 0.15s',
                    }}>
                      <Banknote size={20} />
                      Cash
                    </button>
                    <button onClick={() => { setPaymentMethod('mobile_money'); setAmountTendered(''); setError(''); }} style={{
                      flex: 1, padding: '0.75rem', border: `2px solid ${paymentMethod === 'mobile_money' ? '#4F46E5' : '#E2E8F0'}`,
                      borderRadius: 12, background: paymentMethod === 'mobile_money' ? '#EEF2FF' : 'white',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                      color: paymentMethod === 'mobile_money' ? '#4F46E5' : '#64748B',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                      transition: 'all 0.15s',
                    }}>
                      <CreditCard size={20} />
                      Mobile Money
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>
                      Amount Tendered (GH₵)
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={e => { setAmountTendered(e.target.value); setError(''); }}
                      placeholder={`Min. GH₵${cartTotal.toFixed(2)}`}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E2E8F0', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                    />
                    {parseFloat(amountTendered) >= cartTotal && (
                      <p style={{ color: '#16A34A', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.4rem' }}>
                        Change: GH₵{change.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'mobile_money' && (
                  <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}>
                    You'll complete this payment on your phone. Please have your mobile money PIN ready.
                  </div>
                )}

                {error && <p style={{ color: '#EF4444', fontSize: '0.82rem', fontWeight: 500 }}>{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || !paymentMethod}
                  style={{
                    background: !paymentMethod ? '#F1F5F9' : 'linear-gradient(135deg, #4F46E5, #818CF8)',
                    color: !paymentMethod ? '#94A3B8' : 'white',
                    border: 'none', borderRadius: 12, padding: '0.9rem',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem',
                    cursor: !paymentMethod ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {checkingOut ? 'Processing…' : <><CheckCircle size={18} /> Place Order · GH₵{cartTotal.toFixed(2)}</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════ ORDERS TAB ══════════ */}
        {tab === 'orders' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: 0 }}>My Orders</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>Your recent purchase history</p>
            </div>

            {myOrders.length === 0 ? (
              <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No orders yet</p>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Your completed purchases will appear here</p>
                <button onClick={() => setTab('shop')} style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '0.6rem 1.5rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myOrders.map(order => (
                  <div key={order.id} style={{ border: '1px solid #F1F5F9', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Order #{order.id.slice(-6)}</p>
                        <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          {new Date(order.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, fontSize: '1rem', color: '#4F46E5' }}>GH₵{order.total.toFixed(2)}</p>
                        <span style={{
                          display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 99,
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          background: order.paymentMethod === 'cash' ? '#F0FDF4' : '#EEF2FF',
                          color: order.paymentMethod === 'cash' ? '#16A34A' : '#4F46E5',
                        }}>
                          {order.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {order.items.map((item, i) => (
                        <span key={i} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: '#64748B' }}>
                          {item.qty}× {item.productName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Receipt Modal ── */}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)', padding: '2rem', textAlign: 'center', color: 'white' }}>
              <CheckCircle size={52} style={{ marginBottom: '0.75rem' }} />
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>Order Placed!</h2>
              <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.25rem' }}>Transaction #{receipt.id?.slice(-8)}</p>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {receipt.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748B' }}>
                  <span>{item.qty}× {item.productName}</span>
                  <span>GH₵{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#F1F5F9', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: '#4F46E5' }}>GH₵{receipt.total?.toFixed(2)}</span>
              </div>
              {receipt.paymentMethod === 'cash' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#16A34A', fontWeight: 600 }}>
                  <span>Change</span>
                  <span>GH₵{receipt.change?.toFixed(2)}</span>
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center', marginTop: '0.5rem' }}>
                {receipt.paymentMethod === 'mobile_money' ? 'Mobile money payment confirmed.' : 'Please collect your change from the cashier.'}
              </p>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setReceipt(null); setTab('orders'); }} style={{ flex: 1, padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', color: '#64748B' }}>
                View Orders
              </button>
              <button onClick={() => { setReceipt(null); setTab('shop'); }} style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #818CF8)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>
                Shop Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

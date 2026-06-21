import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, CheckCircle, Printer, Mail, Send } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useSocket } from '../contexts/SocketContext';
import PaymentModal from './PaymentModal';
import { generateReceiptPDF } from '../utils/pdfGenerator';

const OrderView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const socket = useSocket();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [openBill, setOpenBill] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  
  // Email Receipt State
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('userToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [catRes, prodRes, billRes] = await Promise.all([
          fetch('http://localhost:5000/api/categories', { headers }),
          fetch('http://localhost:5000/api/products', { headers }),
          fetch(`http://localhost:5000/api/payments/bill/${tableId}`)
        ]);
        
        if (catRes.ok && prodRes.ok) {
          const catData = await catRes.json();
          const prodData = await prodRes.json();
          
          setCategories(catData);
          setProducts(prodData);
          if (catData.length > 0) setActiveCat(catData[0]._id);
        }

        if (billRes.ok) {
          const billData = await billRes.json();
          setOpenBill(billData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => p.category === activeCat || p.category?._id === activeCat);

  // CFD Synchronization
  useEffect(() => {
    if (!socket) return;
    if (isPaymentOpen && openBill) {
      socket.emit('cfd_payment', openBill);
    } else {
      socket.emit('cfd_update', cart);
    }
  }, [cart, isPaymentOpen, openBill, socket]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item._id === product._id);
      if (exists) {
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const submitOrder = async () => {
    if (cart.length === 0) return;
    try {
      const token = sessionStorage.getItem('userToken');
      
      const orderPayload = {
        tableId,
        channel: 'Cashier',
        items: cart.map(item => ({
          product: item._id,
          quantity: item.qty,
          unitPrice: item.price,
          kdsAssigned: item.requiresKitchen !== undefined ? item.requiresKitchen : true
        }))
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        addNotification('Order sent to Kitchen successfully!', 'success');
        setCart([]); // Clear cart
        
        // Refresh the open bill so they can pay it immediately
        const billRes = await fetch(`http://localhost:5000/api/payments/bill/${tableId}`);
        if (billRes.ok) {
          const billData = await billRes.json();
          setOpenBill(billData);
        }
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleBill = async (paymentDetails) => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          paymentMethod: paymentDetails.method // e.g. 'Cashier' or 'Online' or 'Cash'
        })
      });

      if (response.ok) {
        if (socket) socket.emit('cfd_complete', openBill);
        addNotification('Bill settled successfully!', 'success');
        setPaymentSuccessData(openBill);
        setCustomerEmail('');
        setEmailSent(false);
        setPreviewUrl(null);
        setIsPaymentOpen(false);
      } else {
        alert('Failed to settle bill.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEmail = async () => {
    if (!customerEmail || !customerEmail.includes('@')) return;
    setIsSendingEmail(true);
    setPreviewUrl(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/payments/receipt/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          paymentData: paymentSuccessData
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEmailSent(true);
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
        addNotification(`Receipt sent to ${customerEmail}`, 'success');
      } else {
        alert(data.message || 'Failed to send receipt.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error while sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/floor')} className="glass-card" style={{ padding: '0.75rem', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0 }}>Add Items to Order</h2>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button 
              key={cat._id} 
              onClick={() => setActiveCat(cat._id)}
              className="glass-card"
              style={{ 
                padding: '0.75rem 1.5rem', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: activeCat === cat._id ? (cat.color || 'var(--accent-primary)') : 'var(--card-bg)',
                color: activeCat === cat._id ? 'var(--card-bg)' : 'var(--text-primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {filteredProducts.map(product => (
            <div 
              key={product._id} 
              className="glass-card" 
              onClick={() => addToCart(product)}
              style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{product.name}</h4>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.2rem' }}>₹{product.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ width: '420px', margin: '1.5rem 1.5rem 1.5rem 0', display: 'flex', flexDirection: 'column' }}>
        {openBill && openBill.orders && openBill.orders.length > 0 && (
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--highlight-blue)', borderBottom: '1px solid var(--border-blue)', borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a' }}>Open Tab</h3>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8' }}>₹{openBill.total.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#3b82f6' }}>{openBill.orders.length} unbilled orders</span>
            <button 
              className="pill-btn" 
              onClick={() => setIsPaymentOpen(true)}
              style={{ width: '100%', marginTop: '1rem', backgroundColor: '#3b82f6', color: 'var(--card-bg)' }}
            >
              Settle Full Bill
            </button>
          </div>
        )}

        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0 }}>New Order</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {cart.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>Cart is empty</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>₹{item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => updateQty(item._id, -1)} style={{ padding: '0.25rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: 'pointer' }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)} style={{ padding: '0.25rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: 'pointer' }}><Plus size={14} /></button>
                    <button onClick={() => removeItem(item._id)} style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-red)', marginLeft: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--sub-bg)', borderRadius: '0 0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Tax (10%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          
          <button className="pill-btn" onClick={submitOrder} disabled={cart.length === 0} style={{ width: '100%', padding: '1rem', opacity: cart.length === 0 ? 0.5 : 1 }}>
            Send to Kitchen
          </button>
        </div>
      </div>
      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        total={openBill ? openBill.total : 0} 
        prePromoTotal={openBill ? openBill.prePromoTotal : 0}
        automatedDiscount={openBill ? openBill.automatedDiscount : 0}
        appliedPromotion={openBill ? openBill.appliedPromotion : null}
        onComplete={(details) => handleSettleBill({ ...details, method: 'Cashier' })} 
      />

      {paymentSuccessData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-color)', borderRadius: '20px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--status-green)', marginBottom: '1.5rem' }}>
              <CheckCircle size={64} />
            </div>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>The bill of ₹{paymentSuccessData.total.toFixed(2)} has been settled.</p>
            
            <button 
              onClick={() => generateReceiptPDF(paymentSuccessData)}
              style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Printer size={20} /> Print Receipt (PDF)
            </button>

            {/* Email Receipt Section */}
            <div style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--sub-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {emailSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--status-green)', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Receipt Sent!
                  </div>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      (Test Mode: Click here to view sent email)
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Mail size={18} color="#9ca3af" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="email" 
                      placeholder="Customer Email" 
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                    />
                  </div>
                  <button 
                    onClick={handleSendEmail}
                    disabled={!customerEmail || isSendingEmail}
                    style={{ padding: '0 1rem', backgroundColor: isSendingEmail ? 'var(--text-secondary)' : '#18181b', color: 'var(--card-bg)', border: 'none', borderRadius: '8px', cursor: customerEmail ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                  >
                    {isSendingEmail ? 'Sending...' : <><Send size={16} /> Send</>}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/floor')}
              style={{ width: '100%', padding: '1rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--text-secondary)', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Return to Floor Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderView;

import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';

const CouponsManager = ({ embedded = false }) => {
  const { addNotification } = useNotification();
  const [coupons, setCoupons] = useState([]);

  // Form States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('http://localhost:5000/api/coupons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleSaveCoupon = async () => {
    if (!code.trim() || !discountValue) return;
    try {
      const res = await fetch('http://localhost:5000/api/coupons', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          discountValue: parseFloat(discountValue)
        })
      });

      if (res.ok) {
        addNotification('Coupon created!', 'success');
        setCode('');
        setDiscountValue('');
        setDiscountType('percent');
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(`Failed to save coupon: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/coupons/${id}`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Coupon status updated!', 'success');
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/coupons/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Coupon deleted!', 'success');
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={embedded ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%' } : { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {!embedded && (
        <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', margin: '1rem', borderRadius: '15px' }}>
          <Tag size={28} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Coupon Management</h2>
        </header>
      )}

      <main style={{ flex: 1, display: 'flex', gap: '2rem', padding: embedded ? '0' : '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: ADD COUPON */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Create New Coupon</h3>
            
            <input 
              type="text" 
              placeholder="Coupon Code (e.g. SUMMER10)" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', textTransform: 'uppercase' }}
            />
            
            <select 
              value={discountType} 
              onChange={e => setDiscountType(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
            
            <input 
              type="number" 
              placeholder={discountType === 'percent' ? "Discount %" : "Discount Amount (₹)"} 
              value={discountValue} 
              onChange={e => setDiscountValue(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            
            <button className="pill-btn" onClick={handleSaveCoupon} style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Plus size={16} /> Create Coupon
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: COUPONS LIST */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Active & Inactive Coupons</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {coupons.map(coupon => (
                <div key={coupon._id} style={{ padding: '1.5rem', borderRadius: '15px', backgroundColor: 'white', border: '1px solid #e5e7eb', position: 'relative', opacity: coupon.isActive ? 1 : 0.6 }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => toggleStatus(coupon._id)} style={{ background: 'none', border: 'none', color: coupon.isActive ? 'var(--status-orange)' : 'var(--status-green)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(coupon._id)} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: 'var(--accent-primary)', letterSpacing: '1px' }}>{coupon.code}</h4>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: coupon.isActive ? 'var(--status-green)' : 'var(--text-secondary)' }}>
                    {coupon.isActive ? '● Active' : '○ Inactive'}
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No coupons created yet.</p>}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CouponsManager;

import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Trash2, Tag, Zap } from 'lucide-react';

const PromotionsManager = ({ embedded = false }) => {
  const { addNotification } = useNotification();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);

  // Form States
  const [name, setName] = useState('');
  const [type, setType] = useState('Order'); // 'Order' or 'Product'
  const [targetProduct, setTargetProduct] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');

  const fetchPromotions = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const res = await fetch(API_URL + '/api/promotions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const res = await fetch(API_URL + '/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) setTargetProduct(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const getHeaders = () => {
    const token = sessionStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleSavePromotion = async () => {
    if (!name.trim() || !discountValue) return;
    if (type === 'Order' && !minOrderAmount) return;
    if (type === 'Product' && (!minQuantity || !targetProduct)) return;

    try {
      const res = await fetch(API_URL + '/api/promotions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          type,
          targetProduct: type === 'Product' ? targetProduct : undefined,
          minQuantity: type === 'Product' ? parseInt(minQuantity) : undefined,
          minOrderAmount: type === 'Order' ? parseFloat(minOrderAmount) : undefined,
          discountType,
          discountValue: parseFloat(discountValue)
        })
      });

      if (res.ok) {
        addNotification('Promotion created!', 'success');
        setName('');
        setMinQuantity('');
        setMinOrderAmount('');
        setDiscountValue('');
        fetchPromotions();
      } else {
        const data = await res.json();
        alert(`Failed to save promotion: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/promotions/${id}`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Promotion status updated!', 'success');
        fetchPromotions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promotion?")) return;
    try {
      const res = await fetch(`${API_URL}/api/promotions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Promotion deleted!', 'success');
        fetchPromotions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={embedded ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%' } : { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {!embedded && (
        <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', margin: '1rem', borderRadius: '15px' }}>
          <Zap size={28} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Automated Promotions</h2>
        </header>
      )}

      <main style={{ flex: 1, display: 'flex', gap: '2rem', padding: embedded ? '0' : '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: ADD PROMOTION */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Create New Trigger</h3>
            
            <input 
              type="text" 
              placeholder="Promotion Name (e.g. Weekend Special)" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
            >
              <option value="Order">Order Level (Min Cart Total)</option>
              <option value="Product">Product Level (Min Item Qty)</option>
            </select>

            {type === 'Order' ? (
              <input 
                type="number" 
                placeholder="Minimum Order Amount (₹)" 
                value={minOrderAmount} 
                onChange={e => setMinOrderAmount(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            ) : (
              <>
                <select 
                  value={targetProduct} 
                  onChange={e => setTargetProduct(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                >
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Minimum Quantity to Trigger" 
                  value={minQuantity} 
                  onChange={e => setMinQuantity(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </>
            )}
            
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Discount Details</h4>

            <select 
              value={discountType} 
              onChange={e => setDiscountType(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
            >
              <option value="percent">Percentage OFF (%)</option>
              <option value="flat">Flat Amount OFF (₹)</option>
            </select>
            
            <input 
              type="number" 
              placeholder={discountType === 'percent' ? "Discount %" : "Discount Amount (₹)"} 
              value={discountValue} 
              onChange={e => setDiscountValue(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            
            <button className="pill-btn" onClick={handleSavePromotion} style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Plus size={16} /> Save Trigger
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PROMOTIONS LIST */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Active & Inactive Triggers</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {promotions.map(promo => (
                <div key={promo._id} style={{ padding: '1.5rem', borderRadius: '15px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', position: 'relative', opacity: promo.isActive ? 1 : 0.6 }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => toggleStatus(promo._id)} style={{ background: 'none', border: 'none', color: promo.isActive ? 'var(--status-orange)' : 'var(--status-green)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(promo._id)} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--accent-primary)', paddingRight: '80px' }}>{promo.name}</h4>
                  
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    {promo.type === 'Order' ? (
                      <span><strong>Trigger:</strong> Order crosses ₹{promo.minOrderAmount}</span>
                    ) : (
                      <span><strong>Trigger:</strong> {promo.minQuantity}x {promo.targetProduct?.name}</span>
                    )}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--status-green)' }}>
                    Gets {promo.discountType === 'percent' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: promo.isActive ? 'var(--status-green)' : 'var(--text-secondary)' }}>
                    {promo.isActive ? '● Active' : '○ Inactive'}
                  </div>
                </div>
              ))}
              {promotions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No automated promotions created yet.</p>}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default PromotionsManager;

import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Edit2, Trash2, Save, X, Utensils } from 'lucide-react';

const MenuManager = () => {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCatId, setActiveCatId] = useState('');

  // Form States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [prodForm, setProdForm] = useState({ name: '', price: '', unit: 'per piece', tax: '', description: '', cookingTime: '', kdsAssigned: true });

  const fetchMenu = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(API_URL + '/api/categories'),
        fetch(API_URL + '/api/products')
      ]);
      
      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData);
        setProducts(prodData);
        if (catData.length > 0 && !activeCatId) {
          setActiveCatId(catData[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const getHeaders = () => {
    const token = sessionStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // --- Category CRUD ---
  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `${API_URL}/api/categories/${editingCategory._id}` 
        : API_URL + '/api/categories';
      
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ name: catName, color: catColor })
      });

      if (res.ok) {
        addNotification(`Category ${editingCategory ? 'updated' : 'created'}!`, 'success');
        setEditingCategory(null);
        setCatName('');
        fetchMenu();
      } else {
        alert('Failed to save category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure? This will not delete products automatically, they will be orphaned.")) return;
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Category deleted!', 'success');
        if (activeCatId === id) setActiveCatId('');
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCategoryEdit = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color || '#6366f1');
  };

  const cancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setCatColor('#6366f1');
  };

  // --- Product CRUD ---
  const handleSaveProduct = async () => {
    if (!prodForm.name.trim() || !prodForm.price || !activeCatId) return;
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct 
        ? `${API_URL}/api/products/${editingProduct._id}` 
        : API_URL + '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          name: prodForm.name,
          price: parseFloat(prodForm.price),
          unit: prodForm.unit,
          tax: parseFloat(prodForm.tax) || 0,
          description: prodForm.description,
          cookingTime: parseInt(prodForm.cookingTime) || 0,
          category: activeCatId,
          kdsAssigned: prodForm.kdsAssigned
        })
      });

      if (res.ok) {
        addNotification(`Product ${editingProduct ? 'updated' : 'created'}!`, 'success');
        setEditingProduct(null);
        setProdForm({ name: '', price: '', unit: 'per piece', tax: '', description: '', cookingTime: '', kdsAssigned: true });
        fetchMenu();
      } else {
        alert('Failed to save product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Product deleted!', 'success');
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openProductEdit = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      price: prod.price,
      unit: prod.unit || 'per piece',
      tax: prod.tax || '',
      description: prod.description || '',
      cookingTime: prod.cookingTime || '',
      kdsAssigned: prod.kdsAssigned !== undefined ? prod.kdsAssigned : true
    });
  };

  const cancelProductEdit = () => {
    setEditingProduct(null);
    setProdForm({ name: '', price: '', unit: 'per piece', tax: '', description: '', cookingTime: '', kdsAssigned: true });
  };

  const currentCategoryProducts = products.filter(p => p.category === activeCatId || p.category?._id === activeCatId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', margin: '1rem', borderRadius: '15px' }}>
        <Utensils size={28} color="var(--accent-primary)" />
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Menu Management</h2>
      </header>

      <main style={{ flex: 1, display: 'flex', gap: '2rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: CATEGORIES */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <input 
              type="text" 
              placeholder="Category Name" 
              value={catName} 
              onChange={e => setCatName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Color Theme:</label>
              <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ border: 'none', background: 'none', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="pill-btn" onClick={handleSaveCategory} style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={16} /> Save
              </button>
              {editingCategory && (
                <button onClick={cancelCategoryEdit} style={{ padding: '0.75rem', borderRadius: '50px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: 'pointer' }}><X size={16} /></button>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>All Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map(cat => (
                <div 
                  key={cat._id}
                  onClick={() => setActiveCatId(cat._id)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '10px', 
                    cursor: 'pointer',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: activeCatId === cat._id ? (cat.color || 'var(--accent-primary)') : 'var(--card-bg)',
                    color: activeCatId === cat._id ? 'var(--card-bg)' : 'var(--text-primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); openCategoryEdit(cat); }} style={{ background: 'none', border: 'none', color: activeCatId === cat._id ? 'var(--card-bg)' : 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id); }} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCTS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              {editingProduct && (
                <button onClick={cancelProductEdit} style={{ padding: '0.5rem', borderRadius: '50px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input 
                type="text" placeholder="Product Name" 
                value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="number" placeholder="Price (₹)" 
                  value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1 }}
                />
                <select 
                  value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1, backgroundColor: 'var(--card-bg)' }}
                >
                  <option value="per piece">per piece</option>
                  <option value="per kg">per kg</option>
                  <option value="per litre">per litre</option>
                  <option value="per portion">per portion</option>
                </select>
              </div>
              <input 
                type="number" placeholder="Tax (%)" 
                value={prodForm.tax} onChange={e => setProdForm({...prodForm, tax: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <input 
                type="number" placeholder="Cooking Time (mins)" 
                value={prodForm.cookingTime} onChange={e => setProdForm({...prodForm, cookingTime: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <input 
                type="text" placeholder="Description" 
                value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={prodForm.kdsAssigned} onChange={e => setProdForm({...prodForm, kdsAssigned: e.target.checked})} />
                Requires Kitchen (KDS)
              </label>
              <button className="pill-btn" onClick={handleSaveProduct} disabled={!activeCatId} style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Products in {categories.find(c => c._id === activeCatId)?.name || 'Category'}</h3>
            
            {activeCatId ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {currentCategoryProducts.map(product => (
                  <div key={product._id} style={{ padding: '1.5rem', borderRadius: '15px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openProductEdit(product)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteProduct(product._id)} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', paddingRight: '2rem' }}>{product.name}</h4>
                    {product.description && <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{product.description}</p>}
                    
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      ₹{Number(product.price || 0).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ {product.unit || 'per piece'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <span>Tax: {product.tax || 0}%</span>
                      <span>⏱️ {product.cookingTime || 0} mins</span>
                    </div>
                    
                    <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: product.kdsAssigned ? 'var(--status-orange)' : 'var(--text-secondary)' }}>
                      {product.kdsAssigned ? '👨‍🍳 Sent to Kitchen' : '✅ Ready to Serve'}
                    </div>
                  </div>
                ))}
                {currentCategoryProducts.length === 0 && <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No products in this category yet.</p>}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Please select a category first.</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default MenuManager;

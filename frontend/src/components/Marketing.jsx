import React, { useState } from 'react';
import { Tag, Zap } from 'lucide-react';
import CouponsManager from './CouponsManager';
import PromotionsManager from './PromotionsManager';

const Marketing = () => {
  const [activeTab, setActiveTab] = useState('coupons');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', margin: '1rem', borderRadius: '15px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('coupons')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'coupons' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '1.5rem', fontWeight: activeTab === 'coupons' ? 'bold' : 'normal',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Tag size={28} /> Coupons
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>|</span>
          <button 
            onClick={() => setActiveTab('promotions')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'promotions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '1.5rem', fontWeight: activeTab === 'promotions' ? 'bold' : 'normal',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Zap size={28} /> Promotions
          </button>
        </h2>
      </header>
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'coupons' ? <CouponsManager embedded={true} /> : <PromotionsManager embedded={true} />}
      </div>
    </div>
  );
};

export default Marketing;

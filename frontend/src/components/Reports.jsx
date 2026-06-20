import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, Calendar, ShoppingBag } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Analytics Data State
  const [dateWiseData, setDateWiseData] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});

  const fetchAnalytics = async () => {
    setIsGenerating(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('userToken');
      let url = `http://localhost:5000/api/analytics/reports?type=${reportType}`;
      
      if (reportType === 'custom') {
        if (!startDate || !endDate) {
          setIsGenerating(false);
          return;
        }
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const data = await response.json();
      setDateWiseData(data.dateWiseData || []);
      setExpandedDates({});
      
      if (!data.dateWiseData || data.dateWiseData.length === 0) {
        if (reportType !== 'custom') setMessage('No data found for this period.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error fetching analytics.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (reportType !== 'custom') {
      fetchAnalytics();
    }
  }, [reportType]);

  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  const downloadCSV = () => {
    if (dateWiseData.length === 0) {
      setMessage('No data to download.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Time', 'Table', 'Channel', 'Total Amount (₹)', 'Items'];
    const rows = [];
    
    dateWiseData.forEach(day => {
      day.orders.forEach(order => {
        const date = new Date(order.updatedAt).toLocaleDateString();
        const time = new Date(order.updatedAt).toLocaleTimeString();
        const table = order.table ? `T${order.table.tableNumber}` : 'N/A';
        const itemsString = order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Unknown'}`).join(' | ') || 'No Items';
        
        rows.push([
          order._id,
          date,
          time,
          table,
          order.channel,
          order.total.toFixed(2),
          `"${itemsString}"`
        ].join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${reportType}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const totalOrders = dateWiseData.reduce((sum, day) => sum + day.totalOrders, 0);
    setMessage(`Successfully downloaded ${totalOrders} orders.`);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Sales Reports</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>View your daily sales history and order details.</p>
        </div>
        <button 
          onClick={downloadCSV}
          disabled={dateWiseData.length === 0}
          className="pill-btn" 
          style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: dateWiseData.length === 0 ? 0.5 : 1 }}
        >
          <Download size={20} />
          Export CSV
        </button>
      </header>

      {/* Control Panel */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '10px' }}>
          {['daily', 'weekly', 'custom'].map(type => (
            <button 
              key={type}
              onClick={() => setReportType(type)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: reportType === type ? 'white' : 'transparent',
                color: reportType === type ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 600, boxShadow: reportType === type ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {reportType === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            <button className="pill-btn" onClick={fetchAnalytics} style={{ padding: '0.75rem 1.5rem', height: 'fit-content' }}>
              Apply
            </button>
          </div>
        )}
        
        {message && <span style={{ color: message.includes('Success') ? 'var(--status-green)' : 'var(--status-red)', fontWeight: 500 }}>{message}</span>}
      </div>

      {isGenerating ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading Reports...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dateWiseData.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No completed orders found for the selected time period.
            </div>
          ) : (
            dateWiseData.map(day => (
              <div key={day.date} className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Date Row Header */}
                <div 
                  onClick={() => toggleDate(day.date)}
                  style={{ 
                    padding: '1.5rem 2rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: expandedDates[day.date] ? '#f8fafc' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '10px' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{day.date}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <ShoppingBag size={14} /> {day.totalOrders} Orders
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Revenue</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-green)' }}>
                        ₹{day.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {expandedDates[day.date] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedDates[day.date] && (
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600 }}>Time</th>
                          <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600 }}>Order No.</th>
                          <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600 }}>Table / Channel</th>
                          <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600 }}>Items</th>
                          <th style={{ padding: '1rem 2rem', textAlign: 'right', fontWeight: 600 }}>Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.orders.map(order => (
                          <tr key={order._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '1rem 2rem', color: 'var(--text-secondary)' }}>
                              {new Date(order.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td style={{ padding: '1rem 2rem', fontWeight: 500, color: 'var(--accent-primary)' }}>
                              {order.orderNumber}
                            </td>
                            <td style={{ padding: '1rem 2rem' }}>
                              <div style={{ fontWeight: 600 }}>{order.table ? `Table ${order.table.tableNumber}` : 'N/A'}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.channel}</div>
                            </td>
                            <td style={{ padding: '1rem 2rem', maxWidth: '300px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {order.items?.map(item => (
                                  <div key={item._id} style={{ fontSize: '0.9rem' }}>
                                    <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{item.quantity}x</span>
                                    {item.product?.name || 'Unknown Item'}
                                  </div>
                                ))}
                                {(!order.items || order.items.length === 0) && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No Items Recorded</span>}
                              </div>
                            </td>
                            <td style={{ padding: '1rem 2rem', textAlign: 'right', fontWeight: 700 }}>
                              ₹{order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

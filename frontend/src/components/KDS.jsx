import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KDS = () => {
  const socket = useSocket();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();
  const currentRole = sessionStorage.getItem('userRole');

  // Update current time every minute to refresh wait times dynamically
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    navigate('/login');
  };

  const fetchTickets = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch(API_URL + '/api/kds/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    if (!socket) return;

    const handleUpdate = (data) => {
      if (data && data.orderNumber) addNotification(`Kitchen Update: ${data.orderNumber}`, 'warning');
      fetchTickets();
    };

    socket.on('new_kitchen_ticket', handleUpdate);
    socket.on('kds_refresh_needed', handleUpdate);

    return () => {
      socket.off('new_kitchen_ticket', handleUpdate);
      socket.off('kds_refresh_needed', handleUpdate);
    };
  }, [socket, addNotification]);

  const advanceOrder = async (id, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'Pending') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else return;

    try {
      const token = sessionStorage.getItem('userToken');
      await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (nextStatus === 'Ready') {
        addNotification('Order marked as Ready for Delivery!', 'success');
      }
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleItemStatus = async (e, itemId, currentStatus) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'Completed' ? 'Preparing' : 'Completed';
    try {
      const token = sessionStorage.getItem('userToken');
      await fetch(`${API_URL}/api/kds/item/${itemId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ kdsStatus: nextStatus })
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (minutes) => {
    if (minutes >= 8) return '#ef4444'; // Red
    if (minutes >= 5) return '#f97316'; // Orange
    if (minutes >= 3) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  const getPriorityEmoji = (minutes) => {
    if (minutes >= 8) return '🔴';
    if (minutes >= 5) return '🟠';
    if (minutes >= 3) return '🟡';
    return '🟢';
  };

  // Recalculate minutes waiting based on order createdAt and currentTime
  const processedOrders = [...orders]
    .map(order => {
      const waitMs = currentTime - new Date(order.createdAt).getTime();
      const minutesWaiting = Math.floor(waitMs / 60000);
      return { ...order, calculatedWaitTime: Math.max(0, minutesWaiting) };
    })
    .sort((a, b) => b.calculatedWaitTime - a.calculatedWaitTime)
    .map((order, index) => ({
      ...order,
      priority: index + 1
    }));

  const Column = ({ title, status, columnColor }) => {
    const columnOrders = processedOrders.filter(o => o.status === status);
    
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--column-bg)', borderRadius: '15px' }}>
        <h2 style={{ padding: '1rem', borderBottom: `3px solid ${columnColor}`, marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
          {columnOrders.map(order => {
            const color = getPriorityColor(order.calculatedWaitTime);
            const emoji = getPriorityEmoji(order.calculatedWaitTime);
            
            return (
              <div key={order._id} onClick={() => advanceOrder(order._id, status)} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: `6px solid ${color}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: color, textTransform: 'uppercase' }}>
                      {emoji} PRIORITY #{order.priority}
                    </span>
                    <span style={{ backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.9rem', fontWeight: 600 }}>Tbl {order.table?.tableNumber || 'QR'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.4rem' }}>{order.orderNumber}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1.2rem', fontWeight: 700, color: color }}>
                      <Clock size={18} /> {order.calculatedWaitTime} mins
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 500 }}>
                    {order.items && order.items.map(item => (
                      <li 
                        key={item._id}
                        onClick={(e) => toggleItemStatus(e, item._id, item.kdsStatus)}
                        style={{ 
                          textDecoration: item.kdsStatus === 'Completed' ? 'line-through' : 'none',
                          color: item.kdsStatus === 'Completed' ? 'var(--text-secondary)' : 'inherit',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {item.quantity}x {item.product?.name}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', backgroundColor: 'var(--bg-color)' }}>{order.channel}</span>
                  {order.maxCookingTime > 0 && (
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ⏱️ Est. {order.maxCookingTime} mins
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ padding: '1rem 2rem', margin: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, color: 'var(--accent-primary)' }}>Kitchen Display System</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Sorting by: Dynamic Priority Matrix</span>
          {currentRole !== 'Admin' && (
            <button onClick={handleLogout} className="pill-btn" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--card-bg)', color: 'var(--status-red)', border: '1px solid var(--status-red)' }}>
              <LogOut size={16} style={{ marginRight: '5px' }} /> Logout
            </button>
          )}
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1, gap: '1rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        <Column title="Pending (Tap to Prepare)" status="Pending" columnColor="var(--status-red)" />
        <Column title="Preparing (Tap to Ready)" status="Preparing" columnColor="var(--status-orange)" />
      </div>
    </div>
  );
};

export default KDS;

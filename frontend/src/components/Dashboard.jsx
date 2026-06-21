import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { DollarSign, Activity, Users, Coffee, Plus, Trash2, ShieldAlert, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalTables: 10,
    activeOrders: 0,
    revenueToday: 0,
    completedOrdersToday: 0,
    salesData: [],
    popularItems: []
  });



  const fetchAnalytics = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    if (!socket) return;

    const handleUpdate = () => fetchAnalytics();

    socket.on('order_created', handleUpdate);
    socket.on('analytics_updated', handleUpdate);
    socket.on('table_state_changed', handleUpdate);
    socket.on('kitchen_ready', handleUpdate);
    socket.on('order_served', handleUpdate);

    return () => {
      socket.off('order_created', handleUpdate);
      socket.off('analytics_updated', handleUpdate);
      socket.off('table_state_changed', handleUpdate);
      socket.off('kitchen_ready', handleUpdate);
      socket.off('order_served', handleUpdate);
    };
  }, [socket]);



  const MetricCard = ({ title, value, icon, color }) => (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `6px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>{title}</h3>
        <div style={{ padding: '0.5rem', backgroundColor: `${color}15`, borderRadius: '10px', color: color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '2rem', overflowY: 'auto' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Command Center</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Live Operational Dashboard • Auto-syncing via WebSockets</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <MetricCard 
          title="Revenue Today" 
          value={`₹${metrics.revenueToday.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
          icon={<DollarSign size={24} />} 
          color="var(--status-green)" 
        />
        <MetricCard 
          title="Active Orders" 
          value={metrics.activeOrders} 
          icon={<Activity size={24} />} 
          color="var(--accent-primary)" 
        />
        <MetricCard 
          title="Completed Orders Today" 
          value={metrics.completedOrdersToday} 
          icon={<Coffee size={24} />} 
          color="var(--status-orange)" 
        />
        <MetricCard 
          title="Total Tables" 
          value={metrics.totalTables} 
          icon={<Users size={24} />} 
          color="var(--status-red)" 
        />
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Sales Area Chart */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Sales Revenue (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 300 }}>
            {metrics.salesData && metrics.salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Popular Items Pie Chart */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Popular Items</h3>
          <div style={{ width: '100%', height: 220, position: 'relative' }}>
            {metrics.popularItems && metrics.popularItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.popularItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.popularItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading chart data...</div>
            )}
          </div>
            
          {/* Custom Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem', padding: '0 1rem' }}>
              {metrics.popularItems?.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>


    </div>
  );
};

export default Dashboard;

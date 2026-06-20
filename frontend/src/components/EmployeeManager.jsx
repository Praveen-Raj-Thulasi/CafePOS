import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, UserX, Key, Users } from 'lucide-react';

const EmployeeManager = () => {
  const { addNotification } = useNotification();
  const [employees, setEmployees] = useState([]);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cashier');

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleCreateEmployee = async () => {
    if (!name.trim() || !email.trim() || !password) return;
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password, role })
      });

      if (res.ok) {
        addNotification('Employee created!', 'success');
        setName('');
        setEmail('');
        setPassword('');
        setRole('Cashier');
        fetchEmployees();
      } else {
        const data = await res.json();
        alert(`Failed to create employee: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this employee? They will no longer be able to log in.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}/archive`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        addNotification('Employee archived!', 'success');
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (id) => {
    const newPassword = window.prompt("Enter new password for this employee:");
    if (!newPassword) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        addNotification('Password updated!', 'success');
      } else {
        alert('Failed to update password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', margin: '1rem', borderRadius: '15px' }}>
        <Users size={28} color="var(--accent-primary)" />
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Employee Management</h2>
      </header>

      <main style={{ flex: 1, display: 'flex', gap: '2rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: ADD EMPLOYEE */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Add New Employee</h3>
            
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />

            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />

            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
            >
              <option value="Admin">Admin</option>
              <option value="Cashier">Cashier</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Servant">Servant</option>
            </select>
            
            <button className="pill-btn" onClick={handleCreateEmployee} style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <Plus size={16} /> Create Employee
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: EMPLOYEE LIST */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Active Employees</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {employees.map(emp => (
                <div key={emp._id} style={{ padding: '1.5rem', borderRadius: '15px', backgroundColor: 'white', border: '1px solid #e5e7eb', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleChangePassword(emp._id)} title="Change Password" style={{ background: 'none', border: 'none', color: 'var(--status-blue)', cursor: 'pointer' }}><Key size={16} /></button>
                    <button onClick={() => handleArchive(emp._id)} title="Archive Employee" style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}><UserX size={16} /></button>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--accent-primary)', paddingRight: '50px' }}>{emp.name}</h4>
                  
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#4b5563' }}>
                    <strong>Email:</strong> {emp.email}
                  </div>

                  <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#4b5563' }}>
                    <strong>Role:</strong> <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: '#e5e7eb', fontSize: '0.8rem', fontWeight: 600 }}>{emp.role}</span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--status-green)' }}>
                    ● Active
                  </div>
                </div>
              ))}
              {employees.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active employees found.</p>}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default EmployeeManager;

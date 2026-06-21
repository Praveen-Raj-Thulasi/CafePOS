import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import FloorPlan from './components/FloorPlan';
import OrderView from './components/OrderView';
import KDS from './components/KDS';
import ServantPortal from './components/ServantPortal';
import CustomerMenu from './components/CustomerMenu';
import CustomerDisplay from './components/CustomerDisplay';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SharedLayout from './components/SharedLayout';
import Register from './components/Register';
import Reports from './components/Reports';
import QRGenerator from './components/QRGenerator';
import MenuManager from './components/MenuManager';
import Marketing from './components/Marketing';
import EmployeeManager from './components/EmployeeManager';
import ThemeToggle from './components/ThemeToggle';

function App() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.glass-card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <SocketProvider>
      <NotificationProvider>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
            <ThemeToggle />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Public Routes for Customers & Printing */}
              <Route path="/customer-display" element={<CustomerDisplay />} />
              <Route path="/qr/:tableId" element={<QRGenerator />} />
              <Route path="/menu/:tableId" element={<CustomerMenu />} />

              {/* Protected Routes inside SharedLayout */}
              <Route element={<SharedLayout />}>
                
                {/* Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/menu-manager" element={<MenuManager />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/employees" element={<EmployeeManager />} />
                </Route>

                {/* Admin + Cashier */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Cashier']} />}>
                  <Route path="/floor" element={<FloorPlan />} />
                  <Route path="/order/:tableId" element={<OrderView />} />
                </Route>

                {/* Admin + Kitchen */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Kitchen']} />}>
                  <Route path="/kds" element={<KDS />} />
                </Route>

                {/* Admin + Servant */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Servant']} />}>
                  <Route path="/servant" element={<ServantPortal />} />
                </Route>

              </Route>

              {/* Catch All Redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;

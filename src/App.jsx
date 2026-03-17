import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, seedFirestore } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login          from './pages/Login';
import Signup         from './pages/Signup';
import Dashboard      from './pages/Dashboard';
import POS            from './pages/POS';
import Inventory      from './pages/Inventory';
import Products       from './pages/Products';
import Suppliers      from './pages/Suppliers';
import Analytics      from './pages/Analytics';
import Reports        from './pages/Reports';
import Staff          from './pages/Staff';
import CustomerPortal from './pages/CustomerPortal';

seedFirestore();

function AppShell() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute allowedRoles={['owner','cashier','manager']}><POS /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['owner','inventory','manager']}><Inventory /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute allowedRoles={['owner','inventory']}><Products /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['owner']}><Suppliers /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['owner','manager']}><Analytics /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['owner']}><Reports /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['owner']}><Staff /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/store"  element={<ProtectedRoute allowedRoles={['customer']}><CustomerPortal /></ProtectedRoute>} />
          <Route path="/*"      element={<AppShell />} />
        </Routes>
      </AppProvider>
    </Router>
  );
}

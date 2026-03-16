import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, seedFirestore } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import POS        from './pages/POS';
import Inventory  from './pages/Inventory';
import Products   from './pages/Products';
import Suppliers  from './pages/Suppliers';
import Analytics  from './pages/Analytics';
import Reports    from './pages/Reports';

// Seed Firestore on first load
seedFirestore();

function AppShell() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <Routes>
          {/* All authenticated users */}
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['owner','cashier']}><POS /></ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['owner','inventory']}><Inventory /></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['owner','inventory']}><Products /></ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute allowedRoles={['owner']}><Suppliers /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['owner']}><Analytics /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['owner']}><Reports /></ProtectedRoute>
          } />

          {/* 404 catch-all → home */}
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
          {/* Login sits outside the shell (no sidebar/header) */}
          <Route path="/login" element={<Login />} />
          {/* Everything else goes through the shell */}
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AppProvider>
    </Router>
  );
}
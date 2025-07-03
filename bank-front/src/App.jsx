import './App.css'
import Header from './components/Header'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import StatementPage from './pages/gorgia/StatementPage'
import ContragentsPage from './pages/gorgia/ContragentsPage'
import UsersPage from './pages/gorgia/UsersPage'
import AntaStatementPage from './pages/anta/StatementPage'
import AntaContragentsPage from './pages/anta/ContragentsPage'
import AntaUsersPage from './pages/anta/UsersPage'
import Login from './pages/Login';
import { useEffect, useState } from 'react'
import defaultInstance from './api/defaultInstance'

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';

// Import i18n
import './assets/i18n/translation';

library.add(faTrash, faUserPen);


function ProtectedRoute({ children, bank }) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    defaultInstance.get('/user')
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'super_admin' && bank && user.bank !== bank) {
    return <Navigate to={`/${user.bank}/statement`} replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-container">
      {!isLoginPage && <Header />}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protect all other routes */}
          <Route path="/gorgia/statement" element={
            <ProtectedRoute bank="gorgia"><StatementPage /></ProtectedRoute>
          } />
          <Route path="/gorgia/contragents" element={
            <ProtectedRoute bank="gorgia"><ContragentsPage /></ProtectedRoute>
          } />
          <Route path="/gorgia/users" element={
            <ProtectedRoute bank="gorgia"><UsersPage /></ProtectedRoute>
          } />
          <Route path="/anta/statement" element={
            <ProtectedRoute bank="anta"><AntaStatementPage /></ProtectedRoute>
          } />
          <Route path="/anta/contragents" element={
            <ProtectedRoute bank="anta"><AntaContragentsPage /></ProtectedRoute>
          } />
          <Route path="/anta/users" element={
            <ProtectedRoute bank="anta"><AntaUsersPage /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router basename="/">
      <AppContent />
    </Router>
  )
}

export default App

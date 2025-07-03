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
import useCurrentUser from './hooks/useCurrentUser';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';

// Import i18n
import './assets/i18n/translation';

library.add(faTrash, faUserPen);


function ProtectedRoute({ children, bank, requireAdmin }) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const user = useCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!user) {
    return null;
  }
  if (user.role !== 'super_admin' && bank && user.bank !== bank) {
    return <Navigate to={`/${user.bank}/statement`} replace />;
  }
  if (requireAdmin && !(user.role === 'super_admin' || user.role === 'admin')) {
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
            <ProtectedRoute bank="gorgia" requireAdmin={true}><UsersPage /></ProtectedRoute>
          } />
          <Route path="/anta/statement" element={
            <ProtectedRoute bank="anta"><AntaStatementPage /></ProtectedRoute>
          } />
          <Route path="/anta/contragents" element={
            <ProtectedRoute bank="anta"><AntaContragentsPage /></ProtectedRoute>
          } />
          <Route path="/anta/users" element={
            <ProtectedRoute bank="anta" requireAdmin={true}><AntaUsersPage /></ProtectedRoute>
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

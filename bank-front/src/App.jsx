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

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';

// Import i18n
import './assets/i18n/translation';

library.add(faTrash, faUserPen);


function ProtectedRoute({ children, bank }) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const userRole = localStorage.getItem('role');
  const userBank = localStorage.getItem('bank');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Only super_admin can access both banks, others only their assigned bank
  if (userRole !== 'super_admin' && bank && userBank !== bank) {
    // Redirect to their assigned bank's dashboard
    return <Navigate to={`/${userBank}/statement`} replace />;
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

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

library.add(faTrash, faUserPen);


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
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
          <Route path="/gorgia/statement" element={<ProtectedRoute><StatementPage /></ProtectedRoute>} />
          <Route path="/gorgia/contragents" element={<ProtectedRoute><ContragentsPage /></ProtectedRoute>} />
          <Route path="/gorgia/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/anta/statement" element={<ProtectedRoute><AntaStatementPage /></ProtectedRoute>} />
          <Route path="/anta/contragents" element={<ProtectedRoute><AntaContragentsPage /></ProtectedRoute>} />
          <Route path="/anta/users" element={<ProtectedRoute><AntaUsersPage /></ProtectedRoute>} />
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

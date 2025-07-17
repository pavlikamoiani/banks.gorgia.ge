import React from 'react';
import './App.css'
import Header from './components/Header'
import Dashboard from './components/Dashboard';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import StatementPage from './pages/gorgia/StatementPage'
import ContragentsPage from './pages/gorgia/ContragentsPage'
import UsersPage from './pages/gorgia/UsersPage'
import AntaStatementPage from './pages/anta/StatementPage'
import AntaContragentsPage from './pages/anta/ContragentsPage'
import AntaUsersPage from './pages/anta/UsersPage'
import Login from './pages/Login';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from './store/userSlice';
import defaultInstance from './api/defaultInstance';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';

import './assets/i18n/translation';

library.add(faTrash, faUserPen);

function ProtectedRoute({ children, bank, requireAdmin }) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const user = useSelector(state => state.user.user);

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
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);
  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token && !user && !fetchedRef.current) {
      fetchedRef.current = true;
      defaultInstance.get('/user')
        .then(res => {
          dispatch(setUser(res.data));
        })
        .catch(() => {
          dispatch(setUser(null));
        });
    }
  }, [dispatch, user]);

  return (
    <div className="app-container">
      {!isLoginPage && <Header />}
      <div className="main-content">
        <Routes>
          {/* <Route path="/" element={<Dashboard />} /> */}
          <Route path='/' element={<Navigate to="/gorgia/statement" replace />} />
          <Route path="/login" element={<Login />} />
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

import { Provider } from 'react-redux';
import store from './store';

function App() {
  return (
    <Provider store={store}>
      <Router basename="/">
        <AppContent />
      </Router>
    </Provider>
  )
}

export default App;

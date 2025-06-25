import './App.css'
import Header from './components/Header'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import StatementPage from './pages/gorgia/StatementPage'
import ContragentsPage from './pages/gorgia/ContragentsPage'
import UsersPage from './pages/gorgia/UsersPage'
import AntaStatementPage from './pages/anta/StatementPage'
import AntaContragentsPage from './pages/anta/ContragentsPage'
import AntaUsersPage from './pages/anta/UsersPage'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="main-content">
          <Routes>
            {/* <Route path="/" element={<Navigate to="/statement" replace />} /> */}
            <Route path="/gorgia/statement" element={<StatementPage />} />
            <Route path="/gorgia/contragents" element={<ContragentsPage />} />
            <Route path="/gorgia/users" element={<UsersPage />} />
            {/* Anta routes */}
            <Route path="/anta/statement" element={<AntaStatementPage />} />
            <Route path="/anta/contragents" element={<AntaContragentsPage />} />
            <Route path="/anta/users" element={<AntaUsersPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

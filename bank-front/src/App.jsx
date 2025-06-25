import './App.css'
import Header from './components/Header'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import StatementPage from './pages/gorgia/StatementPage'
import ContragentsPage from './pages/gorgia/ContragentsPage'
import UsersPage from './pages/gorgia/UsersPage'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/statement" replace />} />
            <Route path="/statement" element={<StatementPage />} />
            <Route path="/contragents" element={<ContragentsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

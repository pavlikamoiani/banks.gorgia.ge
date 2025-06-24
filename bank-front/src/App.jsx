import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TableAccounts from './components/TableAccounts'

function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <TableAccounts />
      </div>
    </div>
  )
}

export default App

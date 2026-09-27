import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export const MainLayout: React.FC = () => {
  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Header />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 p-4 overflow-auto" style={{ maxWidth: 'calc(100vw - 250px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

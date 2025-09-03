import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import TransactionsPage from '../pages/TransactionsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import LedgerPage from '../pages/LedgerPage'
import ClientsPage from '../pages/ClientsPage'
import SettingsPage from '../pages/SettingsPage'

export type PageType = 
  | 'dashboard' 
  | 'transactions' 
  | 'analytics' 
  | 'ledger' 
  | 'clients' 
  | 'settings'

interface RouterProps {
  currentPage: PageType
}

export function Router({ currentPage }: RouterProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PipeLine Pro...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />
  }

  // Check permissions for each page
  const hasPageAccess = (page: PageType): boolean => {
    switch (page) {
      case 'dashboard':
        return true // All authenticated users can access dashboard
      case 'transactions':
        return user.permissions.includes('*') || user.permissions.includes('transactions.read')
      case 'analytics':
        return user.permissions.includes('*') || user.permissions.includes('analytics.read')
      case 'ledger':
        return user.permissions.includes('*') || user.permissions.includes('ledger.read')
      case 'clients':
        return user.permissions.includes('*') || user.permissions.includes('clients.read')
      case 'settings':
        return user.adminLevel >= 3 // Only main_admin and above
      default:
        return false
    }
  }

  if (!hasPageAccess(currentPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />
    case 'transactions':
      return <TransactionsPage />
    case 'analytics':
      return <AnalyticsPage />
    case 'ledger':
      return <LedgerPage />
    case 'clients':
      return <ClientsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}
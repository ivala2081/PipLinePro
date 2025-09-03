import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email: string
  role: 'hard_admin' | 'main_admin' | 'secondary_admin' | 'sub_admin'
  adminLevel: number
  isActive: boolean
  isLocked: boolean
  permissions: string[]
  lastLogin?: string
  failedLoginAttempts: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasAdminLevel: (requiredLevel: number) => boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Mock user data for development
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@pipelinepro.com',
    role: 'hard_admin',
    adminLevel: 4,
    isActive: true,
    isLocked: false,
    permissions: ['*'], // All permissions
    lastLogin: new Date().toISOString(),
    failedLoginAttempts: 0
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@pipelinepro.com',
    role: 'main_admin',
    adminLevel: 3,
    isActive: true,
    isLocked: false,
    permissions: [
      'transactions.read',
      'transactions.create',
      'transactions.update',
      'analytics.read',
      'clients.read',
      'clients.update'
    ],
    lastLogin: new Date().toISOString(),
    failedLoginAttempts: 0
  }
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const stored = localStorage.getItem('pipeline_user')
        if (stored) {
          const userData = JSON.parse(stored)
          setUser(userData)
        }
      } catch (error) {
        console.error('Session check failed:', error)
        localStorage.removeItem('pipeline_user')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock authentication - in real app, this would call the API
      const foundUser = mockUsers.find(u => u.username === username)
      
      if (!foundUser) {
        throw new Error('Invalid username or password')
      }

      if (foundUser.isLocked) {
        throw new Error('Account is locked due to multiple failed login attempts')
      }

      if (!foundUser.isActive) {
        throw new Error('Account is inactive. Please contact your administrator.')
      }

      // In real app, verify password hash here
      if (password !== 'admin123') {
        throw new Error('Invalid username or password')
      }

      // Update last login
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date().toISOString(),
        failedLoginAttempts: 0
      }

      setUser(updatedUser)
      localStorage.setItem('pipeline_user', JSON.stringify(updatedUser))
      
      return true
    } catch (error) {
      // Re-throw the error so it can be caught by the login page
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pipeline_user')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.permissions.includes('*')) return true
    return user.permissions.includes(permission)
  }

  const hasAdminLevel = (requiredLevel: number): boolean => {
    if (!user) return false
    return user.adminLevel >= requiredLevel
  }

  const refreshSession = async (): Promise<void> => {
    // In real app, refresh the session token
    console.log('Session refreshed')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAdminLevel,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
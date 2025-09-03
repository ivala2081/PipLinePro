import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PSPProvider } from './contexts/PSPContext'
import { AppSidebar } from './components/AppSidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { Router, PageType } from './components/Router'
import { SidebarProvider } from './components/ui/sidebar'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')

  return (
    <ThemeProvider>
      <TranslationProvider>
        <AuthProvider>
          <PSPProvider>
            <TooltipProvider>
              <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                  <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
                  <div className="flex-1 flex flex-col">
                    <DashboardHeader />
                    <Router currentPage={currentPage} />
                  </div>
                </div>
                <Toaster />
              </SidebarProvider>
            </TooltipProvider>
          </PSPProvider>
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  )
}
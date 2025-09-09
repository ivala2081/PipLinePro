import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { SWRConfig } from 'swr';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/modern/ModernLayout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { swrConfig } from './config/swrConfig';
import { ToastProvider } from './components/ToastProvider';
import SkipLink from './components/SkipLink';
import AccessibilitySettings from './components/AccessibilitySettings';

import './utils/apiTest'; // Auto-run API tests
import './styles/navigation-hover-effects.css'; // Navigation hover effects

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/ModernDashboardPage'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Login = lazy(() => import('./pages/Login'));
const Clients = lazy(() => import('./pages/Clients'));
const Agents = lazy(() => import('./pages/Agents'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const BusinessAnalytics = lazy(() => import('./pages/BusinessAnalytics'));
const SystemMonitor = lazy(() => import('./pages/SystemMonitor'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const Accounting = lazy(() => import('./pages/Accounting'));
const RevenueAnalytics = lazy(() => import('./pages/RevenueAnalytics'));

function App() {
  return (
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <LanguageProvider>
                <AccessibilityProvider>
                <ToastProvider>
                  <SkipLink />

                  <div className='min-h-screen bg-slate-50'>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path='/login' element={<Login />} />
                        <Route
                          path='/'
                          element={
                            <ProtectedRoute>
                              <Layout />
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<Dashboard />} />
                          <Route path='dashboard' element={<Dashboard />} />
                          <Route path='transactions' element={<Clients />} />
                          <Route path='accounting' element={<Accounting />} />
                          <Route path='ledger' element={<Ledger />} />
                          <Route path='transactions/add' element={<AddTransaction />} />
                          <Route path='transactions/clients' element={<Clients />} />
                          
                          {/* Legacy route redirects for backward compatibility */}
                          <Route path='clients' element={<Clients />} />
                          <Route path='agents' element={<Agents />} />
                          
                          <Route path='analytics' element={<Analytics />} />
                          <Route path='revenue-analytics' element={<RevenueAnalytics />} />
                          <Route path='settings' element={<Settings />} />
                          <Route path='reports' element={<Reports />} />
                          <Route
                            path='business-analytics'
                            element={<BusinessAnalytics />}
                          />
                          <Route
                            path='system-monitor'
                            element={<SystemMonitor />}
                          />
                          
                          {/* Legacy route redirects for backward compatibility */}
                          <Route path='/' element={<Navigate to="/dashboard" replace />} />

                          {/* Admin Routes (protected with admin requirement) */}
                          <Route
                            path='admin/users'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>User Management</h1>
                                <p>User management features coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/permissions'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>Permissions</h1>
                                <p>Permissions management coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/monitoring'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>System Monitoring</h1>
                                <p>System monitoring features coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/database'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>Database Management</h1>
                                <p>Database management features coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/backup'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>Backup & Restore</h1>
                                <p>Backup and restore features coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/security'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>Security Settings</h1>
                                <p>Security settings coming soon...</p>
                              </div>
                            }
                          />
                          <Route
                            path='admin/logs'
                            element={
                              <div className='p-6'>
                                <h1 className='text-2xl font-bold'>System Logs</h1>
                                <p>System logs viewer coming soon...</p>
                              </div>
                            }
                          />
                        </Route>
                      </Routes>
                    </Suspense>
                  </div>
                  <AccessibilitySettings />
                </ToastProvider>
                </AccessibilityProvider>
              </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SWRConfig>
    </Provider>
  );
}

export default App;

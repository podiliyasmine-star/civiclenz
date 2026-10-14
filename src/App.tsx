import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'

import { AppLayout } from './components/layout/AppLayout'
import { Navbar } from './components/layout/Navbar'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { CitizenDashboard } from './pages/citizen/CitizenDashboard'
import { AuthorityDashboard } from './pages/authority/AuthorityDashboard'
import { ReportIssuePage } from './pages/citizen/ReportIssuePage'
import { MapPage } from './pages/MapPage'
import { IssueDetailPage } from './pages/IssueDetailPage'

const queryClient = new QueryClient()

function DashboardRoute() {
  const { profile } = useAuth()
  if (profile?.role === 'authority') {
    return <AuthorityDashboard />
  }
  return <CitizenDashboard />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />

        <Routes>
          {/* Landing page with top Navbar */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-slate-900">
                <Navbar />
                <LandingPage />
              </div>
            }
          />

          {/* Auth Pages */}
          <Route
            path="/login"
            element={
              <div className="min-h-screen bg-slate-900">
                <Navbar />
                <LoginPage />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="min-h-screen bg-slate-900">
                <Navbar />
                <RegisterPage />
              </div>
            }
          />

          {/* Citizen & Shared routes */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardRoute />
              </AppLayout>
            }
          />
          <Route
            path="/report"
            element={
              <AppLayout>
                <ReportIssuePage />
              </AppLayout>
            }
          />
          <Route
            path="/map"
            element={
              <AppLayout>
                <MapPage />
              </AppLayout>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <AppLayout>
                <IssueDetailPage />
              </AppLayout>
            }
          />

          {/* Authority routes */}
          <Route
            path="/authority"
            element={
              <AppLayout>
                <AuthorityDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/authority/dashboard"
            element={
              <AppLayout>
                <AuthorityDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/authority/issues"
            element={
              <AppLayout>
                <AuthorityDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/authority/map"
            element={
              <AppLayout>
                <MapPage />
              </AppLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

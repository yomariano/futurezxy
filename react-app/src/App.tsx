import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import DashboardLayout from './components/layouts/DashboardLayout'
import MobileNav from './components/MobileNav'
import HomePage from './pages/HomePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SignalsPage from './pages/SignalsPage'
import BillingPage from './pages/BillingPage'
import SettingsPage from './pages/SettingsPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route 
              path="/*" 
              element={
                <DashboardLayout>
                  <main className="md:pl-64 pb-16 md:pb-0 min-w-0">
                    <Routes>
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/signals" element={<SignalsPage />} />
                      <Route path="/billing" element={<BillingPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </main>
                  <MobileNav />
                </DashboardLayout>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App

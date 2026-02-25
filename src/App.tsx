import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import AIIntelligence from './components/AIIntelligence';
import Goals from './components/Goals';

import ComingSoon from './components/ComingSoon';
import Settings from './components/Settings';
import HelpSupport from './components/HelpSupport';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import OnboardingTour from './components/OnboardingTour';
import { supabase, getCurrentUser } from './services';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import StickyFeedback from './components/StickyFeedback';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Check auth on mount
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot-password'>('landing');

  // App State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // currentPage state removed in favor of Router

  // Theme
  const { theme, toggleTheme, isDark } = useTheme();

  // Global Settings State
  const [aiFrequency, setAiFrequency] = useState('realtime');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (event === 'SIGNED_OUT') {
        // Do NOT force landing view here, to allow RegisterPage (Thank You) to remain visible
        // But in router mode, we might want to redirect
        // navigate('/'); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Dark mode effect handled by ThemeProvider (sets data-theme + dark class)

  // Auth Handlers
  const handleLogin = () => {
    setIsAuthenticated(true);
    setAuthView('landing');
    navigate('/dashboard');
  };

  const handleForgotPassword = () => {
    setAuthView('forgot-password');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthView('landing');
    navigate('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium" style={{ color: 'var(--t2)' }}>A carregar...</p>
        </div>
      </div>
    );
  }

  // --- Render Authentication Flows & Landing ---
  // If not authenticated, we handle routing for public pages differently or show auth screens
  if (!isAuthenticated) {
     // Allow access to Terms and Privacy even if not logged in
     if (location.pathname === '/terms') return <Terms />;
     if (location.pathname === '/privacy') return <Privacy />;

    if (authView === 'register') {
      return (
        <RegisterPage
          onLoginRequest={() => setAuthView('login')}
          onBack={() => setAuthView('landing')}
        />
      );
    }

    if (authView === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onRegister={() => setAuthView('register')}
          onBack={() => setAuthView('landing')}
          onForgotPassword={handleForgotPassword}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onLogin={() => setAuthView('login')}
          onBack={() => setAuthView('login')}
        />
      );
    }

    // Default to Landing
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onRegister={() => setAuthView('register')}
      />
    );
  }

  // --- Render Main Application (Dashboard) ---

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg)', color: 'var(--t1)' }}>
      {/* Ambient Glow */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth no-scrollbar pb-20 md:pb-0">
        <MobileNav />

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <OnboardingTour />
          <Header />

          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onNavigate={(page: any) => navigate(page === 'dashboard' ? '/dashboard' : `/${page}`)} lastUpdated={lastUpdated} />} />
              <Route path="/billing" element={<Billing onNavigate={(page: any) => navigate(page === 'dashboard' ? '/dashboard' : `/${page}`)} />} />
              <Route path="/ai" element={<AIIntelligence />} />
              <Route path="/goals" element={<Goals lastUpdated={lastUpdated} />} />
              <Route path="/builder" element={
                <ComingSoon 
                  title="Construtor de Faturas" 
                  description="Uma nova experiência de criação de faturas com IA está chegando. Aguarde novidades!"
                  onBack={() => navigate('/dashboard')}
                />
              } />
              <Route path="/settings" element={
                <Settings
                  darkMode={isDark}
                  toggleDarkMode={toggleTheme}
                  aiFrequency={aiFrequency}
                  setAiFrequency={setAiFrequency}
                />
              } />
              <Route path="/help" element={<HelpSupport />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>

        </div>
        <StickyFeedback />
      </main>
    </div>
  );
};

// Wrap App in ThemeProvider
const AppWithTheme: React.FC = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;
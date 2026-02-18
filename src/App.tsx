import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Check auth on mount
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot-password'>('landing');

  // App State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // currentPage state removed in favor of Router

  // Global Settings State
  const [darkMode, setDarkMode] = useState(false);
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

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#73c6df] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">A carregar...</p>
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
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-[#f8fafc]'}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth no-scrollbar dark:text-slate-100 pb-20 md:pb-0">
        <MobileNav />
        {/* Background Ambient Blurs for depth - Adjusted for Dark Mode */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#73c6df]/10 dark:bg-[#73c6df]/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-64 w-[400px] h-[400px] bg-[#8bd7bf]/20 dark:bg-[#8bd7bf]/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none z-0"></div>

        <div className="relative z-10">
          <OnboardingTour />
          <Header darkMode={darkMode} />

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
                  darkMode={darkMode}
                  toggleDarkMode={() => setDarkMode(!darkMode)}
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
      </main>
    </div>
  );
};

export default App;
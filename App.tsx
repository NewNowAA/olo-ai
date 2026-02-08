import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import AIIntelligence from './components/AIIntelligence';
import Goals from './components/Goals';
import InvoiceBuilder from './components/InvoiceBuilder';
import Settings from './components/Settings';
import HelpSupport from './components/HelpSupport';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { supabase, getCurrentUser } from '@/src/services';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Check auth on mount
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // App State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help'>('dashboard');

  // Global Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [aiFrequency, setAiFrequency] = useState('realtime');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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
        setAuthView('landing');
        setCurrentPage('dashboard');
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
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    const { supabase } = await import('@/src/services');
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthView('landing');
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

  // --- Render Authentication Flows ---

  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setAuthView('landing')}
          onRegister={() => setAuthView('register')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onLoginRequest={() => setAuthView('login')}
          onBack={() => setAuthView('landing')}
        />
      );
    }
    // Default Landing Page
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
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth no-scrollbar dark:text-slate-100">
        {/* Background Ambient Blurs for depth - Adjusted for Dark Mode */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#73c6df]/10 dark:bg-[#73c6df]/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-64 w-[400px] h-[400px] bg-[#8bd7bf]/20 dark:bg-[#8bd7bf]/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none z-0"></div>

        <div className="relative z-10">
          <Header darkMode={darkMode} />

          {currentPage === 'dashboard' && <Dashboard onNavigate={(page) => setCurrentPage(page)} lastUpdated={lastUpdated} />}
          {currentPage === 'billing' && <Billing />}
          {currentPage === 'ai' && <AIIntelligence />}
          {currentPage === 'goals' && <Goals lastUpdated={lastUpdated} />}
          {currentPage === 'builder' && <InvoiceBuilder />}

          {currentPage === 'settings' && (
            <Settings
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode(!darkMode)}
              aiFrequency={aiFrequency}
              setAiFrequency={setAiFrequency}
            />
          )}

          {currentPage === 'help' && <HelpSupport />}
        </div>
      </main>
    </div>
  );
};

export default App;
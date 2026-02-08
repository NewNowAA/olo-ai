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

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // App State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help'>('dashboard');
  
  // Global Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [aiFrequency, setAiFrequency] = useState('realtime'); // realtime, daily, weekly
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  // Effect to handle body class for dark mode if needed globally, 
  // though we are wrapping the main div
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
    setAuthView('landing'); // Reset for when they logout
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthView('landing');
  };

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
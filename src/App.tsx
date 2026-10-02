import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { ToastProvider, useToast } from './components/Common/Toast';
import { AppLayout } from './components/Layout/AppLayout';
import { NavTab } from './components/Layout/Sidebar';

import { LoginPage } from './pages/Login/LoginPage';
import { RegisterPage } from './pages/Register/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ClientsPage } from './pages/Clients/ClientsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { ProcessesPage } from './pages/Processes/ProcessesPage';
import { MaterialsPage } from './pages/Materials/MaterialsPage';
import { BrandCenterPage } from './pages/BrandCenter/BrandCenterPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { authService } from './services/auth';

const tabToPath = (tab: NavTab): string => {
  switch (tab) {
    case 'dashboard': return '/dashboard';
    case 'clients': return '/clientes';
    case 'projects': return '/projetos';
    case 'processes': return '/processos';
    case 'materials': return '/materiais';
    case 'brand-center': return '/brand-center';
    case 'profile': return '/perfil';
    case 'settings': return '/configuracoes';
    default: return '/dashboard';
  }
};

const pathToTab = (pathname: string): NavTab => {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard') return 'dashboard';
  if (clean === 'clientes' || clean === 'clients') return 'clients';
  if (clean === 'projetos' || clean === 'projects') return 'projects';
  if (clean === 'processos' || clean === 'processes') return 'processes';
  if (clean === 'materiais' || clean === 'materials') return 'materials';
  if (clean === 'brand-center' || clean === 'brand') return 'brand-center';
  if (clean === 'perfil' || clean === 'profile') return 'profile';
  if (clean === 'configuracoes' || clean === 'settings') return 'settings';
  return 'dashboard';
};

const MainApp: React.FC = () => {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return db.getAuthSession().isAuthenticated;
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    return window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '') === 'cadastro'
      ? 'register'
      : 'login';
  });

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    return pathToTab(window.location.pathname);
  });
  const [targetId, setTargetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    db.init();

    // 1. Sincroniza navegação de histórico do navegador (botão voltar/avançar e F5)
    const handlePopState = () => {
      const isCadastro = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '') === 'cadastro';
      setAuthMode(isCadastro ? 'register' : 'login');
      setCurrentTab(pathToTab(window.location.pathname));
      setTargetId(undefined);
    };
    window.addEventListener('popstate', handlePopState);

    // 2. Verifica sessão existente no Supabase Auth
    authService.getSession().then((session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        db.setAuthSession({ isAuthenticated: true, email: session.user.email || '' });
      }
    });

    // 3. Monitora mudanças de estado de autenticação em tempo real
    const { data: authListener } = authService.onAuthStateChange((session, profile) => {
      if (session?.user) {
        setIsAuthenticated(true);
        db.setAuthSession({ isAuthenticated: true, email: session.user.email || '' });
        if (profile) db.saveUser(profile);
      } else if (!db.getAuthSession().isAuthenticated) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const tab = pathToTab(window.location.pathname);
    setCurrentTab(tab);
    if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/login' || window.location.pathname === '/cadastro') {
      window.history.replaceState(null, '', '/dashboard');
    }
    showToast('Bem-vindo ao Alicerce OS!', 'success');
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
    window.history.replaceState(null, '', '/dashboard');
    setCurrentTab('dashboard');
    showToast('Conta criada com sucesso! Bem-vindo ao Alicerce OS.', 'success');
  };

  const handleNavigateToRegister = () => {
    setAuthMode('register');
    window.history.pushState(null, '', '/cadastro');
  };

  const handleNavigateToLogin = () => {
    setAuthMode('login');
    window.history.pushState(null, '', '/login');
  };

  const handleLogout = async () => {
    await authService.signOut();
    db.setAuthSession({ isAuthenticated: false, email: '' });
    setIsAuthenticated(false);
    window.history.replaceState(null, '', '/');
    showToast('Sessão encerrada com segurança.', 'info');
  };

  const handleNavigate = (tab: NavTab, id?: string) => {
    setCurrentTab(tab);
    setTargetId(id);
    const newPath = tabToPath(tab);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={handleNavigateToLogin}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={handleNavigateToRegister}
      />
    );
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tab) => handleNavigate(tab)}
      onLogout={handleLogout}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}

      {currentTab === 'clients' && (
        <ClientsPage
          selectedClientId={targetId}
          onNavigateToProject={(projId) => handleNavigate('projects', projId)}
          onNavigateToMaterial={(matId) => handleNavigate('materials', matId)}
        />
      )}

      {currentTab === 'projects' && (
        <ProjectsPage
          selectedProjectId={targetId}
          onClearSelectedProject={() => setTargetId(undefined)}
        />
      )}

      {currentTab === 'processes' && (
        <ProcessesPage
          selectedProcessId={targetId}
          onClearSelectedProcess={() => setTargetId(undefined)}
        />
      )}

      {currentTab === 'materials' && (
        <MaterialsPage
          selectedMaterialId={targetId}
          onClearSelectedMaterial={() => setTargetId(undefined)}
        />
      )}

      {currentTab === 'brand-center' && <BrandCenterPage />}

      {currentTab === 'profile' && <ProfilePage />}

      {currentTab === 'settings' && <SettingsPage />}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};

export default App;

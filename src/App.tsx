import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { ToastProvider, useToast } from './components/Common/Toast';
import { AppLayout } from './components/Layout/AppLayout';
import { NavTab } from './components/Layout/Sidebar';

import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ClientsPage } from './pages/Clients/ClientsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { ProcessesPage } from './pages/Processes/ProcessesPage';
import { MaterialsPage } from './pages/Materials/MaterialsPage';
import { BrandCenterPage } from './pages/BrandCenter/BrandCenterPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { authService } from './services/auth';

const MainApp: React.FC = () => {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return db.getAuthSession().isAuthenticated;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    db.init();

    // 1. Verifica sessão existente no Supabase Auth
    authService.getSession().then((session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        db.setAuthSession({ isAuthenticated: true, email: session.user.email || '' });
      }
    });

    // 2. Monitora mudanças de estado de autenticação em tempo real
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
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentTab('dashboard');
    showToast('Bem-vindo ao Alicerce OS!', 'success');
  };

  const handleLogout = async () => {
    await authService.signOut();
    db.setAuthSession({ isAuthenticated: false, email: '' });
    setIsAuthenticated(false);
    showToast('Sessão encerrada com segurança.', 'info');
  };

  const handleNavigate = (tab: NavTab, id?: string) => {
    setCurrentTab(tab);
    setTargetId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
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

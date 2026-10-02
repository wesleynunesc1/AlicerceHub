import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { ToastProvider, useToast } from './components/Common/Toast';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { AppLayout } from './components/Layout/AppLayout';
import { NavTab } from './components/Layout/Sidebar';

import { LoginPage } from './pages/Login/LoginPage';
import { RegisterPage } from './pages/Register/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ClientsPage } from './pages/Clients/ClientsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { ApprovalsPage } from './pages/Approvals/ApprovalsPage';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { ProposalsPage } from './pages/Proposals/ProposalsPage';
import { ContractsPage } from './pages/Contracts/ContractsPage';
import { FinancialPage } from './pages/Financial/FinancialPage';
import { ProcessesPage } from './pages/Processes/ProcessesPage';
import { TemplatesPage } from './pages/Templates/TemplatesPage';
import { MaterialsPage } from './pages/Materials/MaterialsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { TeamPage } from './pages/Team/TeamPage';
import { ContentPage } from './pages/Content/ContentPage';
import { BrandCenterPage } from './pages/BrandCenter/BrandCenterPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { authService } from './services/auth';

const tabToPath = (tab: NavTab): string => {
  switch (tab) {
    case 'dashboard': return '/dashboard';
    case 'clients': return '/clientes';
    case 'projects': return '/projetos';
    case 'tasks': return '/tarefas';
    case 'calendar': return '/agenda';
    case 'approvals': return '/aprovacoes';
    case 'leads': return '/leads';
    case 'proposals': return '/propostas';
    case 'contracts': return '/contratos';
    case 'financial': return '/financeiro';
    case 'processes': return '/processos';
    case 'templates': return '/templates';
    case 'materials': return '/materiais';
    case 'reports': return '/relatorios';
    case 'team': return '/equipe';
    case 'content': return '/conteudo';
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
  if (clean === 'tarefas' || clean === 'tasks') return 'tasks';
  if (clean === 'agenda' || clean === 'calendar') return 'calendar';
  if (clean === 'aprovacoes' || clean === 'approvals') return 'approvals';
  if (clean === 'leads' || clean === 'comercial') return 'leads';
  if (clean === 'propostas' || clean === 'proposals') return 'proposals';
  if (clean === 'contratos' || clean === 'contracts') return 'contracts';
  if (clean === 'financeiro' || clean === 'financial') return 'financial';
  if (clean === 'processos' || clean === 'processes') return 'processes';
  if (clean === 'templates') return 'templates';
  if (clean === 'materiais' || clean === 'materials') return 'materials';
  if (clean === 'relatorios' || clean === 'reports') return 'reports';
  if (clean === 'equipe' || clean === 'team') return 'team';
  if (clean === 'conteudo' || clean === 'content') return 'content';
  if (clean === 'brand-center' || clean === 'brand') return 'brand-center';
  if (clean === 'perfil' || clean === 'profile') return 'profile';
  if (clean === 'configuracoes' || clean === 'settings') return 'settings';
  return 'dashboard';
};

const parseQueryParams = () => {
  if (typeof window === 'undefined') return {};
  const searchParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });
  return params;
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

  const [navParams, setNavParams] = useState<any>(() => {
    const q = parseQueryParams();
    return q.status || q.tipo ? { filter: q.status || q.tipo } : undefined;
  });

  useEffect(() => {
    db.init();

    const handlePopState = () => {
      const isCadastro = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '') === 'cadastro';
      setAuthMode(isCadastro ? 'register' : 'login');
      setCurrentTab(pathToTab(window.location.pathname));
      const q = parseQueryParams();
      setNavParams(q.status || q.tipo ? { filter: q.status || q.tipo } : undefined);
    };
    window.addEventListener('popstate', handlePopState);

    authService.getSession().then((session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        db.setAuthSession({ isAuthenticated: true, email: session.user.email || '' });
      }
    });

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

  const handleNavigate = (tab: NavTab, params?: any) => {
    setCurrentTab(tab);
    const resolvedParams = typeof params === 'string' ? { id: params } : params;
    setNavParams(resolvedParams);

    const basePath = tabToPath(tab);
    let fullPath = basePath;
    if (resolvedParams?.filter) {
      fullPath = `${basePath}?status=${encodeURIComponent(resolvedParams.filter)}`;
    }
    if (window.location.pathname + window.location.search !== fullPath) {
      window.history.pushState(null, '', fullPath);
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
          selectedClientId={navParams?.id}
          initialFilter={navParams?.filter}
          initialSubTab={navParams?.subTab}
          onNavigate={handleNavigate}
          onNavigateToProject={(projId) => handleNavigate('projects', { id: projId })}
          onNavigateToMaterial={(matId) => handleNavigate('materials', { id: matId })}
        />
      )}

      {currentTab === 'projects' && (
        <ProjectsPage
          selectedProjectId={navParams?.id}
          initialFilter={navParams?.filter}
          action={navParams?.action}
          clientId={navParams?.clientId}
          clientName={navParams?.clientName}
          service={navParams?.service}
          onClearSelectedProject={() => setNavParams(undefined)}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'tasks' && (
        <TasksPage
          initialFilter={navParams?.filter}
          initialTaskId={navParams?.id}
          initialClientId={navParams?.clientId}
          initialProjectId={navParams?.projectId}
          action={navParams?.action}
          onNavigateToProject={(projId) => handleNavigate('projects', { id: projId })}
          onNavigateToClient={(clientId) => handleNavigate('clients', { id: clientId })}
        />
      )}

      {currentTab === 'calendar' && (
        <CalendarPage
          initialFilter={navParams?.filter}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'approvals' && (
        <ApprovalsPage
          initialFilter={navParams?.filter}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'leads' && (
        <LeadsPage
          initialFilter={navParams?.filter}
          selectedLeadId={navParams?.id}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'proposals' && (
        <ProposalsPage
          initialFilter={navParams?.filter}
          action={navParams?.action}
          leadId={navParams?.leadId}
          leadName={navParams?.leadName}
          company={navParams?.company}
          service={navParams?.service}
          estimatedValue={navParams?.estimatedValue}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'contracts' && (
        <ContractsPage
          initialFilter={navParams?.filter}
          action={navParams?.action}
          clientId={navParams?.clientId}
          clientName={navParams?.clientName}
          service={navParams?.service}
          value={navParams?.value}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'financial' && (
        <FinancialPage
          initialFilter={navParams?.filter}
          initialEntryId={navParams?.id}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'processes' && (
        <ProcessesPage
          selectedProcessId={navParams?.id}
          onClearSelectedProcess={() => setNavParams(undefined)}
        />
      )}

      {currentTab === 'templates' && <TemplatesPage />}

      {currentTab === 'materials' && (
        <MaterialsPage
          selectedMaterialId={navParams?.id}
          onClearSelectedMaterial={() => setNavParams(undefined)}
        />
      )}

      {currentTab === 'reports' && <ReportsPage />}

      {currentTab === 'team' && <TeamPage />}

      {currentTab === 'content' && <ContentPage />}

      {currentTab === 'brand-center' && <BrandCenterPage />}

      {currentTab === 'profile' && <ProfilePage />}

      {currentTab === 'settings' && <SettingsPage />}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </ToastProvider>
  );
};

export default App;

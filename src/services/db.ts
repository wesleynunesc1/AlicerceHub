import {
  Client,
  Project,
  SOPProcess,
  Material,
  UserProfile,
  NotificationItem,
  ActivityItem
} from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'alicerce_clients_v2',
  PROJECTS: 'alicerce_projects_v2',
  PROCESSES: 'alicerce_processes_v2',
  MATERIALS: 'alicerce_materials_v2',
  USER: 'alicerce_user_v2',
  NOTIFICATIONS: 'alicerce_notifications_v2',
  ACTIVITIES: 'alicerce_activities_v2',
  AUTH: 'alicerce_auth_v2'
};

export const defaultUser: UserProfile = {
  id: 'usr-1',
  name: 'Wesley Nunes',
  email: 'admin@alicerce.com',
  role: 'Diretor de Operações & Estratégia',
  roleType: 'Admin',
  phone: '(11) 98765-4321'
};

const initialClients: Client[] = [];
const initialProjects: Project[] = [];
const initialProcesses: SOPProcess[] = [];
const initialMaterials: Material[] = [];
const initialNotifications: NotificationItem[] = [];
const initialActivities: ActivityItem[] = [];

// Database helper functions with LocalStorage persistence
class AlicerceDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Init clean data
  public init(): void {
    // Purge de chaves legadas com dados mockados (v1)
    const LEGACY_KEYS = [
      'alicerce_clients_v1',
      'alicerce_projects_v1',
      'alicerce_processes_v1',
      'alicerce_materials_v1',
      'alicerce_activities_v1',
      'alicerce_notifications_v1',
    ];
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.set(STORAGE_KEYS.CLIENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      this.set(STORAGE_KEYS.PROJECTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROCESSES)) {
      this.set(STORAGE_KEYS.PROCESSES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      this.set(STORAGE_KEYS.MATERIALS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.set(STORAGE_KEYS.USER, defaultUser);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      this.set(STORAGE_KEYS.ACTIVITIES, []);
    }
  }

  public resetToDefaults(): void {
    this.set(STORAGE_KEYS.CLIENTS, []);
    this.set(STORAGE_KEYS.PROJECTS, []);
    this.set(STORAGE_KEYS.PROCESSES, []);
    this.set(STORAGE_KEYS.MATERIALS, []);
    this.set(STORAGE_KEYS.USER, defaultUser);
    this.set(STORAGE_KEYS.NOTIFICATIONS, []);
    this.set(STORAGE_KEYS.ACTIVITIES, []);
  }

  // Clients
  public getClients(): Client[] {
    return this.get<Client[]>(STORAGE_KEYS.CLIENTS, initialClients);
  }

  public saveClient(client: Client): Client {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.unshift(client);
    }
    this.set(STORAGE_KEYS.CLIENTS, clients);
    return client;
  }

  public deleteClient(id: string): void {
    const clients = this.getClients().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.CLIENTS, clients);
  }

  // Projects
  public getProjects(): Project[] {
    return this.get<Project[]>(STORAGE_KEYS.PROJECTS, initialProjects);
  }

  public saveProject(project: Project): Project {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    this.set(STORAGE_KEYS.PROJECTS, projects);
    return project;
  }

  public deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROJECTS, projects);
  }

  // Processes
  public getProcesses(): SOPProcess[] {
    return this.get<SOPProcess[]>(STORAGE_KEYS.PROCESSES, initialProcesses);
  }

  public saveProcess(process: SOPProcess): SOPProcess {
    const processes = this.getProcesses();
    const index = processes.findIndex((p) => p.id === process.id);
    if (index >= 0) {
      processes[index] = process;
    } else {
      processes.unshift(process);
    }
    this.set(STORAGE_KEYS.PROCESSES, processes);
    return process;
  }

  public deleteProcess(id: string): void {
    const processes = this.getProcesses().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROCESSES, processes);
  }

  // Materials
  public getMaterials(): Material[] {
    return this.get<Material[]>(STORAGE_KEYS.MATERIALS, initialMaterials);
  }

  public saveMaterial(material: Material): Material {
    const materials = this.getMaterials();
    const index = materials.findIndex((m) => m.id === material.id);
    if (index >= 0) {
      materials[index] = material;
    } else {
      materials.unshift(material);
    }
    this.set(STORAGE_KEYS.MATERIALS, materials);
    return material;
  }

  public deleteMaterial(id: string): void {
    const materials = this.getMaterials().filter((m) => m.id !== id);
    this.set(STORAGE_KEYS.MATERIALS, materials);
  }

  // User
  public getUser(): UserProfile {
    return this.get<UserProfile>(STORAGE_KEYS.USER, defaultUser);
  }

  public saveUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.USER, user);
  }

  // Auth
  public getAuthSession(): { isAuthenticated: boolean; email: string } {
    return this.get(STORAGE_KEYS.AUTH, {
      isAuthenticated: true,
      email: 'admin@alicerce.com'
    });
  }

  public setAuthSession(session: { isAuthenticated: boolean; email: string }): void {
    this.set(STORAGE_KEYS.AUTH, session);
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Activities
  public getActivities(): ActivityItem[] {
    return this.get<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
  }

  public addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const activities = this.getActivities();
    const newAct: ActivityItem = {
      ...activity,
      id: 'act-' + Date.now(),
      timestamp: 'Agora'
    };
    activities.unshift(newAct);
    if (activities.length > 20) activities.pop();
    this.set(STORAGE_KEYS.ACTIVITIES, activities);
  }
}

export const db = new AlicerceDatabase();

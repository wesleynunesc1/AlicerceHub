import { supabase } from '../lib/supabase';
import { Client, Material, Project, SOPProcess } from '../types';
import { clientsService } from './clients';
import { materialsService } from './materials';
import { processesService } from './processes';
import { projectsService } from './projects';

export interface GlobalSearchResults {
  clients: Client[];
  projects: Project[];
  processes: SOPProcess[];
  materials: Material[];
}

export const searchService = {
  /**
   * Busca global em Clientes, Projetos, Processos e Materiais via Supabase
   */
  async search(query: string): Promise<GlobalSearchResults> {
    const q = query.trim();
    if (!q) {
      return { clients: [], projects: [], processes: [], materials: [] };
    }

    try {
      const [allClients, allProjects, allProcesses, allMaterials] = await Promise.all([
        clientsService.getClients(),
        projectsService.getProjects(),
        processesService.getProcesses(),
        materialsService.getMaterials(),
      ]);

      const lowerQ = q.toLowerCase();

      const clients = allClients.filter(
        (c) =>
          c.companyName.toLowerCase().includes(lowerQ) ||
          c.contactName.toLowerCase().includes(lowerQ) ||
          c.segment.toLowerCase().includes(lowerQ) ||
          c.email.toLowerCase().includes(lowerQ)
      );

      const projects = allProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQ) ||
          p.clientName.toLowerCase().includes(lowerQ) ||
          p.service.toLowerCase().includes(lowerQ)
      );

      const processes = allProcesses.filter(
        (pr) =>
          pr.title.toLowerCase().includes(lowerQ) ||
          pr.service.toLowerCase().includes(lowerQ) ||
          pr.category.toLowerCase().includes(lowerQ)
      );

      const materials = allMaterials.filter(
        (m) =>
          m.title.toLowerCase().includes(lowerQ) ||
          m.category.toLowerCase().includes(lowerQ) ||
          m.description.toLowerCase().includes(lowerQ)
      );

      return { clients, projects, processes, materials };
    } catch (err) {
      console.warn('Erro na busca global:', err);
      return { clients: [], projects: [], processes: [], materials: [] };
    }
  },
};

export type DesktopNavId = 
  | 'today'         // Hoje (Prospectar hoje)
  | 'companies'     // Empresas
  | 'qualification' // Motor de Qualificação & Scores
  | 'funnels'       // Funis
  | 'scripts'       // Scripts
  | 'objections'    // Objeções
  | 'services'      // Serviços
  | 'calendar'      // Calendário
  | 'statistics'    // Estatísticas
  | 'settings';     // Configurações

export type MobileNavId = 
  | 'today'         // Hoje (Prospectar hoje)
  | 'companies'     // Empresas
  | 'funnels'       // Funis
  | 'scripts'       // Scripts
  | 'calendar';     // Agenda (Ações agrupadas: Atrasadas, Hoje, Próximas)

export interface NavItemConfig {
  id: DesktopNavId;
  label: string;
  iconName: string;
  badgeCount?: number;
  description?: string;
}

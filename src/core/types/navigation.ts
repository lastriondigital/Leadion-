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
  | 'today'         // Hoje
  | 'companies'     // Empresas
  | 'funnels'       // Funis
  | 'scripts'       // Scripts
  | 'more';         // Mais (Abre drawer com Objeções, Serviços, Calendário, Estatísticas, Configurações)

export interface NavItemConfig {
  id: DesktopNavId;
  label: string;
  iconName: string;
  badgeCount?: number;
  description?: string;
}

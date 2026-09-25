import React, { useState } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';
import { MobileMoreDrawer } from './MobileMoreDrawer';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useLeadion } from '../../context/LeadionContext';
import { ProspectTodayView } from '../prospecting/ProspectTodayView';
import { CompaniesView } from '../views/CompaniesView';
import { FunnelsView } from '../views/FunnelsView';
import { ScriptsView } from '../views/ScriptsView';
import { ObjectionsView } from '../views/ObjectionsView';
import { ServicesView } from '../views/ServicesView';
import { CalendarView } from '../views/CalendarView';
import { StatsView } from '../views/StatsView';
import { SettingsView } from '../views/SettingsView';
import { QualificationView } from '../views/QualificationView';
import { ExecutionDrawer } from '../prospecting/ExecutionDrawer';
import { NewLeadModal } from '../modals/NewLeadModal';
import { CompanyFormModal } from '../modals/CompanyFormModal';
import { ActionPlanningModal } from '../modals/ActionPlanningModal';
import { PrioritySettingsModal } from '../prospecting/PrioritySettingsModal';
import { QuickCompanyModal } from '../companies/QuickCompanyModal';
import { ServiceFormModal } from '../modals/ServiceFormModal';
import { ServiceDetailModal } from '../modals/ServiceDetailModal';
import { FunnelFormModal } from '../modals/FunnelFormModal';
import { FunnelStagesModal } from '../modals/FunnelStagesModal';
import { ScriptBuilderModal } from '../scripts/ScriptBuilderModal';
import { WhatsAppDispatchModal } from '../scripts/WhatsAppDispatchModal';
import { ObjectionResponseModal } from '../scripts/ObjectionResponseModal';
import { ObjectionBuilderModal } from '../objections/ObjectionBuilderModal';
import { ObjectionSequenceModal } from '../objections/ObjectionSequenceModal';
import { ObjectionDispatchModal } from '../objections/ObjectionDispatchModal';
import { ActionOutcomeModal } from '../modals/ActionOutcomeModal';
import { SyncCenterModal } from '../sync/SyncCenterModal';
import { DataManagementModal } from '../data/DataManagementModal';
import { ConflictResolutionModal } from '../sync/ConflictResolutionModal';
import { AuthModal } from '../modals/AuthModal';

export const AppShell: React.FC = () => {
  const { 
    activeNav,
    isScriptModalOpen,
    setIsScriptModalOpen,
    editingScript,
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    whatsAppModalData,
    isObjectionModalOpen,
    setIsObjectionModalOpen,
    objectionModalData,
    openObjectionModal,
    setIsPlanningModalOpen,
    setPlanningPreselectedCompany,
    scriptsEntities,
    openWhatsAppForCompany,
    openObjectionDispatchModal,
    isObjectionDispatchModalOpen,
    setIsObjectionDispatchModalOpen,
    objectionDispatchData,
    isOutcomeModalOpen,
    closeActionOutcomeModal,
    outcomeModalAction,
    isSyncCenterModalOpen,
    setIsSyncCenterModalOpen,
    isDataManagementModalOpen,
    setIsDataManagementModalOpen,
    dataManagementDefaultTab,
    openDataManagementModal,
    isConflictModalOpen,
    setIsConflictModalOpen,
    activeConflict,
    resolveActiveConflict,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useLeadion() as any;

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'today':
        return <ProspectTodayView />;
      case 'companies':
        return <CompaniesView />;
      case 'qualification':
        return <QualificationView />;
      case 'funnels':
        return <FunnelsView />;
      case 'scripts':
        return <ScriptsView />;
      case 'objections':
        return <ObjectionsView />;
      case 'services':
        return <ServicesView />;
      case 'calendar':
        return <CalendarView />;
      case 'statistics':
        return <StatsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ProspectTodayView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-app text-ink">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-8">
        {/* Mobile Top Bar */}
        <MobileTopBar 
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          onOpenMore={() => setIsMobileMoreOpen(true)}
        />

        {/* Desktop Header */}
        <Header />
        
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Mobile "Mais" Drawer */}
      <MobileMoreDrawer
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
      />

      {/* Global Real Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Global Interactive Execution Drawer */}
      <ExecutionDrawer />

      {/* Quick Add Prospect Modal */}
      <NewLeadModal />

      {/* Enterprise Company Form Modal */}
      <CompanyFormModal />

      {/* Smart Prospect Action Planning Modal */}
      <ActionPlanningModal />

      {/* Priority Rules & Weights Settings Modal */}
      <PrioritySettingsModal />

      {/* Quick Company Profile Modal */}
      <QuickCompanyModal />

      {/* Service CRUD & Multi-Country Pricing Modals */}
      <ServiceFormModal />
      <ServiceDetailModal />

      {/* Funnel CRUD & Stages Configuration Modals */}
      <FunnelFormModal />
      <FunnelStagesModal />

      {/* Script Builder Modal */}
      <ScriptBuilderModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        editingScript={editingScript}
      />

      {/* WhatsApp Dispatch & Status Audit Modal */}
      {whatsAppModalData && (
        <WhatsAppDispatchModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          company={whatsAppModalData.company}
          script={whatsAppModalData.script}
          customMessage={whatsAppModalData.customMessage}
          actionId={whatsAppModalData.actionId}
          onProgramFollowUp={() => {
            setPlanningPreselectedCompany(whatsAppModalData.company);
            setIsPlanningModalOpen(true);
          }}
          onOpenObjection={() => {
            openObjectionDispatchModal(
              whatsAppModalData.company,
              whatsAppModalData.actionId
            );
          }}
          onNextMessage={() => {
            const currentScript = whatsAppModalData.script;
            let nextScript = null;
            if (currentScript?.nextScriptId) {
              nextScript = scriptsEntities.find((s) => s.id === currentScript.nextScriptId) || null;
            }
            if (!nextScript && currentScript) {
              const currentOrder = currentScript.sequenceOrder || 1;
              nextScript = scriptsEntities.find((s) => (s.sequenceOrder || 0) === currentOrder + 1) || null;
            }
            if (!nextScript) {
              nextScript = scriptsEntities.find((s) => s.sequenceType === 'followup') || scriptsEntities[1] || scriptsEntities[0];
            }
            if (nextScript) {
              openWhatsAppForCompany(whatsAppModalData.company, nextScript, undefined, whatsAppModalData.actionId);
            } else {
              setIsWhatsAppModalOpen(false);
            }
          }}
        />
      )}

      {/* Objection Response Matrix Modal */}
      <ObjectionResponseModal
        isOpen={isObjectionModalOpen}
        onClose={() => setIsObjectionModalOpen(false)}
        companyName={objectionModalData?.companyName}
        contactName={objectionModalData?.contactName}
        onSelectResponseScript={objectionModalData?.onSelectResponseScript}
      />

      {/* Interactive Objection Dispatch Modal */}
      {isObjectionDispatchModalOpen && (
        <ObjectionDispatchModal
          isOpen={isObjectionDispatchModalOpen}
          onClose={() => setIsObjectionDispatchModalOpen(false)}
          company={objectionDispatchData?.company || null}
          actionId={objectionDispatchData?.actionId}
          preselectedObjectionId={objectionDispatchData?.preselectedObjectionId}
        />
      )}

      {/* Action Outcome & Automated Next Action Engine Modal */}
      <ActionOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={closeActionOutcomeModal}
        action={outcomeModalAction}
      />

      {/* Central de Sincronização & Nuvem Supabase */}
      <SyncCenterModal
        isOpen={isSyncCenterModalOpen}
        onClose={() => setIsSyncCenterModalOpen(false)}
        onOpenDataModal={(tab) => openDataManagementModal(tab)}
      />

      {/* Central de Backup & Importação/Exportação */}
      <DataManagementModal
        isOpen={isDataManagementModalOpen}
        onClose={() => setIsDataManagementModalOpen(false)}
        initialTab={dataManagementDefaultTab}
      />

      {/* Resolução de Conflitos Concorrentes */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflict={activeConflict}
        onResolve={resolveActiveConflict}
      />

      {/* Modal de Autenticação Supabase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
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
    isObjectionDispatchModalOpen,
    setIsObjectionDispatchModalOpen,
    objectionDispatchData,
  } = useLeadion();

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
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

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
            openObjectionModal(
              whatsAppModalData.company.name,
              whatsAppModalData.company.targetContactName
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
    </div>
  );
};

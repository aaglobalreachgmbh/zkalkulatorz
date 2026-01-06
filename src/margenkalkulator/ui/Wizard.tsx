import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, Signal, Router, LayoutGrid, Lock, AlertTriangle, XCircle, Settings, Zap 
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePOSMode } from "@/contexts/POSModeContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  type OfferOptionState,
  type ViewMode,
  type WizardStep,
  createDefaultOptionState,
  calculateOffer,
  useWizardValidation,
} from "@/margenkalkulator";
import { useEmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { usePushProvisions } from "@/margenkalkulator/hooks/usePushProvisions";
import { useDatasetVersions } from "@/margenkalkulator/hooks/useDatasetVersions";
import { useTenantDataStatus } from "@/margenkalkulator/hooks/useTenantDataStatus";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { CompareStep } from "./steps/CompareStep";
import { ValidationWarning } from "./components/ValidationWarning";
import { AiConsultant } from "./components/AiConsultant";
import { ActionMenu } from "./components/ActionMenu";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { CustomerSessionToggle } from "./components/CustomerSessionToggle";
import { LiveCalculationBar, getStepSummary } from "./components/LiveCalculationBar";
import { SummarySidebar } from "./components/SummarySidebar";
import { GigaKombiBanner } from "./components/GigaKombiBanner";
import { SavingsBreakdown } from "./components/SavingsBreakdown";
import { QuickStartDialog, shouldShowQuickStart } from "./components/QuickStartDialog";
import { useHistory } from "../hooks/useHistory";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useEffectivePolicy } from "@/hooks/useEffectivePolicy";
import { useFeature } from "@/hooks/useFeature";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { useWizardAutoSave } from "@/hooks/useWizardAutoSave";
import { OnboardingTour, OnboardingPrompt } from "@/components/OnboardingTour";
import { WizardRestoreDialog } from "@/components/WizardRestoreDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STEPS: { id: WizardStep; label: string; icon: typeof Smartphone }[] = [
  { id: "hardware", label: "Hardware", icon: Smartphone },
  { id: "mobile", label: "Mobilfunk", icon: Signal },
  { id: "fixedNet", label: "Festnetz", icon: Router },
  { id: "compare", label: "Kalkulation", icon: LayoutGrid },
];

export function Wizard() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const { session: customerSession, toggleSession } = useCustomerSession();
  const policy = useEffectivePolicy();
  const isMobile = useIsMobile();
  const { isPOSMode, togglePOSMode } = usePOSMode();
  
  // Employee Settings & Push Provisions Hooks
  const { settings: employeeSettings } = useEmployeeSettings();
  const { getBonusAmount } = usePushProvisions();
  const { addToHistory } = useHistory();
  
  // Onboarding Tour Hook
  const tour = useOnboardingTour();
  
  // Auto-Save Hook
  const autoSave = useWizardAutoSave();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const hasCheckedAutoSave = useRef(false);
  
  // QuickStart Dialog
  const [showQuickStart, setShowQuickStart] = useState(false);
  
  // Dataset Versions - Auto-seed if none exist
  const { versions, isLoading: isLoadingVersions, seedDefaultVersion, isSeeding } = useDatasetVersions();
  const hasSeeded = useRef(false);
  const { canAccessAdmin, isSupabaseAuth } = useIdentity();
  
  // Tenant Data Status Check
  const { status: tenantDataStatus, isLoading: isLoadingTenantData } = useTenantDataStatus();
  
  useEffect(() => {
    const shouldSeed = !isLoadingVersions 
      && versions.length === 0 
      && !hasSeeded.current 
      && !isSeeding
      && isSupabaseAuth 
      && canAccessAdmin;
      
    if (shouldSeed) {
      hasSeeded.current = true;
      seedDefaultVersion().catch(() => {
        hasSeeded.current = false;
      });
    }
  }, [isLoadingVersions, versions.length, seedDefaultVersion, isSeeding, isSupabaseAuth, canAccessAdmin]);
  
  // Accordion open sections (multiple can be open)
  const [openSections, setOpenSections] = useState<string[]>(["hardware", "mobile"]);
  const [activeOption, setActiveOption] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<ViewMode>(policy.defaultViewMode);
  
  // Feature-Gating: Check if Option 2 is enabled
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");
  
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);
  
  // Check for auto-saved draft on mount
  useEffect(() => {
    if (!hasCheckedAutoSave.current && autoSave.hasSavedDraft) {
      hasCheckedAutoSave.current = true;
      setShowRestoreDialog(true);
    } else if (!hasCheckedAutoSave.current && shouldShowQuickStart()) {
      hasCheckedAutoSave.current = true;
      setShowQuickStart(true);
    }
  }, [autoSave.hasSavedDraft]);
  
  // Handle draft restore
  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restoreDraft();
    if (draft) {
      setOption1(draft.option1);
      setOption2(draft.option2);
      setActiveOption(draft.activeOption);
      // Open relevant sections based on config
      const sections = ["mobile"];
      if (draft.option1.hardware.ekNet > 0) sections.unshift("hardware");
      if (draft.option1.fixedNet.enabled) sections.push("fixedNet");
      setOpenSections(sections);
      toast({
        title: "Entwurf wiederhergestellt",
        description: "Deine letzte Konfiguration wurde geladen.",
      });
    }
    setShowRestoreDialog(false);
  }, [autoSave, toast]);
  
  // Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    autoSave.discardDraft();
    setShowRestoreDialog(false);
    if (shouldShowQuickStart()) {
      setShowQuickStart(true);
    }
  }, [autoSave]);
  
  // Handle QuickStart selection
  const handleQuickStartSelect = useCallback((option: string) => {
    switch (option) {
      case "sim_only":
        setOpenSections(["mobile"]);
        break;
      case "with_hardware":
        setOpenSections(["hardware", "mobile"]);
        break;
      case "with_fixednet":
        setOpenSections(["hardware", "mobile", "fixedNet"]);
        setOption1(prev => ({
          ...prev,
          fixedNet: { ...prev.fixedNet, enabled: true }
        }));
        break;
      case "team_deal":
        setOpenSections(["hardware", "mobile"]);
        setOption1(prev => ({
          ...prev,
          mobile: { ...prev.mobile, quantity: 3 }
        }));
        break;
    }
  }, []);
  
  // Auto-save on state changes
  useEffect(() => {
    if (option1.mobile.tariffId || option2.mobile.tariffId) {
      autoSave.saveDraft({
        option1,
        option2,
        activeOption,
        currentStep: "hardware", // Accordion mode - no single step
      });
    }
  }, [option1, option2, activeOption, autoSave]);
  
  // Force back to Option 1 if Option 2 is disabled
  useEffect(() => {
    if (!option2Enabled && activeOption === 2) {
      setActiveOption(1);
    }
  }, [option2Enabled, activeOption]);

  // Load bundle or template config from route state
  useEffect(() => {
    const state = location.state as { 
      bundleConfig?: Partial<OfferOptionState>; 
      templateConfig?: OfferOptionState;
    } | null;
    
    if (state?.bundleConfig) {
      const merged = { ...createDefaultOptionState(), ...state.bundleConfig };
      setOption1(merged);
      toast({
        title: "Bundle geladen",
        description: "Die Bundle-Konfiguration wurde übernommen.",
      });
    } else if (state?.templateConfig) {
      setOption1(state.templateConfig);
      toast({
        title: "Template geladen",
        description: "Die Template-Konfiguration wurde übernommen.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeState = activeOption === 1 ? option1 : option2;
  const setActiveState = activeOption === 1 ? setOption1 : setOption2;

  // Prepare employee options for calculation
  const employeeOptions = useMemo(() => ({
    employeeDeduction: employeeSettings ? {
      deductionValue: employeeSettings.provisionDeduction ?? 0,
      deductionType: (employeeSettings.provisionDeductionType ?? "fixed") as "fixed" | "percentage",
    } : null,
  }), [employeeSettings]);

  // Build push provision context
  const buildPushContext = useCallback((option: OfferOptionState) => ({
    hasHardware: option.hardware.ekNet > 0,
    hardwareEkNet: option.hardware.ekNet,
    hasFixedNet: option.fixedNet.enabled,
    hasGigaKombi: option.fixedNet.enabled && option.mobile.tariffId.toLowerCase().includes("prime"),
    subVariantId: option.mobile.subVariantId,
    quantity: option.mobile.quantity,
    contractType: option.mobile.contractType,
  }), []);

  // Calculate results (memoized)
  const result1 = useMemo(() => {
    const context = buildPushContext(option1);
    const pushBonus = getBonusAmount(option1.mobile.tariffId, option1.mobile.contractType, 0, context);
    return calculateOffer(option1, { ...employeeOptions, pushBonus });
  }, [option1, employeeOptions, getBonusAmount, buildPushContext]);
  
  const result2 = useMemo(() => {
    const context = buildPushContext(option2);
    const pushBonus = getBonusAmount(option2.mobile.tariffId, option2.mobile.contractType, 0, context);
    return calculateOffer(option2, { ...employeeOptions, pushBonus });
  }, [option2, employeeOptions, getBonusAmount, buildPushContext]);

  // Validation
  const validation = useWizardValidation(activeState);

  // Load config handler
  const handleLoadConfig = useCallback((config: OfferOptionState) => {
    if (activeOption === 1) {
      setOption1(config);
    } else {
      setOption2(config);
    }
  }, [activeOption]);

  // Handle view mode change with policy checks
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    if (newMode === "dealer" && viewMode === "customer" && policy.requireConfirmOnDealerSwitch) {
      if (!window.confirm("Wechsel in den Händler-Modus?")) {
        return;
      }
    }
    
    if (newMode === "customer" && policy.requireCustomerSessionWhenCustomerMode && !customerSession.isActive) {
      toggleSession();
      toast({ title: "Kundensitzung aktiviert", description: "Sensible Daten werden ausgeblendet." });
    }
    
    setViewMode(newMode);
  }, [viewMode, policy, customerSession.isActive, toggleSession, toast]);

  // Copy option
  const copyOption = (from: 1 | 2, to: 1 | 2) => {
    if (!option2Enabled && to === 2) {
      toast({
        title: "Option 2 nicht verfügbar",
        description: option2Reason,
        variant: "destructive",
      });
      return;
    }
    const source = from === 1 ? option1 : option2;
    const setter = to === 1 ? setOption1 : setOption2;
    setter(JSON.parse(JSON.stringify(source)));
    toast({
      title: "Option kopiert",
      description: `Option ${from} → Option ${to}`,
    });
  };

  // Get active result
  const activeResult = activeOption === 1 ? result1 : result2;
  const avgMonthlyNet = activeResult.totals.avgTermNet;

  // GigaKombi eligibility check
  const isGigaKombiEligible = option1.fixedNet.enabled && 
    option1.mobile.tariffId.toLowerCase().includes("prime");

  // Super-Admin bypass
  const { isAdmin: isSuperAdmin } = useUserRole();
  
  if (isSupabaseAuth && !isSuperAdmin && !isLoadingTenantData && tenantDataStatus && !tenantDataStatus.isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Stammdaten fehlen</CardTitle>
            <CardDescription>
              Um den Kalkulator nutzen zu können, müssen zunächst die Stammdaten gepflegt werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {tenantDataStatus.hasHardware ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                  </div>
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={tenantDataStatus.hasHardware ? "text-muted-foreground" : "font-medium"}>
                  Hardware-Katalog ({tenantDataStatus.hardwareCount} Geräte)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {tenantDataStatus.hasProvisions ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                  </div>
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={tenantDataStatus.hasProvisions ? "text-muted-foreground" : "font-medium"}>
                  Provisionstabelle ({tenantDataStatus.provisionCount} Einträge)
                </span>
              </div>
            </div>
            <Button asChild className="w-full gap-2">
              <Link to="/tenant-admin">
                <Settings className="w-4 h-4" />
                Zu den Stammdaten
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      customerSession.isActive && "ring-4 ring-amber-400 ring-inset"
    )}>
      {/* Restore Draft Dialog */}
      <WizardRestoreDialog
        open={showRestoreDialog}
        savedAt={autoSave.savedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
      
      {/* QuickStart Dialog */}
      <QuickStartDialog
        open={showQuickStart}
        onOpenChange={setShowQuickStart}
        onSelect={handleQuickStartSelect}
      />
      
      {/* Onboarding Tour */}
      <OnboardingTour
        isActive={tour.isActive}
        currentStep={tour.currentStep}
        currentStepIndex={tour.currentStepIndex}
        totalSteps={tour.totalSteps}
        progress={tour.progress}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
        onEnd={() => tour.endTour(true)}
      />
      
      {tour.shouldShowTour && !tour.isActive && (
        <OnboardingPrompt
          onStart={tour.startTour}
          onDismiss={tour.skipTour}
        />
      )}
      
      {/* Header - Simplified: No logo/POS/Identity (already in Sidebar) */}
      <header className="border-b border-border bg-card shrink-0 sticky top-0 z-40 bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Step context badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Option {activeOption}
            </Badge>
            {customerSession.isActive && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                <Lock className="w-3 h-3" />
                Kundensitzung
              </Badge>
            )}
          </div>
          
          {/* Right: Essential controls only */}
          <div className="flex items-center gap-2">
            {policy.showCustomerSessionToggle && <CustomerSessionToggle />}
            
            <ViewModeToggle 
              value={viewMode} 
              onChange={handleViewModeChange}
              allowCustomerMode={policy.allowCustomerMode}
            />
            
            {!isPOSMode && (
              <ActionMenu 
                config={activeState} 
                avgMonthly={avgMonthlyNet} 
                onLoadConfig={handleLoadConfig} 
              />
            )}
          </div>
        </div>
      </header>

      {/* POS Mode Indicator */}
      {isPOSMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            POS-Modus aktiv – Schnellverkauf
          </span>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <main className="flex-1 container mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 max-w-screen-2xl flex flex-col min-h-0">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Accordion Sections with sticky footer */}
          <div className={cn(
            "flex-1 min-w-0 flex flex-col",
            !isMobile && "max-w-4xl"
          )}>
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              <Accordion 
                type="multiple" 
                value={openSections}
                onValueChange={setOpenSections}
                className="space-y-3"
              >
                {/* Hardware Section */}
                <AccordionItem value="hardware" className={cn(
                  "border rounded-xl overflow-hidden transition-opacity",
                  !openSections.includes("hardware") && "opacity-60 hover:opacity-100"
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        option1.hardware.ekNet > 0 || option1.hardware.name === "KEINE HARDWARE" 
                          ? "bg-primary/10" 
                          : "bg-muted/50"
                      )}>
                        <Smartphone className={cn(
                          "w-4 h-4",
                          option1.hardware.ekNet > 0 || option1.hardware.name === "KEINE HARDWARE"
                            ? "text-primary" 
                            : "text-muted-foreground/50"
                        )} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Hardware</p>
                        <p className="text-xs text-muted-foreground/70">
                          {getStepSummary("hardware", { hardware: option1.hardware })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <HardwareStep
                      value={activeState.hardware}
                      onChange={(hardware) => setActiveState({ ...activeState, hardware })}
                      onHardwareSelected={() => {
                        // Auto-collapse hardware and open mobile
                        setOpenSections(prev => {
                          const without = prev.filter(s => s !== "hardware");
                          return without.includes("mobile") ? without : [...without, "mobile"];
                        });
                      }}
                      viewMode={viewMode}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Mobile Section */}
                <AccordionItem value="mobile" className={cn(
                  "border rounded-xl overflow-hidden transition-opacity",
                  !openSections.includes("mobile") && "opacity-60 hover:opacity-100"
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        option1.mobile.tariffId ? "bg-primary/10" : "bg-muted/50"
                      )}>
                        <Signal className={cn(
                          "w-4 h-4",
                          option1.mobile.tariffId ? "text-primary" : "text-muted-foreground/50"
                        )} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Mobilfunk</p>
                          {option1.mobile.quantity > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {option1.mobile.quantity}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          {getStepSummary("mobile", { mobile: option1.mobile })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <MobileStep
                      value={activeState.mobile}
                      onChange={(mobile) => setActiveState({ ...activeState, mobile })}
                      datasetVersion={activeState.meta.datasetVersion}
                      fixedNetEnabled={activeState.fixedNet.enabled}
                      viewMode={viewMode}
                      onTariffSelected={() => {
                        // Auto-collapse mobile and open fixedNet
                        setOpenSections(prev => {
                          const without = prev.filter(s => s !== "mobile");
                          return without.includes("fixedNet") ? without : [...without, "fixedNet"];
                        });
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Fixed Net Section */}
                <AccordionItem value="fixedNet" className={cn(
                  "border rounded-xl overflow-hidden transition-opacity",
                  !openSections.includes("fixedNet") && "opacity-60 hover:opacity-100"
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        option1.fixedNet.enabled ? "bg-emerald-500/10" : "bg-muted/50"
                      )}>
                        <Router className={cn(
                          "w-4 h-4",
                          option1.fixedNet.enabled ? "text-emerald-600" : "text-muted-foreground/50"
                        )} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Festnetz</p>
                        <p className="text-xs text-muted-foreground/70">
                          {getStepSummary("fixedNet", { fixedNet: option1.fixedNet })}
                        </p>
                      </div>
                      {option1.fixedNet.enabled && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          GigaKombi
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <FixedNetStep
                      value={activeState.fixedNet}
                      onChange={(fixedNet) => setActiveState({ ...activeState, fixedNet })}
                      datasetVersion={activeState.meta.datasetVersion}
                      onFixedNetEnabled={() => {
                        // Auto-collapse fixedNet
                        setOpenSections(prev => prev.filter(s => s !== "fixedNet"));
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* GigaKombi Banner */}
              {isGigaKombiEligible && (
                <div className="mt-4">
                  <GigaKombiBanner isEligible={isGigaKombiEligible} />
                </div>
              )}

              {/* Savings Breakdown */}
              {result1.periods.length > 1 && (
                <div className="mt-4">
                  <SavingsBreakdown result={result1} />
                </div>
              )}

              {/* Validation Warnings */}
              {!validation.steps.mobile.valid && (
                <div className="mt-4">
                  <ValidationWarning validation={validation.steps.mobile} />
                </div>
              )}
            </div>

            {/* Sticky Live Calculation Bar - Desktop */}
            {!isMobile && (
              <div className="sticky bottom-0 z-30 -mx-3 sm:-mx-4 lg:-mx-6 mt-auto">
                <LiveCalculationBar
                  result={activeResult}
                  viewMode={viewMode}
                  quantity={activeState.mobile.quantity}
                  sticky
                  compact
                />
              </div>
            )}
          </div>

          {/* Summary Sidebar - Desktop only */}
          {!isMobile && (
            <aside className="w-72 xl:w-80 flex-shrink-0 hidden lg:block">
              <SummarySidebar
                option={option1}
                result={result1}
                viewMode={viewMode}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Mobile Footer with Sticky Price Bar */}
      {isMobile && (
        <footer className="bg-card border-t border-border sticky bottom-0 z-40 shrink-0 pb-safe">
          <LiveCalculationBar
            result={activeResult}
            viewMode={viewMode}
            quantity={activeState.mobile.quantity}
            sticky
            compact
          />
        </footer>
      )}

      {/* AI Consultant */}
      {!isPOSMode && activeState.mobile.tariffId && (
        <AiConsultant config={activeState} result={activeResult} />
      )}
    </div>
  );
}

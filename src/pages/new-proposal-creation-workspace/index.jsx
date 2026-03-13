import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import CostBreakdownTreemap from './components/CostBreakdownTreemap';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';


import { useSaveQueue } from '../../hooks/useSaveQueue';
import { proposalService } from '../../services/proposalService';
import { useToast } from '../../contexts/ToastContext';


import ProposalSidebar from './components/ProposalSidebar';
import ProjectDurationTab from '../proposal-management-dashboard/components/tabs/ProjectDurationTab';
import ModularBuildUpTab from '../proposal-management-dashboard/components/tabs/ModularBuildUpTab';
import CostMarginTab from '../proposal-management-dashboard/components/tabs/CostMarginTab';
import MaterialsLabourTab from '../proposal-management-dashboard/components/tabs/MaterialsLabourTab';
import OverHeadsTab from '../proposal-management-dashboard/components/tabs/OverHeadsTab';
import SiteCostsTab from '../proposal-management-dashboard/components/tabs/SiteCostsTab';
import LogisticsTab from '../proposal-management-dashboard/components/tabs/LogisticsTab';
import CommissionTab from '../proposal-management-dashboard/components/tabs/CommissionTab';
import RevenueCentersTab from '../proposal-management-dashboard/components/tabs/RevenueCentersTab';
import FinancingTab from '../proposal-management-dashboard/components/tabs/FinancingTab';
import RiskTab from '../proposal-management-dashboard/components/tabs/RiskTab';
import PaymentTermsTab from '../proposal-management-dashboard/components/tabs/PaymentTermsTab';
import ProjectDetailsTab from './components/ProjectDetailsTab';


const NewProposalCreationWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast: addToast } = useToast();
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(true);
  const [proposalSidebarCollapsed, setProposalSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('proposal-summary');
  const [autoSaveStatus, setAutoSaveStatus] = useState('unsaved');
  const [lastSaved, setLastSaved] = useState(null);
  const [currentProposalId, setCurrentProposalId] = useState(null);
  const [hasBeenSavedOnce, setHasBeenSavedOnce] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const autoSaveTimerRef = useRef(null);
  // Ref to track autoSaveStatus synchronously — avoids stale closure in handleAutoSave guard
  const autoSaveStatusRef = useRef('unsaved');
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  // Add this block - Missing saveTimeoutRef declaration
  const saveTimeoutRef = useRef(null);
  // Bug 4 FIX: isProposalLoaded becomes true only after the async load useEffect completes.
  // Passed to RevenueCentersTab so it knows when real DB data has settled (works for ALL
  // proposals including new chargeable ones where grandTotal is 0).
  // For new proposals (no proposalId), it starts as true immediately since there is no async load.
  const [isProposalLoaded, setIsProposalLoaded] = useState(() => {
    const navState = (typeof window !== 'undefined' && window.history?.state?.usr) || {};
    const proposalId = navState?.proposalId || sessionStorage.getItem('currentProposalId') || null;
    // New proposal — no async load needed, treat as already loaded
    return !proposalId;
  });
  const [currentVersionNumber, setCurrentVersionNumber] = useState(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [versionChangeNotes, setVersionChangeNotes] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewVersionNumber, setPreviewVersionNumber] = useState(null);

  // Add this block - formData state declaration
  const [formData, setFormData] = useState({
    projectTitle: '',
    proposalTitle: '',
    clientId: '',
    clientName: '',
    projectType: '',
    startDate: '',
    endDate: '',
    baseCost: 0,
    milestones: [],
    modules: [],
    marginPercentage: 0,
    materials: [],
    labour: [],
    estimationModel: 'single-module',
    overheadCalculations: {},
    siteCosts: [],
    logistics: [],
    commission: 0,
    commissionItems: [],
    revenueCenters: { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 },
    financing: {},
    risks: [],
    paymentTerms: {},
    internalValueAddedScope: [],
    marginedSubContractors: [],
    zeroMarginedSupply: [],
    projectName: '',
    clientType: '',
    country: '',
    state: '',
    city: '',
    projectAddress: '',
    targetBudgetPerSqft: '',
    estimatedAreaSqft: '',
    scope: [],
    selectedMapLocation: null,
    design: {},
    procurement: {},
    production: {},
    ft2RateBUA: 0,
  });

  // CRITICAL FIX: Keep a ref that always holds the latest formData
  // so handleManualSave reads the current value even if React state hasn't flushed
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Keep autoSaveStatusRef in sync with autoSaveStatus state
  useEffect(() => {
    autoSaveStatusRef.current = autoSaveStatus;
  }, [autoSaveStatus]);

  // Add this block - proposalTotals state declaration
  const [proposalTotals, setProposalTotals] = useState({
    internalValueAdded: 0,
    marginedSubContractors: 0,
    zeroMarginedSupply: 0,
    materials: 0,
    labour: 0,
    totalOverHead: 0,
    siteCostsTotal: 0,
    logisticsTotal: 0,
    commission: 0,
    finance: 0,
    risk: 0,
    grandTotal: 0
  });

  // Track mounted state for cleanup - Move this BEFORE useSaveQueue
  const isMountedRef = useRef(true);
  // Capture initial navigation state in a ref so it's stable across re-renders
  // and doesn't cause the load useEffect to re-run when getProposalId changes
  const initialNavStateRef = useRef(location?.state || {});

  // Add this block - getProposalId helper function
  const getProposalId = useCallback(() => {
    return currentProposalId || 
      initialNavStateRef?.current?.proposalId || 
      sessionStorage.getItem('currentProposalId') || 
      null;
  }, [currentProposalId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FEATURE FLAG: Save Queue System (non-destructive concurrent save prevention)
  const SAVE_QUEUE_ENABLED = import.meta.env?.VITE_ENABLE_SAVE_QUEUE === 'true';

  // Save Queue Hook - wraps the actual save logic
  const saveQueue = useSaveQueue({
    enabled: SAVE_QUEUE_ENABLED,
    saveFn: async (saveData) => {
      // This is the actual save function that gets queued
      const { proposalId, data } = saveData;
      
      if (proposalId) {
        const { data: updatedProposal, error } = await proposalService?.updateProposal(proposalId, data);
        if (error) {
          // Treat "no rows affected" as a soft warning, not a fatal throw
          // This prevents the platform error handler from crashing
          if (error?.message?.includes('no rows affected')) {
            console.warn('[saveFn] No rows affected — proposal may not exist or RLS blocked update:', error?.message);
            return null;
          }
          throw error;
        }
        return updatedProposal;
      } else {
        const newProposal = await proposalService?.createProposal(data);
        // Update proposal ID after creation
        if (newProposal?.id && isMountedRef?.current) {
          setCurrentProposalId(newProposal?.id);
          sessionStorage.setItem('currentProposalId', newProposal?.id);
        }
        return newProposal;
      }
    },
    maxRetries: 3,
    retryDelay: 1000
  });

  // Load existing proposal data if editing
  useEffect(() => {
    const abortController = new AbortController();

    const loadProposalForEditing = async () => {
      // Use the stable ref for initial nav state to avoid re-triggering on getProposalId changes
      const navState = initialNavStateRef?.current;
      const proposalId = navState?.proposalId ||
        sessionStorage.getItem('currentProposalId') ||
        null;

      // ── PREVIEW MODE: load snapshot from version history preview ──────────
      const previewSnapshot = navState?.previewSnapshot;
      const previewVersionNum = navState?.previewVersionNumber;
      if (previewSnapshot && proposalId) {
        console.log('[ProposalWorkspace] Loading PREVIEW snapshot for V', previewVersionNum);
        setCurrentProposalId(proposalId);
        sessionStorage.setItem('currentProposalId', proposalId);
        const snap = previewSnapshot;
        const loadedFormData = {
          projectTitle: snap?.title || '',
          proposalTitle: snap?.title || '',
          clientId: snap?.client_id || '',
          clientName: snap?.client?.company_name || '',
          projectType: snap?.description || '',
          startDate: snap?.start_date || '',
          endDate: snap?.deadline || '',
          baseCost: snap?.value || 0,
          milestones: Array.isArray(snap?.milestones) ? snap?.milestones : [],
          modules: Array.isArray(snap?.modules) ? snap?.modules : [],
          marginPercentage: snap?.margin_percentage || 0,
          materials: Array.isArray(snap?.materials) ? snap?.materials : [],
          labour: Array.isArray(snap?.labour) ? snap?.labour : [],
          estimationModel: snap?.estimation_model || 'single-module',
          overheadCalculations: (snap?.overheads && !Array.isArray(snap?.overheads)) ? snap?.overheads : {},
          siteCosts: Array.isArray(snap?.site_costs) ? snap?.site_costs : [],
          logistics: Array.isArray(snap?.logistics) ? snap?.logistics : [],
          commission: snap?.commission || 0,
          commissionItems: Array.isArray(snap?.commission_items) ? snap?.commission_items : [],
          revenueCenters: snap?.revenue_centers || { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 },
          financing: snap?.financing || {},
          risks: Array.isArray(snap?.risks) ? snap?.risks : [],
          paymentTerms: snap?.payment_terms || {},
          internalValueAddedScope: Array.isArray(snap?.internal_value_added_scope) ? snap?.internal_value_added_scope : [],
          marginedSubContractors: Array.isArray(snap?.margined_sub_contractors) ? snap?.margined_sub_contractors : [],
          zeroMarginedSupply: Array.isArray(snap?.zero_margined_supply) ? snap?.zero_margined_supply : [],
          projectName: snap?.project_details?.projectName || '',
          clientType: snap?.project_details?.clientType || '',
          country: snap?.project_details?.country || '',
          state: snap?.project_details?.state || '',
          city: snap?.project_details?.city || '',
          projectAddress: snap?.project_details?.projectAddress || '',
          targetBudgetPerSqft: snap?.project_details?.targetBudgetPerSqft || '',
          estimatedAreaSqft: snap?.project_details?.estimatedAreaSqft || '',
          scope: Array.isArray(snap?.project_details?.scope) ? snap?.project_details?.scope : [],
          selectedMapLocation: snap?.project_details?.selectedMapLocation || null,
          design: snap?.project_duration?.design || {},
          procurement: snap?.project_duration?.procurement || {},
          production: snap?.project_duration?.production || {},
          ft2RateBUA: snap?.ft2_rate_bua || 0,
        };
        setFormData(loadedFormData);
        setIsPreviewMode(true);
        setPreviewVersionNumber(previewVersionNum);
        setHasBeenSavedOnce(true);
        setAutoSaveStatus('saved');
        // Load latest version number for the header indicator
        const { data: latestVersionNum } = await proposalService?.getLatestVersionNumber(proposalId);
        if (latestVersionNum > 0) setCurrentVersionNumber(latestVersionNum);
        setIsLoadingProposal(false);
        setIsProposalLoaded(true);
        return;
      }

      // ── RESTORE MODE: load restored snapshot ──────────────────────────────
      const restoredSnapshot = navState?.restoredSnapshot;
      const restoredVersionNum = navState?.restoredVersionNumber;
      if (restoredSnapshot && proposalId) {
        console.log('[ProposalWorkspace] Loading RESTORED snapshot for V', restoredVersionNum);
        setCurrentProposalId(proposalId);
        sessionStorage.setItem('currentProposalId', proposalId);
        const snap = restoredSnapshot;
        const loadedFormData = {
          projectTitle: snap?.title || '',
          proposalTitle: snap?.title || '',
          clientId: snap?.client_id || '',
          clientName: snap?.client?.company_name || '',
          projectType: snap?.description || '',
          startDate: snap?.start_date || '',
          endDate: snap?.deadline || '',
          baseCost: snap?.value || 0,
          milestones: Array.isArray(snap?.milestones) ? snap?.milestones : [],
          modules: Array.isArray(snap?.modules) ? snap?.modules : [],
          marginPercentage: snap?.margin_percentage || 0,
          materials: Array.isArray(snap?.materials) ? snap?.materials : [],
          labour: Array.isArray(snap?.labour) ? snap?.labour : [],
          estimationModel: snap?.estimation_model || 'single-module',
          overheadCalculations: (snap?.overheads && !Array.isArray(snap?.overheads)) ? snap?.overheads : {},
          siteCosts: Array.isArray(snap?.site_costs) ? snap?.site_costs : [],
          logistics: Array.isArray(snap?.logistics) ? snap?.logistics : [],
          commission: snap?.commission || 0,
          commissionItems: Array.isArray(snap?.commission_items) ? snap?.commission_items : [],
          revenueCenters: snap?.revenue_centers || { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 },
          financing: snap?.financing || {},
          risks: Array.isArray(snap?.risks) ? snap?.risks : [],
          paymentTerms: snap?.payment_terms || {},
          internalValueAddedScope: Array.isArray(snap?.internal_value_added_scope) ? snap?.internal_value_added_scope : [],
          marginedSubContractors: Array.isArray(snap?.margined_sub_contractors) ? snap?.margined_sub_contractors : [],
          zeroMarginedSupply: Array.isArray(snap?.zero_margined_supply) ? snap?.zero_margined_supply : [],
          projectName: snap?.project_details?.projectName || '',
          clientType: snap?.project_details?.clientType || '',
          country: snap?.project_details?.country || '',
          state: snap?.project_details?.state || '',
          city: snap?.project_details?.city || '',
          projectAddress: snap?.project_details?.projectAddress || '',
          targetBudgetPerSqft: snap?.project_details?.targetBudgetPerSqft || '',
          estimatedAreaSqft: snap?.project_details?.estimatedAreaSqft || '',
          scope: Array.isArray(snap?.project_details?.scope) ? snap?.project_details?.scope : [],
          selectedMapLocation: snap?.project_details?.selectedMapLocation || null,
          design: snap?.project_duration?.design || {},
          procurement: snap?.project_duration?.procurement || {},
          production: snap?.project_duration?.production || {},
          ft2RateBUA: snap?.ft2_rate_bua || 0,
        };
        setFormData(loadedFormData);
        setIsPreviewMode(false);
        setPreviewVersionNumber(null);
        setHasBeenSavedOnce(true);
        setAutoSaveStatus('unsaved'); // Mark unsaved so user knows to save the restored state
        // Load latest version number
        const { data: latestVersionNum } = await proposalService?.getLatestVersionNumber(proposalId);
        if (latestVersionNum > 0) setCurrentVersionNumber(latestVersionNum);
        setIsLoadingProposal(false);
        setIsProposalLoaded(true);
        addToast({ type: 'info', title: 'Version Restored', message: `V${restoredVersionNum} snapshot loaded. Save to apply changes.` });
        return;
      }

      // ── NORMAL LOAD: fetch from database ──────────────────────────────────
      if (proposalId) {
        setIsLoadingProposal(true);
        try {
          // Check if request was aborted before making the call
          if (abortController?.signal?.aborted) {
            return;
          }
          
          console.log('[ProposalWorkspace] Loading proposal:', proposalId);
          // CRITICAL FIX: Destructure the response properly
          const { data: proposalData, error } = await proposalService?.getProposalById(proposalId);
          
          // Check if request was aborted after fetch
          if (abortController?.signal?.aborted) {
            return;
          }
          
          // CRITICAL FIX: Check for errors
          if (error) {
            console.error('Failed to load proposal:', error);
            return;
          }
          
          if (proposalData) {
            console.log('[ProposalWorkspace] Proposal loaded successfully');
            // CRITICAL FIX: Set the proposal ID immediately
            setCurrentProposalId(proposalData?.id);
            sessionStorage.setItem('currentProposalId', proposalData?.id);
            console.log('Set currentProposalId to:', proposalData?.id);
            
            // Pre-populate form data with existing proposal data
            const loadedFormData = {
              projectTitle: proposalData?.title || '',
              proposalTitle: proposalData?.title || '',
              clientId: proposalData?.client_id || '',
              clientName: proposalData?.client?.company_name || '',
              projectType: proposalData?.description || '',
              startDate: proposalData?.start_date || '',
              endDate: proposalData?.deadline || '',
              baseCost: proposalData?.value || 0,
              milestones: Array.isArray(proposalData?.milestones) ? proposalData?.milestones : [],
              modules: Array.isArray(proposalData?.modules) ? proposalData?.modules : [],
              marginPercentage: proposalData?.margin_percentage || 0,
              materials: Array.isArray(proposalData?.materials) ? proposalData?.materials : [],
              labour: Array.isArray(proposalData?.labour) ? proposalData?.labour : [],
              estimationModel: proposalData?.estimation_model || 'single-module',
              overheadCalculations: (proposalData?.overheads && !Array.isArray(proposalData?.overheads)) ? proposalData?.overheads : {},
              siteCosts: Array.isArray(proposalData?.site_costs) ? proposalData?.site_costs : [],
              logistics: Array.isArray(proposalData?.logistics) ? proposalData?.logistics : [],
              commission: proposalData?.commission || 0,
              commissionItems: Array.isArray(proposalData?.commission_items) ? proposalData?.commission_items : [],
              revenueCenters: proposalData?.revenue_centers || {
                revenueType: 'chargeable',
                chargeableData: {},
                marginPercentages: {},
                totalMarginPercent: 0
              },
              financing: proposalData?.financing || {},
              risks: Array.isArray(proposalData?.risks) ? proposalData?.risks : [],
              paymentTerms: proposalData?.payment_terms || {},
              // Additional Scope fields
              internalValueAddedScope: Array.isArray(proposalData?.internal_value_added_scope) ? proposalData?.internal_value_added_scope : [],
              marginedSubContractors: Array.isArray(proposalData?.margined_sub_contractors) ? proposalData?.margined_sub_contractors : [],
              zeroMarginedSupply: Array.isArray(proposalData?.zero_margined_supply) ? proposalData?.zero_margined_supply : [],
              // Project Details fields
              projectName: proposalData?.project_details?.projectName || '',
              clientType: proposalData?.project_details?.clientType || '',
              country: proposalData?.project_details?.country || '',
              state: proposalData?.project_details?.state || '',
              city: proposalData?.project_details?.city || '',
              projectAddress: proposalData?.project_details?.projectAddress || '',
              targetBudgetPerSqft: proposalData?.project_details?.targetBudgetPerSqft || '',
              estimatedAreaSqft: proposalData?.project_details?.estimatedAreaSqft || '',
              scope: Array.isArray(proposalData?.project_details?.scope) ? proposalData?.project_details?.scope : [],
              selectedMapLocation: proposalData?.project_details?.selectedMapLocation || null,
              // Project Duration fields
              design: proposalData?.project_duration?.design || {},
              procurement: proposalData?.project_duration?.procurement || {},
              production: proposalData?.project_duration?.production || {},
              ft2RateBUA: proposalData?.ft2_rate_bua || 0,
            };
            
            setFormData(loadedFormData);
            setIsPreviewMode(false);
            setPreviewVersionNumber(null);
            
            // Mark as already saved since we're editing existing proposal
            setHasBeenSavedOnce(true);
            setAutoSaveStatus('saved');
            setLastSaved(new Date(proposalData?.updated_at || proposalData?.created_at));

            // Load latest version number
            const { data: latestVersionNum } = await proposalService?.getLatestVersionNumber(proposalId);
            if (latestVersionNum > 0) {
              setCurrentVersionNumber(latestVersionNum);
            }
          }
        } catch (error) {
          // Ignore abort errors - they're expected when component unmounts
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
            return;
          }
          console.error('Failed to load proposal for editing:', error);
          // Show error notification or handle gracefully
        } finally {
          if (!abortController?.signal?.aborted) {
            setIsLoadingProposal(false);
            setIsProposalLoaded(true);
          }
        }
      }
    };

    loadProposalForEditing();
    
    // Cleanup function to abort request if component unmounts
    return () => {
      abortController?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Run only once on mount using the stable initialNavStateRef.
  // getProposalId is intentionally excluded to prevent re-triggering the load
  // when currentProposalId state updates after the initial load.

  // ── PREVIEW NAVIGATION EFFECT ─────────────────────────────────────────────
  // Watches location.state for previewSnapshot changes so that when the user
  // navigates back to the already-mounted workspace from the version history
  // panel, the snapshot is loaded into formData and preview mode is activated.
  // This is separate from the initial load useEffect (which runs once on mount)
  // so it doesn't interfere with the normal load flow.
  useEffect(() => {
    const previewSnapshot = location?.state?.previewSnapshot;
    const previewVersionNum = location?.state?.previewVersionNumber;
    const proposalId = location?.state?.proposalId ||
      currentProposalId ||
      sessionStorage.getItem('currentProposalId');

    if (!previewSnapshot || !proposalId) return;

    console.log('[ProposalWorkspace] Preview navigation detected for V', previewVersionNum);

    const snap = previewSnapshot;
    const loadedFormData = {
      projectTitle: snap?.title || '',
      proposalTitle: snap?.title || '',
      clientId: snap?.client_id || '',
      clientName: snap?.client?.company_name || '',
      projectType: snap?.description || '',
      startDate: snap?.start_date || '',
      endDate: snap?.deadline || '',
      baseCost: snap?.value || 0,
      milestones: Array.isArray(snap?.milestones) ? snap?.milestones : [],
      modules: Array.isArray(snap?.modules) ? snap?.modules : [],
      marginPercentage: snap?.margin_percentage || 0,
      materials: Array.isArray(snap?.materials) ? snap?.materials : [],
      labour: Array.isArray(snap?.labour) ? snap?.labour : [],
      estimationModel: snap?.estimation_model || 'single-module',
      overheadCalculations: (snap?.overheads && !Array.isArray(snap?.overheads)) ? snap?.overheads : {},
      siteCosts: Array.isArray(snap?.site_costs) ? snap?.site_costs : [],
      logistics: Array.isArray(snap?.logistics) ? snap?.logistics : [],
      commission: snap?.commission || 0,
      commissionItems: Array.isArray(snap?.commission_items) ? snap?.commission_items : [],
      revenueCenters: snap?.revenue_centers || { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 },
      financing: snap?.financing || {},
      risks: Array.isArray(snap?.risks) ? snap?.risks : [],
      paymentTerms: snap?.payment_terms || {},
      internalValueAddedScope: Array.isArray(snap?.internal_value_added_scope) ? snap?.internal_value_added_scope : [],
      marginedSubContractors: Array.isArray(snap?.margined_sub_contractors) ? snap?.margined_sub_contractors : [],
      zeroMarginedSupply: Array.isArray(snap?.zero_margined_supply) ? snap?.zero_margined_supply : [],
      projectName: snap?.project_details?.projectName || '',
      clientType: snap?.project_details?.clientType || '',
      country: snap?.project_details?.country || '',
      state: snap?.project_details?.state || '',
      city: snap?.project_details?.city || '',
      projectAddress: snap?.project_details?.projectAddress || '',
      targetBudgetPerSqft: snap?.project_details?.targetBudgetPerSqft || '',
      estimatedAreaSqft: snap?.project_details?.estimatedAreaSqft || '',
      scope: Array.isArray(snap?.project_details?.scope) ? snap?.project_details?.scope : [],
      selectedMapLocation: snap?.project_details?.selectedMapLocation || null,
      design: snap?.project_duration?.design || {},
      procurement: snap?.project_duration?.procurement || {},
      production: snap?.project_duration?.production || {},
      ft2RateBUA: snap?.ft2_rate_bua || 0,
    };

    setCurrentProposalId(proposalId);
    sessionStorage.setItem('currentProposalId', proposalId);
    setFormData(loadedFormData);
    setIsPreviewMode(true);
    setPreviewVersionNumber(previewVersionNum);
    setHasBeenSavedOnce(true);
    setAutoSaveStatus('saved');
    setIsLoadingProposal(false);
    setIsProposalLoaded(true);

    // Fetch latest version number for the header indicator
    proposalService?.getLatestVersionNumber(proposalId)?.then(({ data: latestVersionNum }) => {
      if (latestVersionNum > 0) setCurrentVersionNumber(latestVersionNum);
    });
  }, [location?.state?.previewSnapshot, location?.state?.previewVersionNumber]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Only re-runs when previewSnapshot in navigation state changes.
  // currentProposalId intentionally excluded to avoid re-triggering on state updates.

  // Handle navigation with beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasBeenSavedOnce && autoSaveStatus === 'unsaved') {
        e?.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasBeenSavedOnce, autoSaveStatus]);

  const tabs = [
    { id: 'proposal-summary', label: 'Proposal Summary', icon: 'FileText', shortcut: 'Ctrl+S' },
    { id: 'project-details', label: 'Project Details', icon: 'FileText', shortcut: 'Ctrl+1' },
    { id: 'project-duration', label: 'Project Duration', icon: 'Calendar', shortcut: 'Ctrl+2' },
    { id: 'modular-build-up', label: 'Modular Build up', icon: 'Layers', shortcut: 'Ctrl+3' },
    { id: 'cost-margin', label: 'Additional Scope', icon: 'DollarSign', shortcut: 'Ctrl+4' },
    { id: 'materials-labour', label: 'Materials + Labour', icon: 'Package', shortcut: 'Ctrl+5' },
    { id: 'over-heads', label: 'Over Heads', icon: 'TrendingUp', shortcut: 'Ctrl+6' },
    { id: 'site-costs', label: 'Site Costs', icon: 'MapPin', shortcut: 'Ctrl+7' },
    { id: 'logistics', label: 'Logistics', icon: 'Truck', shortcut: 'Ctrl+8' },
    { id: 'commission', label: 'Commission', icon: 'Percent', shortcut: 'Ctrl+9' },
    { id: 'revenue-centers', label: 'Revenue Centers', icon: 'PieChart', shortcut: 'Ctrl+0' },
    { id: 'financing', label: 'Financing', icon: 'CreditCard', shortcut: 'Ctrl+Shift+1' },
    { id: 'risk', label: 'Risk', icon: 'AlertTriangle', shortcut: 'Ctrl+Shift+2' },
    { id: 'payment-terms', label: 'Payment Terms', icon: 'FileCheck', shortcut: 'Ctrl+Shift+3' }
  ];

  // Calculate progress based on filled fields - defined early so save functions can use it
  const calculateProgress = useCallback(() => {
    const totalFields = 14;
    let filledFields = 0;
    if (formData?.proposalTitle || formData?.projectTitle) filledFields++;
    if (formData?.clientName) filledFields++;
    if (formData?.projectType) filledFields++;
    if (formData?.startDate && formData?.endDate) filledFields++;
    if (formData?.modules?.length > 0) filledFields++;
    if (formData?.baseCost > 0) filledFields++;
    if (formData?.materials?.length > 0 || formData?.labour?.length > 0) filledFields++;
    if (formData?.overheadCalculations && Object.keys(formData?.overheadCalculations)?.length > 0) filledFields++;
    if (formData?.siteCosts?.length > 0) filledFields++;
    if (formData?.logistics?.length > 0) filledFields++;
    if (formData?.commission > 0) filledFields++;
    if (formData?.revenueCenters && typeof formData?.revenueCenters === 'object' && !Array.isArray(formData?.revenueCenters)) filledFields++;
    if (formData?.financing && Object.keys(formData?.financing)?.length > 0) filledFields++;
    if (formData?.risks?.length > 0) filledFields++;
    return Math.round((filledFields / totalFields) * 100);
  }, [formData]);

  // Calculate Chargeable Value - defined early so save functions can use it
  const calculateChargeableValue = useCallback(() => {
    const savedGrandTotal = formData?.revenueCenters?.grandTotal;
    if (savedGrandTotal !== undefined && savedGrandTotal !== null) {
      return savedGrandTotal;
    }
    return 0;
  }, [formData?.revenueCenters?.grandTotal]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    // CRITICAL FIX: Use getProposalId helper
    const proposalIdToUse = getProposalId();
    
    if (!proposalIdToUse) {
      console.warn('No proposal ID found for auto-save. Skipping auto-save.');
      return;
    }

    // Guard: skip if a save is already in progress to prevent concurrent saves
    // Read autoSaveStatus from ref to avoid stale closure
    if (autoSaveStatusRef?.current === 'saving') {
      console.warn('[AutoSave] Skipping — save already in progress');
      return;
    }

    // CRITICAL FIX: Read from ref to get latest formData (avoids stale closure)
    const currentFormData = formDataRef?.current;

    try {
      setAutoSaveStatus('saving');
      const { data: updatedProposal, error } = await proposalService?.updateProposal(proposalIdToUse, {
        title: currentFormData?.proposalTitle || currentFormData?.projectTitle || 'Untitled Proposal',
        projectName: currentFormData?.proposalTitle || currentFormData?.projectTitle || 'Untitled Proposal',
        description: currentFormData?.projectType || '',
        value: calculateChargeableValue() ?? 0,
        estimatedTotalBudget: calculateChargeableValue() ?? 0,
        progress: calculateProgress() ?? 0,
        deadline: currentFormData?.endDate || null,
        startDate: currentFormData?.startDate || null,
        status: 'Draft',
        clientId: currentFormData?.clientId || null,
        // Detailed proposal data - CRITICAL: Include all fields to prevent data loss
        modules: currentFormData?.modules || [],
        milestones: currentFormData?.milestones || [],
        materials: currentFormData?.materials || [],
        labour: currentFormData?.labour || [],
        estimationModel: currentFormData?.estimationModel || 'single-module',
        overheads: currentFormData?.overheadCalculations || {},
        siteCosts: currentFormData?.siteCosts || [],
        logistics: currentFormData?.logistics || [],
        commission: currentFormData?.commission || 0,
        commissionItems: currentFormData?.commissionItems || [],
        marginPercentage: currentFormData?.marginPercentage || 0,
        revenueCenters: (() => {
          const rc = currentFormData?.revenueCenters;
          if (rc && typeof rc === 'object' && !Array.isArray(rc)) return rc;
          return {
            revenueType: 'chargeable',
            chargeableData: {},
            marginPercentages: {},
            totalMarginPercent: 0
          };
        })(),
        financing: currentFormData?.financing || {},
        risks: currentFormData?.risks || [],
        paymentTerms: currentFormData?.paymentTerms || {},
        internalValueAddedScope: currentFormData?.internalValueAddedScope || [],
        marginedSubContractors: currentFormData?.marginedSubContractors || [],
        zeroMarginedSupply: currentFormData?.zeroMarginedSupply || [],
        projectDetails: {
          clientId: currentFormData?.clientId || '',
          projectName: currentFormData?.projectName || '',
          projectType: currentFormData?.projectType || '',
          clientType: currentFormData?.clientType || '',
          country: currentFormData?.country || '',
          state: currentFormData?.state || '',
          city: currentFormData?.city || '',
          projectAddress: currentFormData?.projectAddress || '',
          targetBudgetPerSqft: currentFormData?.targetBudgetPerSqft || '',
          estimatedAreaSqft: currentFormData?.estimatedAreaSqft || '',
          scope: currentFormData?.scope || [],
          selectedMapLocation: currentFormData?.selectedMapLocation || null
        },
        projectDuration: {
          design: currentFormData?.design || {},
          procurement: currentFormData?.procurement || {},
          production: currentFormData?.production || {}
        },
        ft2RateBUA: currentFormData?.ft2RateBUA || 0,
      });
      
      if (error) {
        throw error;
      }
      
      if (!currentProposalId && proposalIdToUse) {
        setCurrentProposalId(proposalIdToUse);
        sessionStorage.setItem('currentProposalId', proposalIdToUse);
      }
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('unsaved');
      // Only show error toast for non-transient errors (not network blips)
      const isTransientNetworkError =
        error?.message?.toLowerCase()?.includes('failed to fetch') ||
        error?.message?.toLowerCase()?.includes('network error') ||
        error?.message?.toLowerCase()?.includes('fetch') ||
        error?.name === 'TypeError';
      if (!isTransientNetworkError) {
        addToast({
          type: 'error',
          title: 'Auto-save Failed',
          message: error?.message || 'Failed to auto-save proposal. Please save manually.',
        });
      }
    }
  }, [getProposalId, currentProposalId, addToast, calculateChargeableValue, calculateProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save functionality - starts after first manual save
  // CRITICAL FIX: Use a ref to store the latest handleAutoSave so the timer effect
  // doesn't need handleAutoSave in its dependency array (which would reset the timer on every change)
  const handleAutoSaveRef = useRef(handleAutoSave);
  useEffect(() => {
    handleAutoSaveRef.current = handleAutoSave;
  }, [handleAutoSave]);

  useEffect(() => {
    if (!hasBeenSavedOnce) return;
    if (autoSaveStatus !== 'unsaved') return;

    // Clear existing timer
    if (autoSaveTimerRef?.current) {
      clearTimeout(autoSaveTimerRef?.current);
    }

    // Set new timer for 30 seconds (reduced from 60s for better UX)
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSaveRef?.current();
    }, 30000);

    return () => {
      if (autoSaveTimerRef?.current) {
        clearTimeout(autoSaveTimerRef?.current);
      }
    };
  }, [formData, hasBeenSavedOnce, autoSaveStatus]);
  // ^ formData in deps is intentional: we want the timer to reset when data changes,
  // but handleAutoSave is NOT in deps (accessed via ref) so the timer doesn't reset
  // due to callback recreation — only due to actual data changes.

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.ctrlKey) {
        const tabIndex = parseInt(e?.key) - 1;
        if (tabIndex >= 0 && tabIndex < tabs?.length) {
          e?.preventDefault();
          setActiveTab(tabs?.[tabIndex]?.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle form data changes with collaboration broadcast
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => {
      const oldValue = prev?.[field];
      
      // Deep comparison for objects and arrays
      const hasChanged = typeof value === 'object' && value !== null
        ? JSON.stringify(oldValue) !== JSON.stringify(value)
        : oldValue !== value;
      
      if (!hasChanged) {
        return prev; // No change, return previous state unchanged
      }
      
      // Mark as unsaved to trigger auto-save
      setAutoSaveStatus('unsaved');

      let nextState;
      // CRITICAL FIX: Keep proposalTitle and projectTitle in sync
      // Some tabs write to 'projectTitle', save functions read 'proposalTitle' — keep both identical
      if (field === 'projectTitle') {
        nextState = { ...prev, projectTitle: value, proposalTitle: value };
      } else if (field === 'proposalTitle') {
        nextState = { ...prev, proposalTitle: value, projectTitle: value };
      } else {
        nextState = { ...prev, [field]: value };
      }

      // FIX: Sync formDataRef synchronously so handleManualSave always reads
      // the latest value even if the React re-render hasn't flushed yet.
      // This is critical for OverHeadsTab which calls onChange just before Save.
      formDataRef.current = nextState;

      return nextState;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add this block - handleChange function that wraps handleFormChange
  const handleChange = useCallback((field, value) => {
    handleFormChange(field, value);
  }, [handleFormChange]);


  const handleManualSave = useCallback(async () => {
    // CRITICAL FIX: Use getProposalId helper
    const proposalIdToUse = getProposalId();

    // Prevent save while loading
    if (isLoadingProposal) {
      console.warn('Cannot save while proposal is loading');
      addToast({ type: 'warning', title: 'Please Wait', message: 'Proposal is still loading. Please wait a moment and try again.' });
      return;
    }

    // CRITICAL FIX: Read from ref to get latest formData (avoids stale closure / timing issue)
    const currentFormData = formDataRef?.current;

    try {
      setAutoSaveStatus('saving');
      
      // Clear any existing timeout
      if (saveTimeoutRef?.current) {
        clearTimeout(saveTimeoutRef?.current);
      }

      // Check if any meaningful data has been entered
      const hasData = 
        currentFormData?.projectName || 
        currentFormData?.proposalTitle ||
        currentFormData?.projectTitle ||
        currentFormData?.clientId || 
        currentFormData?.projectType ||
        currentFormData?.country ||
        currentFormData?.city ||
        currentFormData?.modules?.length > 0 ||
        currentFormData?.materials?.length > 0 ||
        currentFormData?.logistics?.length > 0 ||
        currentFormData?.commissionItems?.length > 0;

      // Log for debugging - don't prevent save
      if (!hasData) {
        console.warn('Saving proposal with minimal data');
      }

      // CRITICAL FIX: Resolve title from proposalTitle OR projectTitle (whichever is set)
      const resolvedTitle = currentFormData?.proposalTitle || currentFormData?.projectTitle || 'Untitled Proposal';

      const saveData = {
        proposalId: proposalIdToUse,
        data: {
          title: resolvedTitle,
          projectName: resolvedTitle,
          description: currentFormData?.projectType || '',
          value: calculateChargeableValue() ?? 0,
          estimatedTotalBudget: calculateChargeableValue() ?? 0,
          progress: calculateProgress() ?? 0,
          deadline: currentFormData?.endDate || null,
          startDate: currentFormData?.startDate || null,
          status: 'Draft',
          clientId: currentFormData?.clientId || null,
          ft2RateBUA: currentFormData?.ft2RateBUA || 0,
          // Detailed proposal data
          modules: currentFormData?.modules || [],
          milestones: currentFormData?.milestones || [],
          materials: currentFormData?.materials || [],
          labour: currentFormData?.labour || [],
          estimationModel: currentFormData?.estimationModel || 'single-module',
          overheads: currentFormData?.overheadCalculations || {},
          siteCosts: currentFormData?.siteCosts || [],
          logistics: currentFormData?.logistics || [],
          commission: currentFormData?.commission || 0,
          commissionItems: currentFormData?.commissionItems || [],
          marginPercentage: currentFormData?.marginPercentage || 0,
          revenueCenters: (() => {
            const rc = currentFormData?.revenueCenters;
            if (rc && typeof rc === 'object' && !Array.isArray(rc)) return rc;
            return { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 };
          })(),
          financing: currentFormData?.financing || {},
          risks: currentFormData?.risks || [],
          paymentTerms: currentFormData?.paymentTerms || {},
          internalValueAddedScope: currentFormData?.internalValueAddedScope || [],
          marginedSubContractors: currentFormData?.marginedSubContractors || [],
          zeroMarginedSupply: currentFormData?.zeroMarginedSupply || [],
          projectDetails: {
            clientId: currentFormData?.clientId || '',
            projectName: currentFormData?.projectName || '',
            projectType: currentFormData?.projectType || '',
            clientType: currentFormData?.clientType || '',
            country: currentFormData?.country || '',
            state: currentFormData?.state || '',
            city: currentFormData?.city || '',
            projectAddress: currentFormData?.projectAddress || '',
            targetBudgetPerSqft: currentFormData?.targetBudgetPerSqft || '',
            estimatedAreaSqft: currentFormData?.estimatedAreaSqft || '',
            scope: currentFormData?.scope || [],
            selectedMapLocation: currentFormData?.selectedMapLocation || null
          },
          projectDuration: {
            design: currentFormData?.design || {},
            procurement: currentFormData?.procurement || {},
            production: currentFormData?.production || {}
          }
        }
      };

      if (proposalIdToUse) {
        // Use saveQueue if enabled, otherwise direct save
        if (SAVE_QUEUE_ENABLED) {
          await saveQueue?.enqueueSave(saveData, {
            priority: 'high',
            onSuccess: () => {
              if (isMountedRef?.current) {
                clearTimeout(saveTimeoutRef?.current);
                setAutoSaveStatus('saved');
                setLastSaved(new Date());
                setHasBeenSavedOnce(true);
                if (!currentProposalId && proposalIdToUse) {
                  setCurrentProposalId(proposalIdToUse);
                  sessionStorage.setItem('currentProposalId', proposalIdToUse);
                }
                addToast({ type: 'success', title: 'Proposal Saved', message: 'Your proposal has been saved successfully.' });
              }
            },
            onError: (error) => {
              if (isMountedRef?.current) {
                clearTimeout(saveTimeoutRef?.current);
                console.error('Manual save failed:', error);
                setAutoSaveStatus('error');
                addToast({ type: 'error', title: 'Manual Save Failed', message: error?.message || 'Failed to save proposal manually.' });
              }
            }
          });
        } else {
          // Direct save without queue
          const { data: updatedProposal, error } = await proposalService?.updateProposal(proposalIdToUse, saveData?.data);
          
          if (error) {
            // Treat "no rows affected" as a soft warning, not a fatal throw
            if (error?.message?.includes('no rows affected')) {
              console.warn('[directSave] No rows affected — proposal may not exist or RLS blocked update:', error?.message);
            } else {
              throw error;
            }
          }
          
          if (isMountedRef?.current) {
            clearTimeout(saveTimeoutRef?.current);
            setAutoSaveStatus('saved');
            setLastSaved(new Date());
            setHasBeenSavedOnce(true);
            if (!currentProposalId && proposalIdToUse) {
              setCurrentProposalId(proposalIdToUse);
              sessionStorage.setItem('currentProposalId', proposalIdToUse);
            }
            addToast({ type: 'success', title: 'Proposal Saved', message: 'Your proposal has been saved successfully.' });
          }
        }
      } else {
        // Create new proposal
        const newProposal = await proposalService?.createProposal({
          title: resolvedTitle,
          projectName: resolvedTitle,
          description: currentFormData?.projectType || '',
          value: calculateChargeableValue() ?? 0,
          estimatedTotalBudget: calculateChargeableValue() ?? 0,
          progress: calculateProgress() ?? 0,
          deadline: currentFormData?.endDate || null,
          startDate: currentFormData?.startDate || null,
          status: 'Draft',
          clientId: currentFormData?.clientId || null,
          ft2RateBUA: currentFormData?.ft2RateBUA || 0,
          // Detailed proposal data
          modules: currentFormData?.modules || [],
          milestones: currentFormData?.milestones || [],
          materials: currentFormData?.materials || [],
          labour: currentFormData?.labour || [],
          estimationModel: currentFormData?.estimationModel || 'single-module',
          overheads: currentFormData?.overheadCalculations || {},
          siteCosts: currentFormData?.siteCosts || [],
          logistics: currentFormData?.logistics || [],
          commission: currentFormData?.commission || 0,
          commissionItems: currentFormData?.commissionItems || [],
          marginPercentage: currentFormData?.marginPercentage || 0,
          revenueCenters: (() => {
            const rc = currentFormData?.revenueCenters;
            if (rc && typeof rc === 'object' && !Array.isArray(rc)) return rc;
            return { revenueType: 'chargeable', chargeableData: {}, marginPercentages: {}, totalMarginPercent: 0 };
          })(),
          financing: currentFormData?.financing || {},
          risks: currentFormData?.risks || [],
          paymentTerms: currentFormData?.paymentTerms || {},
          // Additional Scope data
          internalValueAddedScope: currentFormData?.internalValueAddedScope || [],
          marginedSubContractors: currentFormData?.marginedSubContractors || [],
          zeroMarginedSupply: currentFormData?.zeroMarginedSupply || [],
          // Project Details data
          projectDetails: {
            clientId: currentFormData?.clientId || '',
            projectName: currentFormData?.projectName || '',
            projectType: currentFormData?.projectType || '',
            clientType: currentFormData?.clientType || '',
            country: currentFormData?.country || '',
            state: currentFormData?.state || '',
            city: currentFormData?.city || '',
            projectAddress: currentFormData?.projectAddress || '',
            targetBudgetPerSqft: currentFormData?.targetBudgetPerSqft || '',
            estimatedAreaSqft: currentFormData?.estimatedAreaSqft || '',
            scope: currentFormData?.scope || [],
            selectedMapLocation: currentFormData?.selectedMapLocation || null
          },
          // Project Duration data
          projectDuration: {
            design: currentFormData?.design || {},
            procurement: currentFormData?.procurement || {},
            production: currentFormData?.production || {}
          }
        });
        
        if (isMountedRef?.current && newProposal?.id) {
          setCurrentProposalId(newProposal?.id);
          sessionStorage.setItem('currentProposalId', newProposal?.id);
          console.log('New proposal created with ID:', newProposal?.id);
        } else if (!newProposal?.id) {
          console.error('createProposal returned no ID. newProposal value:', newProposal);
          throw new Error('Proposal could not be created. Please check your connection and try again.');
        }
      }

      if (isMountedRef?.current) {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        setHasBeenSavedOnce(true);
        addToast({ type: 'success', title: 'Proposal Saved', message: 'Your proposal has been saved successfully.' });
      }
    } catch (error) {
      console.error('Save failed — full error object:', error);
      console.error('Save failed — message:', error?.message);
      console.error('Save failed — code:', error?.code);
      console.error('Save failed — details:', error?.details);
      console.error('Save failed — hint:', error?.hint);
      if (isMountedRef?.current) {
        setAutoSaveStatus('unsaved');
        addToast({ type: 'error', title: 'Save Failed', message: error?.message || 'Failed to save proposal. Please try again.' });
      }
    }
  }, [getProposalId, isLoadingProposal, SAVE_QUEUE_ENABLED, saveQueue, currentProposalId, isMountedRef, addToast, calculateChargeableValue, calculateProgress]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ formData intentionally excluded — reads from formDataRef.current to avoid stale closure

  // Calculate Revenue Centers Grand Total (Chargeable)
  const calculateRevenueCentersGrandTotal = useCallback(() => {
    console.log('=== calculateRevenueCentersGrandTotal START ===');
    
    // Get revenue type to determine if we should include Materials and Labour
    const revenueType = formData?.revenueCenters?.revenueType || 'chargeable';
    console.log('Revenue Type:', revenueType);

    // Calculate Module Configuration - Budget Value
    const budgetValue = (formData?.modules || [])?.reduce((sum, module) => {
      const quantity = parseFloat(module?.quantity) || 0;
      const budgetValue = parseFloat(module?.budgetValue) || 0;
      const moduleBudget = quantity * budgetValue;
      console.log('Module:', { name: module?.name, quantity, budgetValue, moduleBudget });
      return sum + moduleBudget;
    }, 0);
    console.log('Budget Value (Module Configuration):', budgetValue);

    // Calculate Internal Value-Added Scope Total
    const internalValueAddedTotal = (formData?.internalValueAddedScope || [])?.reduce((sum, item) => {
      const total = parseFloat(item?.productionCost) || 0;
      console.log('Internal Value-Added:', { description: item?.description, total });
      return sum + total;
    }, 0);
    console.log('Internal Value-Added Total:', internalValueAddedTotal);

    const siteCostTotal = (formData?.siteCosts || [])?.reduce((sum, item) => {
      const total = parseFloat(item?.total) || 0;
      console.log('Site Cost:', { description: item?.description, total });
      return sum + total;
    }, 0);
    console.log('Site Cost Total:', siteCostTotal);

    // CRITICAL FIX: Only calculate Materials Total and Labour Total when revenueType is 'cost-margin'
    // Chargeable mode = sale price-based (exclude cost items)
    // Cost + Margin mode = cost price-based (include cost items)
    let materialsTotal = 0;
    let labourTotal = 0;

    if (revenueType === 'cost-margin') {
      // Fix Materials Total - Use Project Mod Total formula: ($ / Ft² / W Total) × totalAreaFt2
      materialsTotal = (() => {
        // Get total area from Modular Build Up (in Ft²)
        const modules = formData?.modules || [];
        const totalAreaFt2 = modules?.reduce((sum, m) => {
          const quantity = parseFloat(m?.quantity) || 0;
          const areaFt2 = parseFloat(m?.areaFeet) || 0;
          const moduleArea = quantity * areaFt2;
          console.log('Module Area:', { name: m?.name, quantity, areaFt2, moduleArea });
          return sum + moduleArea;
        }, 0);
        console.log('Total Area (Ft²):', totalAreaFt2);

        // Calculate $ / Ft² / W Total (sum of all costWastePSQF)
        const materials = formData?.materials || [];
        const costPerSqFtTotal = materials?.reduce((sum, item) => sum + (parseFloat(item?.costWastePSQF) || 0), 0);
        console.log('Cost Per Sq Ft Total ($ / Ft² / W Total):', costPerSqFtTotal);

        // Project Mod Total = costPerSqFtTotal × totalAreaFt2
        const projectModTotal = costPerSqFtTotal * totalAreaFt2;
        console.log('Materials Total (Project Mod Total = costPerSqFtTotal × totalAreaFt2):', projectModTotal);
        return projectModTotal;
      })();

      // Add Labour Total using Project Mod Total formula: (Labour Total ÷ smallestModuleAreaFt2) × totalAreaFt2
      labourTotal = (() => {
        const labourRawTotal = (formData?.labour || [])?.reduce((sum, item) => {
          const total = parseFloat(item?.total) || 0;
          return sum + total;
        }, 0);
        const categoryPriority = ['ppvc-module', 'floor-cassettes', 'roof-cassettes', 'roof-modules-flat', 'roof-module-pitched', 'roof-module-hybrid', 'panelized-module', 'kit-of-parts'];
        const modules = formData?.modules || [];
        const totalAreaFt2 = modules?.reduce((sum, m) => {
          const quantity = parseFloat(m?.quantity) || 0;
          const areaFt2 = parseFloat(m?.areaFeet) || 0;
          return sum + (quantity * areaFt2);
        }, 0);
        let smallestModuleAreaFt2 = 0;
        for (const category of categoryPriority) {
          const categoryModules = modules?.filter(m => m?.category === category);
          if (categoryModules?.length > 0) {
            const smallestModule = categoryModules?.reduce((min, module) => {
              const currentAreaFt2 = parseFloat(module?.areaFeet) || 0;
              const minAreaFt2 = parseFloat(min?.areaFeet) || 0;
              return currentAreaFt2 < minAreaFt2 ? module : min;
            }, categoryModules?.[0]);
            smallestModuleAreaFt2 = parseFloat(smallestModule?.areaFeet) || 0;
            break;
          }
        }
        const labourCostPSQF = smallestModuleAreaFt2 > 0 ? labourRawTotal / smallestModuleAreaFt2 : 0;
        const projectModTotal = labourCostPSQF * totalAreaFt2;
        console.log('Labour Total (Project Mod Total):', projectModTotal, '= (', labourRawTotal, '/', smallestModuleAreaFt2, ') ×', totalAreaFt2);
        return projectModTotal;
      })();
      console.log('Labour Total (Project Mod Total):', labourTotal);
    } else {
      console.log('Chargeable mode: Excluding Materials Total and Labour Total');
    }

    const manufacturingTotal = budgetValue + internalValueAddedTotal + siteCostTotal + materialsTotal + labourTotal;
    console.log('Manufacturing Total:', manufacturingTotal, '=', budgetValue, '+', internalValueAddedTotal, '+', siteCostTotal, '+', materialsTotal, '+', labourTotal);

    // Calculate Sub Contracted Total (from Margined Sub-Contractors)
    const marginedSubContractorsTotal = (formData?.marginedSubContractors || [])?.reduce((sum, item) => {
      const totalCost = parseFloat(item?.totalCost) || 0;
      console.log('Margined Sub-Contractor:', { description: item?.description, totalCost });
      return sum + totalCost;
    }, 0);
    console.log('Margined Sub-Contractors Total:', marginedSubContractorsTotal);

    const subContractedTotal = marginedSubContractorsTotal;
    console.log('Sub Contracted Total:', subContractedTotal);

    // Calculate Zero Rate Total (from Zero Margined Supply + Total Logistics)
    const zeroMarginedTotal = (formData?.zeroMarginedSupply || [])?.reduce((sum, item) => {
      return sum + (parseFloat(item?.totalCost) || 0);
    }, 0);
    console.log('Zero Margined Supply Total:', zeroMarginedTotal);

    const logisticsTotal = (formData?.logistics || [])?.length > 0
      ? (parseFloat(formData?.logistics?.[0]?.totalLogistics) || 0)
      : 0;
    console.log('Logistics Total:', logisticsTotal);

    const zeroRateTotal = zeroMarginedTotal + logisticsTotal;
    console.log('Zero Rate Total:', zeroRateTotal, '=', zeroMarginedTotal, '+', logisticsTotal);

    // CRITICAL FIX: Return ONLY Manufacturing + Sub Contracted + Zero Rate
    // This should equal $8,957,261.04 (the Grand Total shown in Revenue Centers tab)
    const grandTotal = manufacturingTotal + subContractedTotal + zeroRateTotal;
    console.log('GRAND TOTAL (Manufacturing + Sub Contracted + Zero Rate):', grandTotal);
    console.log('  Manufacturing:', manufacturingTotal);
    console.log('  Sub Contracted:', subContractedTotal);
    console.log('  Zero Rate:', zeroRateTotal);
    console.log('=== calculateRevenueCentersGrandTotal END ===');
    
    return grandTotal;
  }, [formData?.modules, formData?.internalValueAddedScope, formData?.siteCosts, formData?.materials, formData?.labour, formData?.marginedSubContractors, formData?.zeroMarginedSupply, formData?.logistics, formData?.revenueCenters?.revenueType, formData?.revenueCenters?.grandTotal]);

  // Calculate Chargeable Value WITHOUT Zero Rate (NEW FORMULA)
  const calculateChargeableValueWithoutZeroRate = useCallback(() => {
    // NEW FORMULA: (Chargeable + Zero Rated) - (Zero Margined Supply) - (Total Logistics)
    
    // Get Chargeable + Zero Rated value (from calculateChargeableValue which changes based on Revenue Center selection)
    const chargeableWithZeroRated = calculateChargeableValue();
    
    // Calculate Zero Margined Supply Total
    const zeroMarginedTotal = (formData?.zeroMarginedSupply || [])?.reduce((sum, item) => {
      return sum + (parseFloat(item?.totalCost) || 0);
    }, 0);
    
    // Calculate Total Logistics
    const logisticsTotal = (formData?.logistics || [])?.length > 0
      ? (parseFloat(formData?.logistics?.[0]?.totalLogistics) || 0)
      : 0;
    
    // Apply new formula: (Chargeable + Zero Rated) - (Zero Margined Supply) - (Total Logistics)
    return chargeableWithZeroRated - zeroMarginedTotal - logisticsTotal;
  }, [calculateChargeableValue, formData?.zeroMarginedSupply, formData?.logistics]);

  // Calculate Margin Value (Chargeable Value - Cost Centers Total)
  const calculateMarginValue = useCallback(() => {
    const chargeableValue = calculateChargeableValue();
    // Right box: (Chargeable + Zero Rated) - Cost Centers (including ALL logistics)
    const costCentersTotal = proposalTotals?.grandTotal || 0;
    return chargeableValue - costCentersTotal;
  }, [calculateChargeableValue, proposalTotals]);

  // Calculate Margin Value for Left Box (Chargeable WITHOUT Zero Rate - Cost Centers Total excluding shipping and zero margined)
  const calculateMarginValueLeftBox = useCallback(() => {
    const chargeableWithoutZeroRate = calculateChargeableValueWithoutZeroRate();

    // Cost Centers Total excluding Logistics only (as per user requirement)
    // Left box: Chargeable - Cost Centers (excluding logistics)
    const costCentersExcludingLogistics =
      proposalTotals?.internalValueAdded +
      proposalTotals?.marginedSubContractors +
      proposalTotals?.zeroMarginedSupply +
      proposalTotals?.materials +
      proposalTotals?.labour +
      proposalTotals?.totalOverHead +
      proposalTotals?.siteCostsTotal +
      proposalTotals?.commission +
      proposalTotals?.finance +
      proposalTotals?.risk;

    return chargeableWithoutZeroRate - costCentersExcludingLogistics;
  }, [calculateChargeableValueWithoutZeroRate, proposalTotals]);

  // Calculate Margin Percentage (Margin Value / Chargeable Value) * 100
  const calculateMarginPercentage = useCallback(() => {
    const chargeableValue = calculateChargeableValue();
    const marginValue = calculateMarginValue();
    
    if (chargeableValue === 0) return 0;
    
    return (marginValue / chargeableValue) * 100;
  }, [calculateChargeableValue, calculateMarginValue]);

  // Format large numbers to millions (e.g., $1.5M)
  const formatToMillions = (value) => {
    if (value === 0) return '0.00';
    const millions = value / 1000000;
    return millions?.toFixed(2)?.replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
  };

  // Format numbers with comma separators (e.g., 1,000,000.00)
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0.00';
    return value?.toFixed(2)?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Calculate Module Configuration Total Areas
  const calculateModuleTotalAreas = useCallback(() => {
    const modules = formData?.modules || [];
    
    const totalM2 = modules?.reduce((sum, m) => {
      const quantity = parseFloat(m?.quantity) || 0;
      const areaM2 = parseFloat(m?.areaMM) || parseFloat(m?.areaFeet) * 0.092903 || 0;
      return sum + quantity * areaM2;
    }, 0);

    const totalFt2 = modules?.reduce((sum, m) => {
      const quantity = parseFloat(m?.quantity) || 0;
      const areaFt2 = parseFloat(m?.areaFeet) || parseFloat(m?.areaMM) / 0.092903 || 0;
      return sum + quantity * areaFt2;
    }, 0);

    return { m2: totalM2, ft2: totalFt2 };
  }, [formData?.modules]);

  // Calculate M² Rate BUA and Ft² Rate BUA
  const calculateRateBUA = useCallback(() => {
    // FIX: Use Chargeable + Zero Rated (from Proposal Summary) as numerator for Ft² Rate BUA
    const chargeablePlusZeroRated = calculateChargeableValue();
    const areas = calculateModuleTotalAreas();

    const ft2RateBUA = areas?.ft2 > 0 ? chargeablePlusZeroRated / areas?.ft2 : 0;
    // M² Rate BUA = Ft² Rate BUA × 10.7639 (unit conversion: 1 m² = 10.7639 ft²)
    const m2RateBUA = ft2RateBUA * 10.7639;

    return { m2RateBUA, ft2RateBUA };
  }, [calculateModuleTotalAreas, calculateChargeableValue, formData?.revenueCenters?.grandTotal]);

  // CRITICAL FIX: Memoize the rate calculation result to prevent recalculation loops
  const rateBUA = useMemo(() => calculateRateBUA(), [calculateRateBUA]);

  // NEW: Auto-save Ft² Rate BUA to formData whenever it changes
  useEffect(() => {
    const currentFt2RateBUA = formData?.ft2RateBUA;
    const newFt2RateBUA = rateBUA?.ft2RateBUA;

    // Guard: skip if either value is NaN or undefined to prevent infinite loop
    if (newFt2RateBUA === undefined || newFt2RateBUA === null || isNaN(newFt2RateBUA)) {
      return;
    }

    // Guard: skip if values are numerically equal (handles floating point)
    const current = parseFloat(currentFt2RateBUA) || 0;
    const next = parseFloat(newFt2RateBUA) || 0;
    if (Math.abs(current - next) < 0.0001) {
      return;
    }

    console.log('[ProposalWorkspace] Saving Ft² Rate BUA:', newFt2RateBUA);
    handleFormChange('ft2RateBUA', newFt2RateBUA);
  }, [rateBUA?.ft2RateBUA, formData?.ft2RateBUA, handleFormChange]);

  // Prepare treemap data from proposal totals (reactive to every formData change)
  const treemapData = useMemo(() => {
    return [
      { name: 'Internal Value-Added Scope', value: proposalTotals?.internalValueAdded },
      { name: 'Margined Sub-Contractors', value: proposalTotals?.marginedSubContractors },
      { name: 'Zero Margined Supply', value: proposalTotals?.zeroMarginedSupply },
      { name: 'Materials', value: proposalTotals?.materials },
      { name: 'Labor', value: proposalTotals?.labour },
      { name: 'Total Over Head', value: proposalTotals?.totalOverHead },
      { name: 'Site Cost Total', value: proposalTotals?.siteCostsTotal },
      { name: 'Total Logistics', value: proposalTotals?.logisticsTotal },
      { name: 'Commission', value: proposalTotals?.commission },
      { name: 'Finance', value: proposalTotals?.finance },
      { name: 'Risk', value: proposalTotals?.risk }
    ]?.filter(item => item?.value > 0);
  }, [
    proposalTotals?.internalValueAdded,
    proposalTotals?.marginedSubContractors,
    proposalTotals?.zeroMarginedSupply,
    proposalTotals?.materials,
    proposalTotals?.labour,
    proposalTotals?.totalOverHead,
    proposalTotals?.siteCostsTotal,
    proposalTotals?.logisticsTotal,
    proposalTotals?.commission,
    proposalTotals?.finance,
    proposalTotals?.risk
  ]);

  // Add this block - Calculate proposal totals whenever formData changes
  useEffect(() => {
    const calculateTotals = () => {
      // Calculate Internal Value-Added Total
      const internalValueAdded = (formData?.internalValueAddedScope || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.productionCost) || 0);
      }, 0);

      // Calculate Margined Sub-Contractors Total
      const marginedSubContractors = (formData?.marginedSubContractors || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.totalCost) || 0);
      }, 0);

      // Calculate Zero Margined Supply Total
      const zeroMarginedSupply = (formData?.zeroMarginedSupply || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.totalCost) || 0);
      }, 0);

      // Calculate Materials Total (Project Mod Total)
      const materials = (() => {
        const modules = formData?.modules || [];
        const totalAreaFt2 = modules?.reduce((sum, m) => {
          const quantity = parseFloat(m?.quantity) || 0;
          const areaFt2 = parseFloat(m?.areaFeet) || 0;
          return sum + (quantity * areaFt2);
        }, 0);
        const materialsList = formData?.materials || [];
        const costPerSqFtTotal = materialsList?.reduce((sum, item) => sum + (parseFloat(item?.costWastePSQF) || 0), 0);
        return costPerSqFtTotal * totalAreaFt2;
      })();

      // Calculate Labour Total (Project Mod Total)
      const labour = (() => {
        const labourRawTotal = (formData?.labour || [])?.reduce((sum, item) => {
          return sum + (parseFloat(item?.total) || 0);
        }, 0);
        const modules = formData?.modules || [];
        const totalAreaFt2 = modules?.reduce((sum, m) => {
          const quantity = parseFloat(m?.quantity) || 0;
          const areaFt2 = parseFloat(m?.areaFeet) || 0;
          return sum + (quantity * areaFt2);
        }, 0);
        const categoryPriority = ['ppvc-module', 'floor-cassettes', 'roof-cassettes', 'roof-modules-flat', 'roof-module-pitched', 'roof-module-hybrid', 'panelized-module', 'kit-of-parts'];
        let smallestModuleAreaFt2 = 0;
        for (const category of categoryPriority) {
          const categoryModules = modules?.filter(m => m?.category === category);
          if (categoryModules?.length > 0) {
            const smallestModule = categoryModules?.reduce((min, module) => {
              const currentAreaFt2 = parseFloat(module?.areaFeet) || 0;
              const minAreaFt2 = parseFloat(min?.areaFeet) || 0;
              return currentAreaFt2 < minAreaFt2 ? module : min;
            }, categoryModules?.[0]);
            smallestModuleAreaFt2 = parseFloat(smallestModule?.areaFeet) || 0;
            break;
          }
        }
        const labourCostPSQF = smallestModuleAreaFt2 > 0 ? labourRawTotal / smallestModuleAreaFt2 : 0;
        return labourCostPSQF * totalAreaFt2;
      })();

      // Calculate Total Over Head
      const totalOverHead = Object.values(formData?.overheadCalculations || {})?.reduce((sum, val) => {
        const duration = parseFloat(val?.duration) || 0;
        const overHeadPerWeek = parseFloat(val?.overHeadPerWeek) || 0;
        const allocation = parseFloat(val?.allocation) || 0;
        const contingency = parseFloat(val?.contingency) || 0;
        const sectionTotal = duration * overHeadPerWeek * (allocation / 100) * (1 + contingency / 100);
        return sum + sectionTotal;
      }, 0);

      // Calculate Site Costs Total
      const siteCostsTotal = (formData?.siteCosts || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.total) || 0);
      }, 0);

      // Calculate Logistics Total
      const logisticsTotal = (formData?.logistics || [])?.length > 0
        ? (parseFloat(formData?.logistics?.[0]?.totalLogistics) || 0)
        : 0;

      // Calculate Commission
      const commission = (formData?.commissionItems || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.total) || 0);
      }, 0);

      // Calculate Finance
      const finance = parseFloat(formData?.financing?.totalFinanceCost) || 0;

      // Calculate Risk
      const risk = (formData?.risks || [])?.reduce((sum, item) => {
        return sum + (parseFloat(item?.cost) || 0);
      }, 0);

      // Calculate Grand Total
      const grandTotal = internalValueAdded + marginedSubContractors + zeroMarginedSupply + 
                        materials + labour + totalOverHead + siteCostsTotal + logisticsTotal + 
                        commission + finance + risk;

      setProposalTotals({
        internalValueAdded,
        marginedSubContractors,
        zeroMarginedSupply,
        materials,
        labour,
        totalOverHead,
        siteCostsTotal,
        logisticsTotal,
        commission,
        finance,
        risk,
        grandTotal
      });
    };

    calculateTotals();
  }, [formData]);

  const renderTabContent = () => {
    return (
      <>
        {/* Proposal Summary Tab */}
        <div style={{ display: activeTab === 'proposal-summary' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Proposal Summary</h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Overview of your proposal details</p>
            </div>
            
            {/* Top Section: M2/Ft2 Rate Boxes */}
            <div className="bg-white dark:bg-card border border-border dark:border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl text-orange-500 dark:text-accent">$</div>
                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">M² Rate BUA</p>
                    <p className="text-2xl font-bold dark:text-foreground">${formatNumber(rateBUA?.m2RateBUA)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Ft² Rate BUA</p>
                    <p className="text-2xl font-bold dark:text-foreground">${formatNumber(rateBUA?.ft2RateBUA)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row: Chargeable and Chargeable + Zero Rated Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chargeable Box */}
              <div className="bg-white dark:bg-card border border-border dark:border-border rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl text-orange-500 dark:text-accent">$</div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Chargeable</p>
                      <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateChargeableValueWithoutZeroRate())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Margin</p>
                      <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateMarginValueLeftBox())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">%</p>
                      <p className="text-2xl font-bold dark:text-foreground">{(() => {
                        const chargeableValue = calculateChargeableValueWithoutZeroRate();
                        const marginValue = calculateMarginValueLeftBox();
                        if (chargeableValue === 0) return '0.00';
                        return ((marginValue / chargeableValue) * 100)?.toFixed(2);
                      })()}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chargeable + Zero Rated Box */}
              <div className="bg-white dark:bg-card border border-border dark:border-border rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl text-orange-500 dark:text-accent">$</div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Chargeable + Zero Rated</p>
                      <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateChargeableValue())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Margin</p>
                      <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateMarginValue())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">%</p>
                      <p className="text-2xl font-bold dark:text-foreground">{calculateMarginPercentage()?.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Centers and Visualization Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cost Centers - 1/3 width (4 columns) */}
              <div className="lg:col-span-4 bg-white dark:bg-card border border-border dark:border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-foreground">Cost Centers</h3>
                <div className="space-y-3 overflow-x-auto">
                  {[
                    { label: 'Internal Value-Added Scope', value: proposalTotals?.internalValueAdded },
                    { label: 'Margined Sub-Contractors', value: proposalTotals?.marginedSubContractors },
                    { label: 'Zero Margined Supply', value: proposalTotals?.zeroMarginedSupply },
                    { label: 'Materials', value: proposalTotals?.materials },
                    { label: 'Labor', value: proposalTotals?.labour },
                    { label: 'Total Over Head', value: proposalTotals?.totalOverHead },
                    { label: 'Site Cost Total', value: proposalTotals?.siteCostsTotal },
                    { label: 'Total Logistics', value: proposalTotals?.logisticsTotal },
                    { label: 'Commission', value: proposalTotals?.commission },
                    { label: 'Finance', value: proposalTotals?.finance },
                    { label: 'Risk', value: proposalTotals?.risk }
                  ]?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-border last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-muted-foreground whitespace-nowrap" style={{ minWidth: '180px' }}>{item?.label}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-foreground whitespace-nowrap">${formatNumber(item?.value || 0)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t-2 border-gray-300 dark:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold dark:text-foreground">Total</span>
                    <span className="text-2xl font-bold dark:text-foreground">${formatNumber(proposalTotals?.grandTotal || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Visualization - 2/3 width (8 columns) */}
              <div className="lg:col-span-8 bg-white dark:bg-card border border-border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 dark:text-foreground">Cost Centers Visualization</h3>
                <div className="w-full">
                  <CostBreakdownTreemap
                    data={treemapData}
                    grandTotal={proposalTotals?.grandTotal || 0}
                    formatNumber={formatNumber}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Project Details Tab */}
        <div style={{ display: activeTab === 'project-details' ? 'block' : 'none' }}>
          <ProjectDetailsTab formData={formData} onChange={handleChange} />
        </div>
        {/* Project Duration Tab */}
        <div style={{ display: activeTab === 'project-duration' ? 'block' : 'none' }}>
          <ProjectDurationTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Modular Build Up Tab */}
        <div style={{ display: activeTab === 'modular-build-up' ? 'block' : 'none' }}>
          <ModularBuildUpTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Cost + Margin Tab */}
        <div style={{ display: activeTab === 'cost-margin' ? 'block' : 'none' }}>
          <CostMarginTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Materials + Labour Tab */}
        <div style={{ display: activeTab === 'materials-labour' ? 'block' : 'none' }}>
          <MaterialsLabourTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Over Heads Tab */}
        <div style={{ display: activeTab === 'over-heads' ? 'block' : 'none' }}>
          <OverHeadsTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Site Costs Tab */}
        <div style={{ display: activeTab === 'site-costs' ? 'block' : 'none' }}>
          <SiteCostsTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Logistics Tab */}
        <div style={{ display: activeTab === 'logistics' ? 'block' : 'none' }}>
          <LogisticsTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Commission Tab */}
        <div style={{ display: activeTab === 'commission' ? 'block' : 'none' }}>
          <CommissionTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Revenue Centers Tab */}
        <div style={{ display: activeTab === 'revenue-centers' ? 'block' : 'none' }}>
          <RevenueCentersTab formData={formData} onChange={handleChange} errors={{}} isProposalLoaded={isProposalLoaded} />
        </div>
        {/* Financing Tab */}
        <div style={{ display: activeTab === 'financing' ? 'block' : 'none' }}>
          <FinancingTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Risk Tab */}
        <div style={{ display: activeTab === 'risk' ? 'block' : 'none' }}>
          <RiskTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
        {/* Payment Terms Tab */}
        <div style={{ display: activeTab === 'payment-terms' ? 'block' : 'none' }}>
          <PaymentTermsTab formData={formData} onChange={handleChange} errors={{}} />
        </div>
      </>
    );
  };

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Loader';
      case 'saved':
        return 'Check';
      default:
        return 'AlertCircle';
    }
  };

  const getAutoSaveText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved at ${lastSaved?.toLocaleTimeString()}`;
      default:
        return 'Unsaved changes';
    }
  };

  // Navigation warning handlers
  const handleNavigationWarningProceed = useCallback(() => {
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  const handleNavigationWarningClose = useCallback(() => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  }, []);

  const handleNavigationWarningSave = useCallback(async () => {
    await handleManualSave();
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate, handleManualSave]);

  const handleCreateNewVersion = async () => {
    const proposalId = getProposalId();
    if (!proposalId) {
      addToast?.({ type: 'warning', title: 'Save Required', message: 'Please save the proposal first before creating a version.' });
      return;
    }
    setIsCreatingVersion(true);
    try {
      // BUG FIX: Build snapshot from current formData (in-memory state), NOT from DB.
      // Fetching from DB would miss any unsaved changes made since the last save.
      const resolvedTitle = formData?.proposalTitle || formData?.projectTitle || '';
      const snapshot = {
        title: resolvedTitle,
        project_name: resolvedTitle,
        description: formData?.projectType || '',
        value: String(calculateChargeableValue() ?? 0),
        client_id: formData?.clientId || null,
        modules: formData?.modules || [],
        milestones: formData?.milestones || [],
        materials: formData?.materials || [],
        labour: formData?.labour || [],
        estimation_model: formData?.estimationModel || 'single-module',
        overheads: formData?.overheadCalculations || {},
        site_costs: formData?.siteCosts || [],
        logistics: formData?.logistics || [],
        commission: formData?.commission || 0,
        commission_items: formData?.commissionItems || [],
        revenue_centers: formData?.revenueCenters || {},
        financing: formData?.financing || {},
        risks: formData?.risks || [],
        payment_terms: formData?.paymentTerms || {},
        internal_value_added_scope: formData?.internalValueAddedScope || [],
        margined_sub_contractors: formData?.marginedSubContractors || [],
        zero_margined_supply: formData?.zeroMarginedSupply || [],
        ft2_rate_bua: formData?.ft2RateBUA || 0,
        start_date: formData?.startDate || null,
        deadline: formData?.endDate || null,
        project_details: {
          projectName: formData?.projectName || '',
          projectType: formData?.projectType || '',
          clientType: formData?.clientType || '',
          country: formData?.country || '',
          state: formData?.state || '',
          city: formData?.city || '',
          projectAddress: formData?.projectAddress || '',
          targetBudgetPerSqft: formData?.targetBudgetPerSqft || '',
          estimatedAreaSqft: formData?.estimatedAreaSqft || '',
          scope: formData?.scope || [],
          selectedMapLocation: formData?.selectedMapLocation || null
        },
        project_duration: {
          design: formData?.design || {},
          procurement: formData?.procurement || {},
          production: formData?.production || {}
        },
      };

      const proposalValue = calculateChargeableValue() || proposalTotals?.grandTotal || 0;

      const { data, error } = await proposalService?.createVersion(proposalId, snapshot, {
        versionLabel: versionLabel || `Version ${(currentVersionNumber || 0) + 1}`,
        changeNotes: versionChangeNotes,
        versionStatus: 'draft',
        proposalValue,
      });

      if (error) {
        addToast?.({ type: 'error', title: 'Version Failed', message: 'Failed to create version.' });
      } else {
        // BUG FIX: Fetch the actual version number from DB instead of incrementing locally
        const { data: latestVersionNum } = await proposalService?.getLatestVersionNumber(proposalId);
        const newVersionNum = latestVersionNum || data?.version_number || (currentVersionNumber || 0) + 1;
        setCurrentVersionNumber(newVersionNum);
        addToast?.({ type: 'success', title: 'Version Created', message: `Version ${newVersionNum} saved successfully.` });
        setShowVersionModal(false);
        setVersionLabel('');
        setVersionChangeNotes('');
        setIsPreviewMode(false);
        setPreviewVersionNumber(null);
      }
    } catch (err) {
      addToast?.({ type: 'error', title: 'Version Failed', message: 'Failed to create version.' });
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleOpenVersionHistory = () => {
    const proposalId = getProposalId();
    navigate('/proposal-version-history-panel', {
      state: {
        proposalId,
        proposalTitle: formData?.proposalTitle || 'Proposal',
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>New Proposal Creation Workspace - Proposal Management System</title>
        <meta name="description" content="Create comprehensive proposals with multi-tab workflow" />
      </Helmet>
      <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
        {/* Main Sidebar */}
        <Sidebar collapsed={mainSidebarCollapsed} onToggleCollapse={() => setMainSidebarCollapsed(!mainSidebarCollapsed)} />

        {/* Main Content Area */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            mainSidebarCollapsed ? 'ml-[68px]' : 'ml-[204px]'
          }`}
        >
          {/* Top Header with Breadcrumb */}
          <div className="bg-card dark:bg-card border-b border-border dark:border-border px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => navigate('/proposal-management-dashboard')}
                  className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-smooth flex items-center gap-1"
                >
                  <Icon name="FileText" size={16} />
                  <span>Proposals</span>
                </button>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground dark:text-muted-foreground" />
                <span className="text-foreground dark:text-foreground font-medium">Create New</span>
                {isPreviewMode && previewVersionNumber ? (
                  <>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold border border-yellow-400/30">
                      <Icon name="Eye" size={11} />
                      Previewing V{previewVersionNumber}
                    </span>
                    <button
                      onClick={() => {
                        const proposalId = getProposalId();
                        navigate('/new-proposal-creation-workspace', { state: { proposalId } });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                      Exit Preview
                    </button>
                  </>
                ) : currentVersionNumber > 0 ? (
                  <>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#436958]/10 text-[#436958] text-xs font-semibold">
                      <Icon name="GitBranch" size={11} />
                      V{currentVersionNumber}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Auto-save Status & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <Icon
                    name={getAutoSaveIcon()}
                    size={16}
                    className={autoSaveStatus === 'saving' ? 'animate-spin' : ''}
                  />
                  <span>{getAutoSaveText()}</span>
                </div>

                {/* Version History Button */}
                {getProposalId() && (
                  <button
                    onClick={handleOpenVersionHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="View Version History"
                  >
                    <Icon name="History" size={14} />
                    History
                  </button>
                )}

                {/* Create Version Button */}
                {getProposalId() && (
                  <button
                    onClick={() => setShowVersionModal(true)}
                    disabled={isCreatingVersion}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#436958] text-[#436958] hover:bg-[#436958]/10 transition-colors disabled:opacity-60"
                    title="Create New Version"
                  >
                    <Icon name="GitBranch" size={14} />
                    New Version
                  </button>
                )}

                {isPreviewMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const proposalId = getProposalId();
                      navigate('/new-proposal-creation-workspace', { state: { proposalId } });
                    }}
                    iconName="ArrowLeft"
                    iconPosition="left"
                    iconSize={16}
                  >
                    Back to Workspace
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    iconName="Save"
                    iconPosition="left"
                    iconSize={16}
                    disabled={autoSaveStatus === 'saving'}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Proposal Tools (25%) */}
            <ProposalSidebar
              collapsed={proposalSidebarCollapsed}
              onToggle={setProposalSidebarCollapsed}
              formData={formData}
              onChange={handleChange}
            />

            {/* Main Content Area with Left Tab Navigation */}
            <div className="flex-1 flex overflow-hidden bg-background dark:bg-background">
              {/* Left Vertical Tab Navigation */}
              <div className="bg-card dark:bg-card border-r border-border dark:border-border w-64 flex flex-col overflow-y-auto">
                <div className="flex flex-col p-2">
                  {tabs?.map((tab, index) => (
                    <React.Fragment key={tab?.id}>
                      <button
                        onClick={() => setActiveTab(tab?.id)}
                        className={`flex items-center gap-3 px-4 py-3 font-caption font-medium text-sm border-l-2 transition-smooth group relative text-left ${
                          activeTab === tab?.id
                            ? 'border-[#436958] text-[#436958] dark:text-accent bg-[#436958]/5 dark:bg-accent/10' : 'border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted'
                        }`}
                      >
                        <Icon name={tab?.icon} size={18} />
                        <div className="flex-1">
                          <span className="block">{tab?.label}</span>
                        </div>
                      </button>
                      {index < tabs?.length - 1 && (
                        <div className="h-px bg-border my-1 mx-2" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Integration Status Indicators */}
                <div className="mt-auto border-t border-border p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>CRM Synced</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Doc Gen Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Warning Modal */}
        {showNavigationWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Icon name="AlertTriangle" size={24} className="text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3">Unsaved Changes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You are about to exit this window. Do you want to save your changes before leaving?
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigationWarningProceed}
                      >
                        Don't Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigationWarningClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleNavigationWarningSave}
                        iconName="Save"
                        iconPosition="left"
                        iconSize={16}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Version Modal */}
        {showVersionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon name="GitBranch" size={18} className="text-[#436958]" />
                  <h3 className="text-base font-semibold text-foreground">Create New Version</h3>
                </div>
                <button onClick={() => setShowVersionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Version Label</label>
                  <input
                    type="text"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e?.target?.value)}
                    placeholder={`e.g. Version ${(currentVersionNumber || 0) + 1} — Revised Scope`}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Change Notes</label>
                  <textarea
                    value={versionChangeNotes}
                    onChange={(e) => setVersionChangeNotes(e?.target?.value)}
                    placeholder="Describe what changed in this version..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowVersionModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNewVersion}
                    disabled={isCreatingVersion}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreatingVersion ? (
                      <>
                        <Icon name="Loader2" size={14} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Icon name="Plus" size={14} />
                        Create Version
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewProposalCreationWorkspace;
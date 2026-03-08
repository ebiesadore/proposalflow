import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import CostBreakdownTreemap from './components/CostBreakdownTreemap';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

import { useProposalRealtime } from '../../hooks/useProposalRealtime';
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
  const { addToast } = useToast();
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
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Track mounted state for cleanup - Move this BEFORE useSaveQueue
  const isMountedRef = useRef(true);
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
        if (error) throw error;
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

  // CRITICAL FIX: Helper function to get proposal ID from multiple sources
  const getProposalId = useCallback(() => {
    // Priority order:
    // 1. currentProposalId state
    // 2. location.state.proposalId
    // 3. sessionStorage (for page refreshes)
    if (currentProposalId) {
      return currentProposalId;
    }
    
    if (location?.state?.proposalId) {
      return location?.state?.proposalId;
    }

const sessionProposalId = sessionStorage.getItem('currentProposalId');
    if (sessionProposalId && 
        sessionProposalId !== 'null' && 
        sessionProposalId !== 'undefined' && 
        sessionProposalId !== '') {
      return sessionProposalId;
    }

    return null;
  }, [currentProposalId, location?.state?.proposalId]);

  // CRITICAL FIX: Persist proposal ID to sessionStorage whenever it changes
  useEffect(() => {
    const proposalId = getProposalId();
    if (proposalId) {
      sessionStorage.setItem('currentProposalId', proposalId);
      // Ensure currentProposalId state is set
      if (currentProposalId !== proposalId) {
        setCurrentProposalId(proposalId);
      }
    }
  }, [currentProposalId, location?.state?.proposalId, getProposalId]);

  // CRITICAL FIX: Clear sessionStorage when component unmounts or navigating away
  useEffect(() => {
    return () => {
      // Only clear if we're actually leaving the workspace
      if (!window.location?.pathname?.includes('new-proposal-creation-workspace')) {
        sessionStorage.removeItem('currentProposalId');
      }
    };
  }, []);

  // Fetch current proposal data
  const { currentProposal } = useProposalRealtime(currentProposalId);


  const [formData, setFormData] = useState({
    // Project Details
    projectTitle: '',
    clientId: '',
    clientName: '',
    projectType: '',
    
    // Project Duration
    startDate: '',
    endDate: '',
    milestones: [],
    
    // Modular Build Up
    modules: [],
    
    // Cost + Margin
    baseCost: 0,
    marginPercentage: 0,
    
    // Materials + Labour
    materials: [],
    labour: [],
    estimationModel: 'single-module', // Add estimation model to formData
    
    // Over Heads
    overheads: [],
    
    // Site Costs
    siteCosts: [],
    
    // Logistics
    logistics: [],
    
    // Commission
    commission: 0,
    commissionItems: [],
    
    // Revenue Centers
    revenueCenters: {
      revenueType: 'chargeable',
      chargeableData: {},
      marginPercentages: {},
      totalMarginPercent: 0
    },
    
    // Financing
    financing: {},
    
    // Risk
    risks: [],
    
    // Payment Terms
    paymentTerms: {},
    
    // Additional Scope
    internalValueAddedScope: [],
    marginedSubContractors: [],
    zeroMarginedSupply: [],
    ft2RateBUA: 0 // NEW: Add ft2RateBUA to formData
  });

  // Calculate proposal totals from formData
  const proposalTotals = useMemo(() => {
    const internalValueAdded = (formData?.internalValueAddedScope || [])?.reduce((sum, item) => sum + (parseFloat(item?.totalCost) || 0), 0);
    const marginedSubContractors = (formData?.marginedSubContractors || [])?.reduce((sum, item) => sum + (parseFloat(item?.totalCost) || 0), 0);
    const zeroMarginedSupply = (formData?.zeroMarginedSupply || [])?.reduce((sum, item) => sum + (parseFloat(item?.totalCost) || 0), 0);
    
    // Calculate materials total
    const modules = formData?.modules || [];
    const totalAreaFt2 = modules?.reduce((sum, m) => {
      const quantity = parseFloat(m?.quantity) || 0;
      const areaFt2 = parseFloat(m?.areaFeet) || 0;
      return sum + (quantity * areaFt2);
    }, 0);
    const materials = formData?.materials || [];
    const costPerSqFtTotal = materials?.reduce((sum, item) => sum + (parseFloat(item?.costWastePSQF) || 0), 0);
    let materialsTotal = costPerSqFtTotal * totalAreaFt2;
    
    const labour = (formData?.labour || [])?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);
    const totalOverHead = (formData?.overheads || [])?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);
    const siteCostsTotal = (formData?.siteCosts || [])?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);
    const logisticsTotal = (formData?.logistics || [])?.length > 0 ? (parseFloat(formData?.logistics?.[0]?.totalLogistics) || 0) : 0;
    const commission = formData?.commission || 0;
    const finance = formData?.financing?.total || 0;
    const risk = (formData?.risks || [])?.reduce((sum, item) => sum + (parseFloat(item?.cost) || 0), 0);
    
    const grandTotal = internalValueAdded + marginedSubContractors + zeroMarginedSupply + materialsTotal + labour + totalOverHead + siteCostsTotal + logisticsTotal + commission + finance + risk;
    
    return {
      internalValueAdded,
      marginedSubContractors,
      zeroMarginedSupply,
      materials: materialsTotal,
      labour,
      totalOverHead,
      siteCostsTotal,
      logisticsTotal,
      commission,
      finance,
      risk,
      grandTotal
    };
  }, [formData?.internalValueAddedScope, formData?.marginedSubContractors, formData?.zeroMarginedSupply, formData?.modules, formData?.materials, formData?.labour, formData?.overheads, formData?.siteCosts, formData?.logistics, formData?.commission, formData?.financing, formData?.risks]);

  // Load existing proposal data if editing
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadProposalForEditing = async () => {
      // CRITICAL FIX: Use getProposalId helper
      const proposalId = getProposalId();
      
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
              clientId: proposalData?.client_id || '',
              clientName: proposalData?.client?.company_name || '',
              projectType: proposalData?.description || '',
              startDate: proposalData?.start_date || '',
              endDate: proposalData?.deadline || '',
              baseCost: proposalData?.value || 0,
              milestones: proposalData?.milestones || [],
              modules: proposalData?.modules || [],
              marginPercentage: proposalData?.margin_percentage || 0,
              materials: proposalData?.materials || [],
              labour: proposalData?.labour || [],
              estimationModel: proposalData?.estimation_model || 'single-module', // Restore estimation model
              overheadCalculations: proposalData?.overheads || {},
              siteCosts: proposalData?.site_costs || [],
              logistics: proposalData?.logistics || [],
              commission: proposalData?.commission || 0,
              commissionItems: proposalData?.commission_items || [],
              revenueCenters: proposalData?.revenue_centers || {
                revenueType: 'chargeable',
                chargeableData: {},
                marginPercentages: {},
                totalMarginPercent: 0
              },
              financing: proposalData?.financing || {},
              risks: proposalData?.risks || [],
              paymentTerms: proposalData?.payment_terms || {},
              // Additional Scope fields
              internalValueAddedScope: proposalData?.internal_value_added_scope || [],
              marginedSubContractors: proposalData?.margined_sub_contractors || [],
              zeroMarginedSupply: proposalData?.zero_margined_supply || [],
              // Project Details fields
              projectName: proposalData?.project_details?.projectName || '',
              clientType: proposalData?.project_details?.clientType || '',
              country: proposalData?.project_details?.country || '',
              state: proposalData?.project_details?.state || '',
              city: proposalData?.project_details?.city || '',
              projectAddress: proposalData?.project_details?.projectAddress || '',
              targetBudgetPerSqft: proposalData?.project_details?.targetBudgetPerSqft || '',
              estimatedAreaSqft: proposalData?.project_details?.estimatedAreaSqft || '',
              scope: proposalData?.project_details?.scope || [],
              selectedMapLocation: proposalData?.project_details?.selectedMapLocation || null,
              // Project Duration fields
              design: proposalData?.project_duration?.design || {},
              procurement: proposalData?.project_duration?.procurement || {},
              production: proposalData?.project_duration?.production || {}
            };
            
            setFormData(loadedFormData);
            
            // Mark as already saved since we're editing existing proposal
            setHasBeenSavedOnce(true);
            setAutoSaveStatus('saved');
            setLastSaved(new Date(proposalData?.updated_at || proposalData?.created_at));
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
          }
        }
      }
    };

    loadProposalForEditing();
    
    // Cleanup function to abort request if component unmounts
    return () => {
      abortController?.abort();
    };
  }, [location?.state?.proposalId, getProposalId]);

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
    if (formData?.projectTitle) filledFields++;
    if (formData?.clientName) filledFields++;
    if (formData?.projectType) filledFields++;
    if (formData?.startDate && formData?.endDate) filledFields++;
    if (formData?.modules?.length > 0) filledFields++;
    if (formData?.baseCost > 0) filledFields++;
    if (formData?.materials?.length > 0 || formData?.labour?.length > 0) filledFields++;
    if (formData?.overheads?.length > 0) filledFields++;
    if (formData?.siteCosts?.length > 0) filledFields++;
    if (formData?.logistics?.length > 0) filledFields++;
    if (formData?.commission > 0) filledFields++;
    if (formData?.revenueCenters?.length > 0) filledFields++;
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

    try {
      setAutoSaveStatus('saving');
      const { data: updatedProposal, error } = await proposalService?.updateProposal(proposalIdToUse, {
        title: formData?.projectTitle || 'Untitled Proposal',
        projectName: formData?.projectTitle || 'Untitled Proposal',
        description: formData?.projectType || '',
        value: calculateChargeableValue() ?? 0,
        estimatedTotalBudget: calculateChargeableValue() ?? 0,
        progress: calculateProgress() ?? 0,
        deadline: formData?.endDate || null,
        startDate: formData?.startDate || null,
        status: 'Draft',
        clientId: formData?.clientId || null,
        // Detailed proposal data - CRITICAL: Include all fields to prevent data loss
        modules: formData?.modules || [],
        milestones: formData?.milestones || [],
        materials: formData?.materials || [],
        labour: formData?.labour || [],
        estimationModel: formData?.estimationModel || 'single-module', // Save estimation model
        overheads: formData?.overheadCalculations || {},
        siteCosts: formData?.siteCosts || [],
        logistics: formData?.logistics || [],
        commission: formData?.commission || 0,
        commissionItems: formData?.commissionItems || [],
        marginPercentage: formData?.marginPercentage || 0,
        revenueCenters: (() => {
          const rc = formData?.revenueCenters;
          // CRITICAL FIX: Ensure revenueCenters is always an object, never an array
          if (rc && typeof rc === 'object' && !Array.isArray(rc)) {
            return rc;
          }
          return {
            revenueType: 'chargeable',
            chargeableData: {},
            marginPercentages: {},
            totalMarginPercent: 0
          };
        })(),
        financing: formData?.financing || {},
        risks: formData?.risks || [],
        paymentTerms: formData?.paymentTerms || {},
        // Additional Scope data
        internalValueAddedScope: formData?.internalValueAddedScope || [],
        marginedSubContractors: formData?.marginedSubContractors || [],
        zeroMarginedSupply: formData?.zeroMarginedSupply || [],
        // Project Details data
        projectDetails: {
          clientId: formData?.clientId || '',
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
        // Project Duration data
        projectDuration: {
          design: formData?.design || {},
          procurement: formData?.procurement || {},
          production: formData?.production || {}
        }
      });
      
      if (error) {
        throw error;
      }
      
      // CRITICAL FIX: Ensure currentProposalId and sessionStorage are set
      if (!currentProposalId && proposalIdToUse) {
        setCurrentProposalId(proposalIdToUse);
        sessionStorage.setItem('currentProposalId', proposalIdToUse);
      }
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('unsaved');
      addToast({
        type: 'error',
        title: 'Auto-save Failed',
        message: error?.message || 'Failed to auto-save proposal. Please save manually.',
      });
    }
  }, [getProposalId, formData, currentProposalId, addToast, calculateChargeableValue, calculateProgress]);

  // Auto-save functionality - starts after first manual save
  useEffect(() => {
    if (hasBeenSavedOnce && autoSaveStatus === 'unsaved') {
      // Clear existing timer
      if (autoSaveTimerRef?.current) {
        clearTimeout(autoSaveTimerRef?.current);
      }

      // Set new timer for 60 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 60000); // 60 seconds
    }

    return () => {
      if (autoSaveTimerRef?.current) {
        clearTimeout(autoSaveTimerRef?.current);
      }
    };
  }, [formData, hasBeenSavedOnce, autoSaveStatus, handleAutoSave]);

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
      
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

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
      return;
    }

    try {
      setAutoSaveStatus('saving');
      
      // Clear any existing timeout
      if (saveTimeoutRef?.current) {
        clearTimeout(saveTimeoutRef?.current);
      }

      // Check if any meaningful data has been entered
      const hasData = 
        formData?.projectName || 
        formData?.clientId || 
        formData?.projectType ||
        formData?.country ||
        formData?.city ||
        formData?.modules?.length > 0 ||
        formData?.materials?.length > 0 ||
        formData?.logistics?.length > 0 ||
        formData?.commissionItems?.length > 0;

      // Log for debugging - don't prevent save
      if (!hasData) {
        console.warn('Saving proposal with minimal data');
      }

      const saveData = {
        proposalId: proposalIdToUse,
        data: {
          title: formData?.projectTitle || 'Untitled Proposal',
          projectName: formData?.projectTitle || 'Untitled Proposal',
          description: formData?.projectType || '',
          value: calculateChargeableValue() ?? 0,
          estimatedTotalBudget: calculateChargeableValue() ?? 0,
          progress: calculateProgress() ?? 0,
          deadline: formData?.endDate || null,
          startDate: formData?.startDate || null,
          status: 'Draft',
          clientId: formData?.clientId || null,
          ft2RateBUA: formData?.ft2RateBUA || 0,
          // Detailed proposal data
          modules: formData?.modules || [],
          milestones: formData?.milestones || [],
          materials: formData?.materials || [],
          labour: formData?.labour || [],
          estimationModel: formData?.estimationModel || 'single-module', // Save estimation model
          overheads: formData?.overheadCalculations || {},
          siteCosts: formData?.siteCosts || [],
          logistics: formData?.logistics || [],
          commission: formData?.commission || 0,
          commissionItems: formData?.commissionItems || [],
          marginPercentage: formData?.marginPercentage || 0,
          revenueCenters: (() => {
            const rc = formData?.revenueCenters;
            // CRITICAL FIX: Ensure revenueCenters is always an object, never an array
            if (rc && typeof rc === 'object' && !Array.isArray(rc)) {
              return rc;
            }
            return {
              revenueType: 'chargeable',
              chargeableData: {},
              marginPercentages: {},
              totalMarginPercent: 0
            };
          })(),
          financing: formData?.financing || {},
          risks: formData?.risks || [],
          paymentTerms: formData?.paymentTerms || {},
          // Additional Scope data
          internalValueAddedScope: formData?.internalValueAddedScope || [],
          marginedSubContractors: formData?.marginedSubContractors || [],
          zeroMarginedSupply: formData?.zeroMarginedSupply || [],
          // Project Details data
          projectDetails: {
            clientId: formData?.clientId || '',
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
          // Project Duration data
          projectDuration: {
            design: formData?.design || {},
            procurement: formData?.procurement || {},
            production: formData?.production || {}
          }
        }
      };

      if (proposalIdToUse) {
        // Use saveQueue if enabled, otherwise direct save
        if (SAVE_QUEUE_ENABLED) {
          await saveQueue?.enqueueSave(saveData, {
            priority: 'high', // Manual saves get high priority
            onSuccess: () => {
              if (isMountedRef?.current) {
                clearTimeout(saveTimeoutRef?.current);
                setAutoSaveStatus('saved');
                setLastSaved(new Date());
                setHasBeenSavedOnce(true);
                // CRITICAL FIX: Ensure currentProposalId and sessionStorage are set
                if (!currentProposalId && proposalIdToUse) {
                  setCurrentProposalId(proposalIdToUse);
                  sessionStorage.setItem('currentProposalId', proposalIdToUse);
                }
                addToast({
                  type: 'success',
                  title: 'Proposal Saved',
                  message: 'Your proposal has been saved successfully.',
                });
              }
            },
            onError: (error) => {
              if (isMountedRef?.current) {
                clearTimeout(saveTimeoutRef?.current);
                console.error('Manual save failed:', error);
                setAutoSaveStatus('error');
                addToast({
                  type: 'error',
                  title: 'Manual Save Failed',
                  message: error?.message || 'Failed to save proposal manually.',
                });
              }
            }
          });
        } else {
          // Direct save without queue
          const { data: updatedProposal, error } = await proposalService?.updateProposal(proposalIdToUse, saveData?.data);
          
          if (error) {
            throw error;
          }
          
          if (isMountedRef?.current) {
            clearTimeout(saveTimeoutRef?.current);
            setAutoSaveStatus('saved');
            setLastSaved(new Date());
            setHasBeenSavedOnce(true);
            // CRITICAL FIX: Ensure currentProposalId and sessionStorage are set
            if (!currentProposalId && proposalIdToUse) {
              setCurrentProposalId(proposalIdToUse);
              sessionStorage.setItem('currentProposalId', proposalIdToUse);
            }
            addToast({
              type: 'success',
              title: 'Proposal Saved',
              message: 'Your proposal has been saved successfully.',
            });
          }
        }
      } else {
        // Create new proposal
        const newProposal = await proposalService?.createProposal({
          title: formData?.projectTitle || 'Untitled Proposal',
          projectName: formData?.projectTitle || 'Untitled Proposal',
          description: formData?.projectType || '',
          value: calculateChargeableValue() ?? 0,
          estimatedTotalBudget: calculateChargeableValue() ?? 0,
          progress: calculateProgress() ?? 0,
          deadline: formData?.endDate || null,
          startDate: formData?.startDate || null,
          status: 'Draft',
          clientId: formData?.clientId || null,
          ft2RateBUA: formData?.ft2RateBUA || 0,
          // Detailed proposal data
          modules: formData?.modules || [],
          milestones: formData?.milestones || [],
          materials: formData?.materials || [],
          labour: formData?.labour || [],
          estimationModel: formData?.estimationModel || 'single-module', // Save estimation model
          overheads: formData?.overheadCalculations || {},
          siteCosts: formData?.siteCosts || [],
          logistics: formData?.logistics || [],
          commission: formData?.commission || 0,
          commissionItems: formData?.commissionItems || [],
          marginPercentage: formData?.marginPercentage || 0,
          revenueCenters: formData?.revenueCenters || [],
          financing: formData?.financing || {},
          risks: formData?.risks || [],
          paymentTerms: formData?.paymentTerms || {},
          // Additional Scope data
          internalValueAddedScope: formData?.internalValueAddedScope || [],
          marginedSubContractors: formData?.marginedSubContractors || [],
          zeroMarginedSupply: formData?.zeroMarginedSupply || [],
          // Project Details data
          projectDetails: {
            clientId: formData?.clientId || '',
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
          // Project Duration data
          projectDuration: {
            design: formData?.design || {},
            procurement: formData?.procurement || {},
            production: formData?.production || {}
          }
        });
        
        // CRITICAL FIX: Set proposal ID after creation
        if (isMountedRef?.current && newProposal?.id) {
          setCurrentProposalId(newProposal?.id);
          sessionStorage.setItem('currentProposalId', newProposal?.id);
          console.log('New proposal created with ID:', newProposal?.id);
        } else if (!newProposal?.id) {
          throw new Error('Proposal could not be created. Please check your connection and try again.');
        }
      }

      // CRITICAL FIX: Only update status if component is still mounted
      if (isMountedRef?.current) {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        setHasBeenSavedOnce(true);
        addToast({
          type: 'success',
          title: 'Proposal Saved',
          message: 'Your proposal has been saved successfully.',
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      if (isMountedRef?.current) {
        setAutoSaveStatus('unsaved');
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: error?.message || 'Failed to save proposal. Please try again.',
        });
      }
    }
  }, [getProposalId, isLoadingProposal, formData, SAVE_QUEUE_ENABLED, saveQueue, currentProposalId, isMountedRef, addToast, calculateChargeableValue, calculateProgress]);

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
      const total = parseFloat(item?.totalCost) || 0;
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
        const costPerSqFtTotal = materials?.reduce((sum, item) => {
          const costWastePSQF = parseFloat(item?.costWastePSQF) || 0;
          console.log('Material:', { description: item?.description, costWastePSQF });
          return sum + costWastePSQF;
        }, 0);
        console.log('Cost Per Sq Ft Total ($ / Ft² / W Total):', costPerSqFtTotal);

        // Project Mod Total = costPerSqFtTotal × totalAreaFt2
        const projectModTotal = costPerSqFtTotal * totalAreaFt2;
        console.log('Materials Total (Project Mod Total = costPerSqFtTotal × totalAreaFt2):', projectModTotal);
        return projectModTotal;
      })();

      // Add Labour Total
      labourTotal = (formData?.labour || [])?.reduce((sum, item) => {
        const total = parseFloat(item?.total) || 0;
        console.log('Labour:', { description: item?.description, total });
        return sum + total;
      }, 0);
      console.log('Labour Total:', labourTotal);
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
  }, [formData?.modules, formData?.internalValueAddedScope, formData?.siteCosts, formData?.materials, formData?.labour, formData?.marginedSubContractors, formData?.zeroMarginedSupply, formData?.logistics, formData?.revenueCenters?.revenueType]);

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
    // CRITICAL FIX: Read directly from formData.revenueCenters.grandTotal
    // Revenue Centers tab already calculates and saves this value
    // No need to recalculate - just display what was saved
    const grandTotal = formData?.revenueCenters?.grandTotal || 0;
    const areas = calculateModuleTotalAreas();

    const m2RateBUA = areas?.m2 > 0 ? grandTotal / areas?.m2 : 0;
    const ft2RateBUA = areas?.ft2 > 0 ? grandTotal / areas?.ft2 : 0;

    return { m2RateBUA, ft2RateBUA };
  }, [formData?.revenueCenters?.grandTotal, calculateModuleTotalAreas]);

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
                    <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateChargeableValueWithoutZeroRate())}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-1">Ft² Rate BUA</p>
                    <p className="text-2xl font-bold dark:text-foreground">${formatNumber(calculateChargeableValue())}</p>
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
          <RevenueCentersTab formData={formData} onChange={handleChange} errors={{}} />
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
              </div>

              {/* Auto-save Status & Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <Icon
                    name={getAutoSaveIcon()}
                    size={16}
                    className={autoSaveStatus === 'saving' ? 'animate-spin' : ''}
                  />
                  <span>{getAutoSaveText()}</span>
                </div>
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
      </div>
    </>
  );
};

export default NewProposalCreationWorkspace;
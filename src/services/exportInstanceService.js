import { supabase } from '../lib/supabase';
import { getAuthUser } from '../lib/supabase';

// ============================================================
// EXPORT INSTANCE SERVICE
// CRUD for proposal_export_instances + file storage
// ============================================================

const handleError = (error, context) => {
  console.error(`[exportInstanceService] ${context}:`, error);
  throw error;
};

const mapInstance = (row) => ({
  id: row?.id,
  templateId: row?.template_id,
  proposalId: row?.proposal_id,
  customLayoutJson: row?.custom_layout_json,
  generatedFiles: row?.generated_files || [],
  createdBy: row?.created_by,
  createdAt: row?.created_at,
  lastModified: row?.last_modified,
  // joined data
  template: row?.template || null,
  proposal: row?.proposal || null,
});

// ---- Create a new export instance ----
export const createExportInstance = async ({ templateId, proposalId, customLayoutJson }) => {
  const user = await getAuthUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    ?.from('proposal_export_instances')
    ?.insert({
      template_id: templateId,
      proposal_id: proposalId,
      custom_layout_json: customLayoutJson || {},
      generated_files: [],
      created_by: user?.id,
    })
    ?.select()
    ?.single();

  if (error) handleError(error, 'createExportInstance');
  return mapInstance(data);
};

// ---- Get all instances for a proposal ----
export const getInstancesByProposal = async (proposalId) => {
  const { data, error } = await supabase
    ?.from('proposal_export_instances')
    ?.select(`
      *,
      template:export_templates(id, name, template_type, layout_config)
    `)
    ?.eq('proposal_id', proposalId)
    ?.order('last_modified', { ascending: false });

  if (error) handleError(error, 'getInstancesByProposal');
  return (data || [])?.map(mapInstance);
};

// ---- Get a single instance by ID ----
export const getInstanceById = async (instanceId) => {
  const { data, error } = await supabase
    ?.from('proposal_export_instances')
    ?.select(`
      *,
      template:export_templates(id, name, template_type, layout_config, cover_page_settings, header_settings, footer_settings),
      proposal:proposals(id, title, project_name, project_number, status, value, client_id)
    `)
    ?.eq('id', instanceId)
    ?.single();

  if (error) handleError(error, 'getInstanceById');
  return mapInstance(data);
};

// ---- Update the custom layout of an instance ----
export const updateInstanceLayout = async (instanceId, customLayoutJson) => {
  const { data, error } = await supabase
    ?.from('proposal_export_instances')
    ?.update({ custom_layout_json: customLayoutJson })
    ?.eq('id', instanceId)
    ?.select()
    ?.single();

  if (error) handleError(error, 'updateInstanceLayout');
  return mapInstance(data);
};

// ---- Append a generated file URL to the instance ----
export const appendGeneratedFile = async (instanceId, fileEntry) => {
  // First fetch current files
  const { data: current, error: fetchErr } = await supabase
    ?.from('proposal_export_instances')
    ?.select('generated_files')
    ?.eq('id', instanceId)
    ?.single();

  if (fetchErr) handleError(fetchErr, 'appendGeneratedFile - fetch');

  const existing = current?.generated_files || [];
  const updated = [...existing, fileEntry];

  const { data, error } = await supabase
    ?.from('proposal_export_instances')
    ?.update({ generated_files: updated })
    ?.eq('id', instanceId)
    ?.select()
    ?.single();

  if (error) handleError(error, 'appendGeneratedFile - update');
  return mapInstance(data);
};

// ---- Delete an instance ----
export const deleteInstance = async (instanceId) => {
  const { error } = await supabase
    ?.from('proposal_export_instances')
    ?.delete()
    ?.eq('id', instanceId);

  if (error) handleError(error, 'deleteInstance');
  return true;
};

// ---- Upload a generated file to Supabase Storage ----
export const uploadExportFile = async (instanceId, file, fileName) => {
  const user = await getAuthUser();
  if (!user) throw new Error('Not authenticated');

  const filePath = `${user?.id}/${instanceId}/${fileName}`;

  const { data, error } = await supabase?.storage
    ?.from('proposal-exports')
    ?.upload(filePath, file, { upsert: true });

  if (error) handleError(error, 'uploadExportFile');

  // Get signed URL (private bucket)
  const { data: signedData, error: signedErr } = await supabase?.storage
    ?.from('proposal-exports')
    ?.createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

  if (signedErr) handleError(signedErr, 'uploadExportFile - signedUrl');

  return {
    path: filePath,
    signedUrl: signedData?.signedUrl,
    fileName,
    uploadedAt: new Date()?.toISOString(),
  };
};

// ---- Search proposals by name, project_number, or client name ----
export const searchProposals = async (query) => {
  if (!query || query?.trim()?.length < 1) return [];

  const user = await getAuthUser();
  if (!user) throw new Error('Not authenticated');

  const term = query?.trim();

  // Search proposals by title or project_number
  const { data: proposalData, error: proposalError } = await supabase
    ?.from('proposals')
    ?.select(`
      id,
      title,
      project_name,
      project_number,
      status,
      value,
      client_id,
      created_at,
      client:clients!client_id(id, company_name, primary_contact)
    `)
    ?.eq('user_id', user?.id)
    ?.or(`title.ilike.%${term}%,project_number.ilike.%${term}%,project_name.ilike.%${term}%`)
    ?.order('created_at', { ascending: false })
    ?.limit(20);

  if (proposalError) {
    // Fallback without client join
    const { data: plain, error: plainErr } = await supabase
      ?.from('proposals')
      ?.select('id, title, project_name, project_number, status, value, client_id, created_at')
      ?.eq('user_id', user?.id)
      ?.or(`title.ilike.%${term}%,project_number.ilike.%${term}%,project_name.ilike.%${term}%`)
      ?.order('created_at', { ascending: false })
      ?.limit(20);

    if (plainErr) handleError(plainErr, 'searchProposals - fallback');
    return plain || [];
  }

  // Also search by client company name
  const { data: clientData } = await supabase
    ?.from('proposals')
    ?.select(`
      id,
      title,
      project_name,
      project_number,
      status,
      value,
      client_id,
      created_at,
      client:clients!client_id(id, company_name, primary_contact)
    `)
    ?.eq('user_id', user?.id)
    ?.order('created_at', { ascending: false })
    ?.limit(50);

  // Filter client matches in JS (since we can't filter on joined columns directly)
  const clientMatches = (clientData || [])?.filter(p =>
    p?.client?.company_name?.toLowerCase()?.includes(term?.toLowerCase()) ||
    p?.client?.primary_contact?.toLowerCase()?.includes(term?.toLowerCase())
  );

  // Merge and deduplicate
  const allResults = [...(proposalData || []), ...clientMatches];
  const seen = new Set();
  return allResults?.filter(p => {
    if (seen?.has(p?.id)) return false;
    seen?.add(p?.id);
    return true;
  })?.slice(0, 20);
};

const exportInstanceService = {
  createExportInstance,
  getInstancesByProposal,
  getInstanceById,
  updateInstanceLayout,
  appendGeneratedFile,
  deleteInstance,
  uploadExportFile,
  searchProposals,
};

export default exportInstanceService;

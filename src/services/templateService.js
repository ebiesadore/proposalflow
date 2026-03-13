import { supabase } from '../lib/supabase';
import { getAuthUser } from '../lib/supabase';

// ============================================================
// TEMPLATE SERVICE
// Full CRUD for material_labour_templates, template_material_items,
// template_labour_items, and export_templates
// ============================================================

// ---- Helpers ----

const handleError = (error, context) => {
  console.error(`[templateService] ${context}:`, error);
  throw error;
};

const mapMaterialItem = (m) => ({
  id: m?.id,
  templateId: m?.template_id,
  itemName: m?.item_name,
  libraryItemId: m?.library_item_id,
  no: m?.no,
  supplier: m?.supplier,
  unit: m?.unit,
  quantity: m?.quantity,
  unitCost: m?.unit_cost,
  wastePercent: m?.waste_percent,
  costPsqf: m?.cost_psqf,
  costWastePsqf: m?.cost_waste_psqf,
  costWastePsqm: m?.cost_waste_psqm,
  perModulePrice: m?.per_module_price,
  notes: m?.notes,
  sortOrder: m?.sort_order,
  createdAt: m?.created_at,
});

const mapLabourItem = (l) => ({
  id: l?.id,
  templateId: l?.template_id,
  materialId: l?.material_id,
  role: l?.role,
  hours: l?.hours,
  rate: l?.rate,
  total: l?.total,
  labourCostPsqf: l?.labour_cost_psqf,
  notes: l?.notes,
  sortOrder: l?.sort_order,
  createdAt: l?.created_at,
});

// Convert DB snake_case template to camelCase
const mapTemplate = (t) => ({
  id: t?.id,
  name: t?.name,
  description: t?.description,
  category: t?.category,
  templateType: t?.template_type,
  isActive: t?.is_active,
  createdBy: t?.created_by,
  createdAt: t?.created_at,
  updatedAt: t?.updated_at,
  materialItems: (t?.template_material_items || [])?.map(mapMaterialItem),
  labourItems: (t?.template_labour_items || [])?.map(mapLabourItem),
});

const mapExportTemplate = (e) => ({
  id: e?.id,
  name: e?.name,
  templateType: e?.template_type,
  layoutConfig: e?.layout_config,
  coverPageSettings: e?.cover_page_settings,
  headerSettings: e?.header_settings,
  footerSettings: e?.footer_settings,
  isDefault: e?.is_default,
  isActive: e?.is_active,
  createdBy: e?.created_by,
  createdAt: e?.created_at,
  updatedAt: e?.updated_at,
});

// ============================================================
// MATERIAL & LABOUR TEMPLATES — CRUD
// ============================================================

/**
 * Create a new material/labour template
 * @param {Object} templateData - { name, description, category, templateType }
 * @returns {Object} Created template
 */
export const createTemplate = async (templateData) => {
  const user = await getAuthUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase?.from('material_labour_templates')?.insert({
      name: templateData?.name,
      description: templateData?.description || null,
      category: templateData?.category || null,
      template_type: templateData?.templateType || 'combined',
      is_active: templateData?.isActive !== undefined ? templateData?.isActive : true,
      created_by: user?.id,
    })?.select()?.single();

  if (error) handleError(error, 'createTemplate');
  return mapTemplate(data);
};

/**
 * Get all templates for the current user
 * @param {Object} filters - { templateType, isActive, category }
 * @returns {Array} List of templates
 */
export const getTemplates = async (filters = {}) => {
  let query = supabase?.from('material_labour_templates')?.select(`
      *,
      template_material_items(*),
      template_labour_items(*)
    `)?.order('created_at', { ascending: false });

  if (filters?.templateType) {
    query = query?.eq('template_type', filters?.templateType);
  }
  if (filters?.isActive !== undefined) {
    query = query?.eq('is_active', filters?.isActive);
  }
  if (filters?.category) {
    query = query?.eq('category', filters?.category);
  }

  const { data, error } = await query;
  if (error) handleError(error, 'getTemplates');
  return (data || [])?.map(mapTemplate);
};

/**
 * Get a single template by ID with all items
 * @param {string} templateId
 * @returns {Object} Template with materialItems and labourItems
 */
export const getTemplateById = async (templateId) => {
  const { data, error } = await supabase?.from('material_labour_templates')?.select(`
      *,
      template_material_items(*),
      template_labour_items(*)
    `)?.eq('id', templateId)?.single();

  if (error) handleError(error, 'getTemplateById');
  return mapTemplate(data);
};

/**
 * Update a template's metadata
 * @param {string} templateId
 * @param {Object} updates - { name, description, category, templateType, isActive }
 * @returns {Object} Updated template
 */
export const updateTemplate = async (templateId, updates) => {
  const updatePayload = {};
  if (updates?.name !== undefined) updatePayload.name = updates?.name;
  if (updates?.description !== undefined) updatePayload.description = updates?.description;
  if (updates?.category !== undefined) updatePayload.category = updates?.category;
  if (updates?.templateType !== undefined) updatePayload.template_type = updates?.templateType;
  if (updates?.isActive !== undefined) updatePayload.is_active = updates?.isActive;

  const { data, error } = await supabase?.from('material_labour_templates')?.update(updatePayload)?.eq('id', templateId)?.select()?.single();

  if (error) handleError(error, 'updateTemplate');
  return mapTemplate(data);
};

/**
 * Delete a template and all its items (cascade)
 * @param {string} templateId
 */
export const deleteTemplate = async (templateId) => {
  const { error } = await supabase?.from('material_labour_templates')?.delete()?.eq('id', templateId);

  if (error) handleError(error, 'deleteTemplate');
  return true;
};

/**
 * Duplicate a template with all its items
 * @param {string} templateId
 * @param {string} newName - Optional new name (defaults to "Copy of <original>")
 * @returns {Object} New duplicated template
 */
export const duplicateTemplate = async (templateId, newName) => {
  // Fetch original template with all items
  const original = await getTemplateById(templateId);

  // Create new template
  const newTemplate = await createTemplate({
    name: newName || `Copy of ${original?.name}`,
    description: original?.description,
    category: original?.category,
    templateType: original?.templateType,
    isActive: original?.isActive,
  });

  // Duplicate material items
  if (original?.materialItems?.length > 0) {
    const materialInserts = original?.materialItems?.map((item) => ({
      template_id: newTemplate?.id,
      item_name: item?.itemName,
      library_item_id: item?.libraryItemId || null,
      no: item?.no,
      supplier: item?.supplier || null,
      unit: item?.unit || null,
      quantity: item?.quantity || 0,
      unit_cost: item?.unitCost || 0,
      waste_percent: item?.wastePercent || 5,
      cost_psqf: item?.costPsqf || 0,
      cost_waste_psqf: item?.costWastePsqf || 0,
      cost_waste_psqm: item?.costWastePsqm || 0,
      per_module_price: item?.perModulePrice || 0,
      notes: item?.notes || null,
      sort_order: item?.sortOrder || 0,
    }));

    const { error: matError } = await supabase?.from('template_material_items')?.insert(materialInserts);

    if (matError) handleError(matError, 'duplicateTemplate - material items');
  }

  // Duplicate labour items
  if (original?.labourItems?.length > 0) {
    const labourInserts = original?.labourItems?.map((item) => ({
      template_id: newTemplate?.id,
      role: item?.role,
      hours: item?.hours || 0,
      rate: item?.rate || 0,
      total: item?.total || 0,
      labour_cost_psqf: item?.labourCostPsqf || 0,
      notes: item?.notes || null,
      sort_order: item?.sortOrder || 0,
    }));

    const { error: labError } = await supabase?.from('template_labour_items')?.insert(labourInserts);

    if (labError) handleError(labError, 'duplicateTemplate - labour items');
  }

  // Return the full duplicated template
  return getTemplateById(newTemplate?.id);
};

// ============================================================
// TEMPLATE MATERIAL ITEMS — CRUD
// ============================================================

/**
 * Add a material item to a template
 * @param {string} templateId
 * @param {Object} itemData - material item fields
 * @returns {Object} Created material item
 */
export const addMaterialItem = async (templateId, itemData) => {
  const { data, error } = await supabase?.from('template_material_items')?.insert({
      template_id: templateId,
      item_name: itemData?.itemName || '',
      library_item_id: itemData?.libraryItemId || null,
      no: itemData?.no || 1,
      supplier: itemData?.supplier || null,
      unit: itemData?.unit || null,
      quantity: itemData?.quantity || 0,
      unit_cost: itemData?.unitCost || 0,
      waste_percent: itemData?.wastePercent || 5,
      cost_psqf: itemData?.costPsqf || 0,
      cost_waste_psqf: itemData?.costWastePsqf || 0,
      cost_waste_psqm: itemData?.costWastePsqm || 0,
      per_module_price: itemData?.perModulePrice || 0,
      notes: itemData?.notes || null,
      sort_order: itemData?.sortOrder || 0,
    })?.select()?.single();

  if (error) handleError(error, 'addMaterialItem');
  return mapMaterialItem(data);
};

/**
 * Update a material item in a template
 * @param {string} itemId
 * @param {Object} updates - partial material item fields
 * @returns {Object} Updated material item
 */
export const updateMaterialItem = async (itemId, updates) => {
  const updatePayload = {};
  if (updates?.itemName !== undefined) updatePayload.item_name = updates?.itemName;
  if (updates?.libraryItemId !== undefined) updatePayload.library_item_id = updates?.libraryItemId;
  if (updates?.no !== undefined) updatePayload.no = updates?.no;
  if (updates?.supplier !== undefined) updatePayload.supplier = updates?.supplier;
  if (updates?.unit !== undefined) updatePayload.unit = updates?.unit;
  if (updates?.quantity !== undefined) updatePayload.quantity = updates?.quantity;
  if (updates?.unitCost !== undefined) updatePayload.unit_cost = updates?.unitCost;
  if (updates?.wastePercent !== undefined) updatePayload.waste_percent = updates?.wastePercent;
  if (updates?.costPsqf !== undefined) updatePayload.cost_psqf = updates?.costPsqf;
  if (updates?.costWastePsqf !== undefined) updatePayload.cost_waste_psqf = updates?.costWastePsqf;
  if (updates?.costWastePsqm !== undefined) updatePayload.cost_waste_psqm = updates?.costWastePsqm;
  if (updates?.perModulePrice !== undefined) updatePayload.per_module_price = updates?.perModulePrice;
  if (updates?.notes !== undefined) updatePayload.notes = updates?.notes;
  if (updates?.sortOrder !== undefined) updatePayload.sort_order = updates?.sortOrder;

  const { data, error } = await supabase?.from('template_material_items')?.update(updatePayload)?.eq('id', itemId)?.select()?.single();

  if (error) handleError(error, 'updateMaterialItem');
  return mapMaterialItem(data);
};

/**
 * Delete a material item from a template
 * @param {string} itemId
 */
export const deleteMaterialItem = async (itemId) => {
  const { error } = await supabase?.from('template_material_items')?.delete()?.eq('id', itemId);

  if (error) handleError(error, 'deleteMaterialItem');
  return true;
};

// ============================================================
// TEMPLATE LABOUR ITEMS — CRUD
// ============================================================

/**
 * Add a labour item to a template
 * @param {string} templateId
 * @param {Object} itemData - labour item fields
 * @returns {Object} Created labour item
 */
export const addLabourItem = async (templateId, itemData) => {
  const { data, error } = await supabase?.from('template_labour_items')?.insert({
      template_id: templateId,
      role: itemData?.role || '',
      hours: itemData?.hours || 0,
      rate: itemData?.rate || 0,
      total: itemData?.total || 0,
      labour_cost_psqf: itemData?.labourCostPsqf || 0,
      notes: itemData?.notes || null,
      sort_order: itemData?.sortOrder || 0,
    })?.select()?.single();

  if (error) handleError(error, 'addLabourItem');
  return mapLabourItem(data);
};

/**
 * Update a labour item in a template
 * @param {string} itemId
 * @param {Object} updates - partial labour item fields
 * @returns {Object} Updated labour item
 */
export const updateLabourItem = async (itemId, updates) => {
  const updatePayload = {};
  if (updates?.role !== undefined) updatePayload.role = updates?.role;
  if (updates?.hours !== undefined) updatePayload.hours = updates?.hours;
  if (updates?.rate !== undefined) updatePayload.rate = updates?.rate;
  if (updates?.total !== undefined) updatePayload.total = updates?.total;
  if (updates?.labourCostPsqf !== undefined) updatePayload.labour_cost_psqf = updates?.labourCostPsqf;
  if (updates?.notes !== undefined) updatePayload.notes = updates?.notes;
  if (updates?.sortOrder !== undefined) updatePayload.sort_order = updates?.sortOrder;

  const { data, error } = await supabase?.from('template_labour_items')?.update(updatePayload)?.eq('id', itemId)?.select()?.single();

  if (error) handleError(error, 'updateLabourItem');
  return mapLabourItem(data);
};

/**
 * Delete a labour item from a template
 * @param {string} itemId
 */
export const deleteLabourItem = async (itemId) => {
  const { error } = await supabase?.from('template_labour_items')?.delete()?.eq('id', itemId);

  if (error) handleError(error, 'deleteLabourItem');
  return true;
};

// ============================================================
// EXPORT TEMPLATES — CRUD
// ============================================================

/**
 * Create a new export template
 * @param {Object} templateData - export template fields
 * @returns {Object} Created export template
 */
export const createExportTemplate = async (templateData) => {
  const user = await getAuthUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase?.from('export_templates')?.insert({
      name: templateData?.name,
      template_type: templateData?.templateType || 'pdf',
      layout_config: templateData?.layoutConfig || {},
      cover_page_settings: templateData?.coverPageSettings || {},
      header_settings: templateData?.headerSettings || {},
      footer_settings: templateData?.footerSettings || {},
      is_default: templateData?.isDefault || false,
      is_active: templateData?.isActive !== undefined ? templateData?.isActive : true,
      created_by: user?.id,
    })?.select()?.single();

  if (error) handleError(error, 'createExportTemplate');
  return mapExportTemplate(data);
};

/**
 * Get all export templates for the current user
 * @param {Object} filters - { templateType, isDefault, isActive }
 * @returns {Array} List of export templates
 */
export const getExportTemplates = async (filters = {}) => {
  let query = supabase?.from('export_templates')?.select('*')?.order('created_at', { ascending: false });

  if (filters?.templateType) {
    query = query?.eq('template_type', filters?.templateType);
  }
  if (filters?.isDefault !== undefined) {
    query = query?.eq('is_default', filters?.isDefault);
  }
  if (filters?.isActive !== undefined) {
    query = query?.eq('is_active', filters?.isActive);
  }

  const { data, error } = await query;
  if (error) handleError(error, 'getExportTemplates');
  return (data || [])?.map(mapExportTemplate);
};

/**
 * Get a single export template by ID
 * @param {string} exportTemplateId
 * @returns {Object} Export template
 */
export const getExportTemplateById = async (exportTemplateId) => {
  const { data, error } = await supabase?.from('export_templates')?.select('*')?.eq('id', exportTemplateId)?.single();

  if (error) handleError(error, 'getExportTemplateById');
  return mapExportTemplate(data);
};

/**
 * Update an export template
 * @param {string} exportTemplateId
 * @param {Object} updates - partial export template fields
 * @returns {Object} Updated export template
 */
export const updateExportTemplate = async (exportTemplateId, updates) => {
  const updatePayload = {};
  if (updates?.name !== undefined) updatePayload.name = updates?.name;
  if (updates?.templateType !== undefined) updatePayload.template_type = updates?.templateType;
  if (updates?.layoutConfig !== undefined) updatePayload.layout_config = updates?.layoutConfig;
  if (updates?.coverPageSettings !== undefined) updatePayload.cover_page_settings = updates?.coverPageSettings;
  if (updates?.headerSettings !== undefined) updatePayload.header_settings = updates?.headerSettings;
  if (updates?.footerSettings !== undefined) updatePayload.footer_settings = updates?.footerSettings;
  if (updates?.isDefault !== undefined) updatePayload.is_default = updates?.isDefault;
  if (updates?.isActive !== undefined) updatePayload.is_active = updates?.isActive;

  const { data, error } = await supabase?.from('export_templates')?.update(updatePayload)?.eq('id', exportTemplateId)?.select()?.single();

  if (error) handleError(error, 'updateExportTemplate');
  return mapExportTemplate(data);
};

/**
 * Delete an export template
 * @param {string} exportTemplateId
 */
export const deleteExportTemplate = async (exportTemplateId) => {
  const { error } = await supabase?.from('export_templates')?.delete()?.eq('id', exportTemplateId);

  if (error) handleError(error, 'deleteExportTemplate');
  return true;
};

// Default export as a service object
const templateService = {
  // Material & Labour Templates
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  // Material Items
  addMaterialItem,
  updateMaterialItem,
  deleteMaterialItem,
  // Labour Items
  addLabourItem,
  updateLabourItem,
  deleteLabourItem,
  // Export Templates
  createExportTemplate,
  getExportTemplates,
  getExportTemplateById,
  updateExportTemplate,
  deleteExportTemplate,
};

export default templateService;

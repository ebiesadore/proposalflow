import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VALID_CATEGORIES = [
  '00_Procurement and Contracting Requirements',
  '01_General Requirements',
  '02_Existing Conditions',
  '03_Concrete',
  '04_Masonry',
  '05_Metals',
  '06_Wood, Plastics, and Composites',
  '07_Thermal and Moisture Protection',
  '08_Openings',
  '09_Finishes',
  '10_Specialties',
  '11_Equipment',
  '12_Furnishings',
  '13_Special Construction',
  '14_Conveying Equipment',
  '21_Fire Suppression',
  '22_Plumbing',
  '23_HVAC',
  '25_Integrated Automation',
  '26_Electrical',
  '27_Communications',
  '28_Electronic Safety and Security',
  '31_Earthwork',
  '32_Exterior Improvements',
  '33_Utilities',
  '34_Transportation',
  '35_Waterway and Marine Construction',
  '40_Process Integration',
  '41_Material Processing and Handling Equipment',
  '42_Process Heating, Cooling, and Drying Equipment',
  '43_Process Gas and Liquid Handling',
  '44_Pollution and Waste Control Equipment',
  '45_Industry-Specific Manufacturing Equipment',
  '46_Water and Wastewater Equipment',
  '48_Electrical Power Generation',
];

const VALID_UNITS = ['m', 'ft', 'sqm', 'sqft', 'cum', 'cuft', 'kg', 'lb', 'L', 'gal', 'piece', 'box', 'roll', 'sheet'];

const TEMPLATE_HEADERS = ['Name', 'Category', 'Unit', 'Unit Cost', 'CSI Code', 'Description', 'Supplier', 'Notes'];

const EXAMPLE_ROWS = [
  {
    Name: 'Portland Cement Type I',
    Category: '03_Concrete',
    Unit: 'kg',
    'Unit Cost': 0.45,
    'CSI Code': '03.10.00',
    Description: 'Standard Portland cement for general concrete work',
    Supplier: 'ABC Building Supplies',
    Notes: 'Store in dry conditions',
  },
  {
    Name: 'Structural Steel W8x31',
    Category: '05_Metals',
    Unit: 'ft',
    'Unit Cost': 28.5,
    'CSI Code': '05.12.00',
    Description: 'Wide flange structural steel beam',
    Supplier: 'Steel Direct Inc.',
    Notes: 'Check lead time 4-6 weeks',
  },
  {
    Name: 'Gypsum Board 5/8"',
    Category: '09_Finishes',
    Unit: 'sheet',
    'Unit Cost': 14.75,
    'CSI Code': '09.29.00',
    Description: 'Type X fire-rated gypsum wallboard 4x8',
    Supplier: 'Drywall Depot',
    Notes: '',
  },
];

function validateRow(row, index) {
  const errors = [];

  if (!row?.Name || String(row?.Name)?.trim() === '') {
    errors?.push('Name is required');
  }

  if (!row?.Category || String(row?.Category)?.trim() === '') {
    errors?.push('Category is required');
  } else if (!VALID_CATEGORIES?.includes(String(row?.Category)?.trim())) {
    errors?.push(`Invalid category "${row?.Category}"`);
  }

  if (!row?.Unit || String(row?.Unit)?.trim() === '') {
    errors?.push('Unit is required');
  } else if (!VALID_UNITS?.includes(String(row?.Unit)?.trim())) {
    errors?.push(`Invalid unit "${row?.Unit}" (valid: ${VALID_UNITS?.join(', ')})`);
  }

  const cost = parseFloat(row?.['Unit Cost']);
  if (row?.['Unit Cost'] === undefined || row?.['Unit Cost'] === null || row?.['Unit Cost'] === '') {
    errors?.push('Unit Cost is required');
  } else if (isNaN(cost) || cost < 0) {
    errors?.push('Unit Cost must be a non-negative number');
  }

  return errors;
}

function parseRowToMaterial(row) {
  const name = String(row?.Name || '')?.trim();
  const category = String(row?.Category || '')?.trim();
  const unit = String(row?.Unit || '')?.trim();
  const unitCost = parseFloat(row?.['Unit Cost']) || 0;
  const csiCode = String(row?.['CSI Code'] || '')?.trim();
  const description = String(row?.Description || '')?.trim();
  const supplier = String(row?.Supplier || '')?.trim();
  const notes = String(row?.Notes || '')?.trim();

  // Build description with supplier/notes appended if present
  let fullDescription = description;
  if (supplier) fullDescription += (fullDescription ? ' | ' : '') + `Supplier: ${supplier}`;
  if (notes) fullDescription += (fullDescription ? ' | ' : '') + `Notes: ${notes}`;

  // Parse CSI code parts
  const csiParts = csiCode?.split('.');
  const csiCode1 = csiParts?.[1] || '00';
  const csiCode2 = csiParts?.[2] || '00';

  return { name, category, unit, unitCost, csiCode, csiCode1, csiCode2, description: fullDescription };
}

const ImportExportControls = ({ onImportComplete }) => {
  const fileInputRef = useRef(null);
  const [previewRows, setPreviewRows] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAllMaterials = async () => {
    setIsExporting(true);
    try {
      const { supabase } = await import('../../../lib/supabase');

      const { data, error } = await supabase
        ?.from('materials_library')
        ?.select('*')
        ?.order('name', { ascending: true });

      if (error) throw error;

      if (!data || data?.length === 0) {
        alert('No materials found in the library to export.');
        return;
      }

      const rows = data?.map((m) => ({
        Name: m?.name || '',
        Category: m?.category || '',
        Unit: m?.unit || '',
        'Unit Cost': m?.unit_cost ?? '',
        'CSI Code': m?.csi_code || '',
        Description: m?.description || '',
        'Is Active': m?.is_active ? 'Yes' : 'No',
        'Created At': m?.created_at ? new Date(m.created_at)?.toLocaleDateString() : '',
        'Updated At': m?.updated_at ? new Date(m.updated_at)?.toLocaleDateString() : '',
      }));

      const ws = XLSX?.utils?.json_to_sheet(rows, {
        header: ['Name', 'Category', 'Unit', 'Unit Cost', 'CSI Code', 'Description', 'Is Active', 'Created At', 'Updated At'],
      });

      ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 45 }, // Category
        { wch: 10 }, // Unit
        { wch: 12 }, // Unit Cost
        { wch: 12 }, // CSI Code
        { wch: 40 }, // Description
        { wch: 10 }, // Is Active
        { wch: 14 }, // Created At
        { wch: 14 }, // Updated At
      ];

      const wb = XLSX?.utils?.book_new();
      XLSX?.utils?.book_append_sheet(wb, ws, 'Materials');

      const fileName = `materials_library_${new Date()?.toISOString()?.slice(0, 10)}.xlsx`;
      XLSX?.writeFile(wb, fileName);
    } catch (err) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt?.target?.result;
        const workbook = XLSX?.read(data, { type: 'array' });
        const sheetName = workbook?.SheetNames?.[0];
        const worksheet = workbook?.Sheets?.[sheetName];
        const jsonRows = XLSX?.utils?.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows?.length === 0) {
          alert('The file appears to be empty or has no data rows.');
          return;
        }

        const parsed = jsonRows?.map((row, idx) => {
          const errors = validateRow(row, idx);
          return {
            _rowIndex: idx + 2, // 1-based + header row
            _errors: errors,
            _valid: errors?.length === 0,
            ...row,
          };
        });

        setPreviewRows(parsed);
        setIsPreviewOpen(true);
        setImportSummary(null);
      } catch (err) {
        alert(`Failed to parse file: ${err?.message || 'Unknown error'}`);
      }
    };
    reader?.readAsArrayBuffer(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const validRows = previewRows?.filter((r) => r?._valid) || [];
  const errorRows = previewRows?.filter((r) => !r?._valid) || [];

  const handleConfirmImport = async () => {
    if (validRows?.length === 0) return;
    setIsImporting(true);
    setImportSummary(null);

    try {
      const { supabase, getAuthUser } = await import('../../../lib/supabase');
      const user = await getAuthUser();

      let imported = 0;
      let skipped = 0;
      let updated = 0;

      for (const row of validRows) {
        const material = parseRowToMaterial(row);

        // Check for duplicate by name
        const { data: existing } = await supabase
          ?.from('materials_library')
          ?.select('id')
          ?.eq('user_id', user?.id)
          ?.ilike('name', material?.name)
          ?.limit(1);

        const isDuplicate = existing && existing?.length > 0;

        if (isDuplicate) {
          if (duplicateAction === 'skip') {
            skipped++;
            continue;
          } else {
            // Update existing
            const categoryPrefix = material?.category?.substring(0, 2) || '00';
            const code1 = material?.csiCode1?.padStart(2, '0') || '00';
            const code2 = material?.csiCode2?.padStart(2, '0') || '00';
            const csiCode = `${categoryPrefix}.${code1}.${code2}`;

            await supabase
              ?.from('materials_library')
              ?.update({
                description: material?.description || null,
                unit_cost: material?.unitCost,
                unit: material?.unit,
                category: material?.category,
                csi_code: csiCode,
                is_active: true,
                updated_at: new Date()?.toISOString(),
              })
              ?.eq('id', existing?.[0]?.id)
              ?.eq('user_id', user?.id);
            updated++;
            continue;
          }
        }

        // Insert new
        const categoryPrefix = material?.category?.substring(0, 2) || '00';
        const code1 = material?.csiCode1?.padStart(2, '0') || '00';
        const code2 = material?.csiCode2?.padStart(2, '0') || '00';
        const csiCode = `${categoryPrefix}.${code1}.${code2}`;

        await supabase?.from('materials_library')?.insert({
          user_id: user?.id,
          name: material?.name,
          description: material?.description || null,
          unit_cost: material?.unitCost,
          unit: material?.unit,
          category: material?.category,
          csi_code: csiCode,
          is_active: true,
        });
        imported++;
      }

      setImportSummary({ imported, skipped, updated, errors: errorRows?.length });
      setIsPreviewOpen(false);
      setPreviewRows(null);
      onImportComplete?.({ imported, skipped, updated, errors: errorRows?.length });
    } catch (err) {
      alert(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRows(null);
  };

  return (
    <>
      {/* Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExportAllMaterials} disabled={isExporting} title="Export all materials as XLSX">
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Icon name="Download" size={16} className="mr-2" />
              Export All Materials
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef?.current?.click()}
          title="Upload XLS or CSV file"
        >
          <Icon name="Upload" size={16} className="mr-2" />
          Upload XLS/CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && previewRows && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground">Import Preview</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="text-green-600 font-medium">{validRows?.length} valid</span>
                  {' · '}
                  <span className="text-red-500 font-medium">{errorRows?.length} with errors</span>
                  {' · '}
                  {previewRows?.length} total rows
                </p>
              </div>
              <button
                onClick={handleClosePreview}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Duplicate handling */}
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">If duplicate name found:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    value="skip"
                    checked={duplicateAction === 'skip'}
                    onChange={() => setDuplicateAction('skip')}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">Skip (keep existing)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    value="update"
                    checked={duplicateAction === 'update'}
                    onChange={() => setDuplicateAction('update')}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">Update (overwrite existing)</span>
                </label>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-8">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Cost</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">CSI Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows?.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row?._valid ? 'bg-green-50/40 dark:bg-green-950/20' : 'bg-red-50/40 dark:bg-red-950/20'}
                    >
                      <td className="px-3 py-2 text-muted-foreground text-xs">{row?._rowIndex}</td>
                      <td className="px-3 py-2">
                        {row?._valid ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <Icon name="CheckCircle" size={13} />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                            <Icon name="XCircle" size={13} />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground max-w-[160px] truncate">{String(row?.Name || '')}</td>
                      <td className="px-3 py-2 text-foreground max-w-[180px] truncate text-xs">{String(row?.Category || '')}</td>
                      <td className="px-3 py-2 text-foreground">{String(row?.Unit || '')}</td>
                      <td className="px-3 py-2 text-foreground">{row?.['Unit Cost'] !== '' ? `$${parseFloat(row?.['Unit Cost'] || 0)?.toFixed(2)}` : '-'}</td>
                      <td className="px-3 py-2 text-foreground font-mono text-xs">{String(row?.['CSI Code'] || '')}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate text-xs">{String(row?.Description || '')}</td>
                      <td className="px-3 py-2">
                        {row?._errors?.length > 0 && (
                          <ul className="text-xs text-red-600 space-y-0.5">
                            {row?._errors?.map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-border flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                {errorRows?.length > 0 && (
                  <span className="text-amber-600">
                    <Icon name="AlertTriangle" size={14} className="inline mr-1" />
                    {errorRows?.length} row{errorRows?.length !== 1 ? 's' : ''} with errors will be skipped.
                  </span>
                )}
                {validRows?.length === 0 && (
                  <span className="text-red-500">No valid rows to import.</span>
                )}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClosePreview}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={validRows?.length === 0 || isImporting}
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircle" size={16} className="mr-2" />
                      Confirm Import ({validRows?.length} rows)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportExportControls;

import { supabase, getAuthUser } from '../lib/supabase';

const PRIVATE_BUCKET = 'client-documents-private';
const GENERAL_BUCKET = 'client-documents-general';
const SIGNED_URL_EXPIRY = 3600; // 60 minutes

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Sensitive document types go to private bucket
const SENSITIVE_TYPES = ['legal', 'financial'];

function getBucketForType(documentType) {
  return SENSITIVE_TYPES?.includes(documentType) ? PRIVATE_BUCKET : GENERAL_BUCKET;
}

export const clientDocumentService = {
  validateFile(file) {
    if (!file) throw new Error('No file provided');
    if (file?.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 10MB limit. File is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
    }
    if (!ALLOWED_MIME_TYPES?.includes(file?.type)) {
      throw new Error('File type not allowed. Accepted: PDF, DOCX, JPG, PNG, XLSX');
    }
  },

  async uploadDocument({ clientId, file, documentName, documentType, sensitivity, expiryDate }) {
    const user = await getAuthUser();
    this.validateFile(file);

    const bucket = getBucketForType(documentType);
    const ext = file?.name?.split('.')?.pop();
    const fileName = `${Date.now()}-${Math.random()?.toString(36)?.substring(7)}.${ext}`;
    const filePath = `${user?.id}/${clientId}/${documentType}/${fileName}`;

    const { error: uploadError } = await supabase?.storage?.from(bucket)?.upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload file');
    }

    const { data, error: dbError } = await supabase?.from('client_documents')?.insert({
        client_id: clientId,
        document_name: documentName || file?.name,
        document_type: documentType,
        file_path: filePath,
        bucket_name: bucket,
        file_size: file?.size,
        file_type: file?.type,
        sensitivity: sensitivity || (SENSITIVE_TYPES?.includes(documentType) ? 'high' : 'low'),
        expiry_date: expiryDate || null,
        uploaded_by: user?.id,
      })?.select()?.single();

    if (dbError) {
      // Cleanup orphaned storage file
      await supabase?.storage?.from(bucket)?.remove([filePath]);
      throw new Error(dbError.message || 'Failed to save document record');
    }

    return data;
  },

  async getDocumentsByClientId(clientId, filters = {}) {
    let query = supabase?.from('client_documents')?.select('*')?.eq('client_id', clientId)?.order('uploaded_at', { ascending: false });

    if (filters?.documentType && filters?.documentType !== 'all') {
      query = query?.eq('document_type', filters?.documentType);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to load documents');
    return data || [];
  },

  async getSignedUrl(filePath, bucketName) {
    const bucket = bucketName || PRIVATE_BUCKET;
    const { data, error } = await supabase?.storage?.from(bucket)?.createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error) throw new Error(error.message || 'Failed to generate document URL');
    return data?.signedUrl;
  },

  async deleteDocument(documentId) {
    // Fetch record first to get file path and bucket
    const { data: doc, error: fetchError } = await supabase?.from('client_documents')?.select('file_path, bucket_name')?.eq('id', documentId)?.single();

    if (fetchError) throw new Error(fetchError.message || 'Document not found');

    // Delete from storage
    const { error: storageError } = await supabase?.storage?.from(doc?.bucket_name)?.remove([doc?.file_path]);

    if (storageError) {
      console.warn('Storage delete warning:', storageError?.message);
    }

    // Delete DB record
    const { error: dbError } = await supabase?.from('client_documents')?.delete()?.eq('id', documentId);

    if (dbError) throw new Error(dbError.message || 'Failed to delete document');
    return true;
  },
};

export default clientDocumentService;
